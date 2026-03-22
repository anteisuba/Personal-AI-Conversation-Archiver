import type { Database } from 'sql.js'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'pathe'

import type { AppConfig } from '../domain/config.js'
import type { ConversationSource, EnrichedConversation } from '../domain/conversation.js'
import { getAdapter } from '../adapters/index.js'
import { contentHash, estimateTokens, detectLanguage, jobId } from '../utils/index.js'
import { analyzeConversation } from '../../ai/analyzer.js'
import {
  getDb, saveDb,
  insertConversation, updateStage, findByHash,
  insertAnalysis, getAnalysis, updatePublished,
  insertJob, updateJob,
  exportToMarkdown,
  saveRawFile,
} from '../../storage/index.js'
import { resolveHome } from '../domain/config.js'

const TOKEN_LIMIT = 100_000

export interface PipelineCallbacks {
  onProgress?: (current: number, total: number, title: string) => void
  onSkip?: (title: string, reason: string) => void
  onError?: (title: string, error: string) => void
  onComplete?: (stats: PipelineStats) => void
}

export interface PipelineStats {
  total: number
  processed: number
  failed: number
  skipped: number
  published: number
  tooLong: number
  byCategory: Record<string, number>
  estimatedCost: number
}

export interface RunOptions {
  source: ConversationSource
  inputPath: string
  config: AppConfig
  dryRun?: boolean
  overwrite?: boolean
  callbacks?: PipelineCallbacks
}

export async function runPipeline(options: RunOptions): Promise<PipelineStats> {
  const { source, inputPath, config, dryRun = false, overwrite = false, callbacks } = options
  const dataDir = resolveHome(config.dataDir)

  mkdirSync(dataDir, { recursive: true })

  const dbPath = join(dataDir, 'archive.db')
  const db = await getDb(dbPath)

  // 1. Import: parse raw file
  const rawContent = readFileSync(inputPath, 'utf-8')
  const adapter = getAdapter(source, inputPath)
  const conversations = adapter.parse(rawContent)

  // Create job
  const jid = jobId()
  const job = {
    id: jid,
    type: 'run' as const,
    sourcePath: inputPath,
    status: 'running' as const,
    totalItems: conversations.length,
    processedItems: 0,
    failedItems: 0,
    skippedItems: 0,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    lastError: null,
  }
  insertJob(db, job)
  saveDb(db, dbPath)

  // Save raw file
  const rawPath = saveRawFile(dataDir, source, inputPath)

  const stats: PipelineStats = {
    total: conversations.length,
    processed: 0,
    failed: 0,
    skipped: 0,
    published: 0,
    tooLong: 0,
    byCategory: {},
    estimatedCost: 0,
  }

  // Collect tags and projects for wikilinks
  const allTags = new Map<string, string[]>()
  const allProjects = new Map<string, string[]>()

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i]
    callbacks?.onProgress?.(i + 1, conversations.length, conv.title)

    try {
      // 2. Enrich locally
      const enriched: EnrichedConversation = {
        ...conv,
        language: detectLanguage(conv.messages),
        messageCount: conv.messages.length,
        tokenEstimate: estimateTokens(conv.messages),
        contentHash: contentHash(conv.messages),
      }

      // Dedup check
      const existing = findByHash(db, enriched.contentHash)
      if (existing) {
        callbacks?.onSkip?.(conv.title, 'duplicate')
        stats.skipped++
        updateJob(db, jid, { skippedItems: stats.skipped })
        saveDb(db, dbPath)
        continue
      }

      // Insert conversation
      insertConversation(db, enriched, rawPath, jid)
      updateStage(db, enriched.id, 'enriched')
      saveDb(db, dbPath)

      // Too long check
      if (enriched.tokenEstimate > TOKEN_LIMIT) {
        updateStage(db, enriched.id, 'too_long')
        callbacks?.onSkip?.(conv.title, 'too_long')
        stats.tooLong++
        stats.skipped++
        updateJob(db, jid, { skippedItems: stats.skipped })
        saveDb(db, dbPath)
        continue
      }

      if (dryRun) {
        // Estimate cost: ~$0.001 per 1K input tokens for Haiku
        stats.estimatedCost += (enriched.tokenEstimate / 1000) * 0.001
        stats.processed++
        updateJob(db, jid, { processedItems: stats.processed })
        saveDb(db, dbPath)
        continue
      }

      // 3. Analyze with LLM
      const analysis = await analyzeConversation(enriched, {
        model: config.llm.model,
        promptLanguage: config.promptLanguage,
      })
      stats.estimatedCost += (enriched.tokenEstimate / 1000) * 0.001

      // Save analysis
      insertAnalysis(db, enriched.id, analysis)
      updateStage(db, enriched.id, 'analyzed')
      saveDb(db, dbPath)

      // Track for wikilinks
      for (const tag of analysis.tags) {
        const ids = allTags.get(tag) ?? []
        ids.push(enriched.id)
        allTags.set(tag, ids)
      }
      if (analysis.project) {
        const ids = allProjects.get(analysis.project) ?? []
        ids.push(enriched.id)
        allProjects.set(analysis.project, ids)
      }

      // Track category
      stats.byCategory[analysis.category] = (stats.byCategory[analysis.category] ?? 0) + 1

      // 4. Publish to Obsidian
      if (config.vaultDir) {
        const vaultDir = resolveHome(config.vaultDir)
        const result = exportToMarkdown(enriched, analysis, allTags, allProjects, {
          vaultDir,
          overwrite,
        })

        if (result.skipped) {
          callbacks?.onSkip?.(conv.title, 'note exists')
        } else {
          updatePublished(db, enriched.id, result.path)
          updateStage(db, enriched.id, 'published')
          stats.published++
        }
      } else {
        updateStage(db, enriched.id, 'analyzed')
      }

      stats.processed++
      updateJob(db, jid, { processedItems: stats.processed })
      saveDb(db, dbPath)

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      callbacks?.onError?.(conv.title, errMsg)
      stats.failed++

      try {
        updateStage(db, conv.id, 'failed', errMsg)
        updateJob(db, jid, { failedItems: stats.failed, lastError: errMsg })
        saveDb(db, dbPath)
      } catch {
        // DB error during error handling — log but continue
      }
    }
  }

  // Finalize job
  const finalStatus = stats.failed > 0
    ? (stats.processed > 0 ? 'partial' : 'failed')
    : 'completed'
  updateJob(db, jid, {
    status: finalStatus,
    finishedAt: new Date().toISOString(),
  })
  saveDb(db, dbPath)

  callbacks?.onComplete?.(stats)
  return stats
}

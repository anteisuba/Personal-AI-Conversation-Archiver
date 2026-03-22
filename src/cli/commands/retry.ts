import { Command } from 'commander'
import { join } from 'pathe'
import { loadConfig } from '../config-loader.js'
import { resolveHome } from '../../core/domain/config.js'
import {
  getDb, saveDb, findFailed, updateStage,
  getAnalysis, insertAnalysis, updatePublished,
  updateJob, insertJob, exportToMarkdown,
} from '../../storage/index.js'
import { analyzeConversation } from '../../ai/analyzer.js'
import type { EnrichedConversation, Message } from '../../core/domain/conversation.js'
import { jobId } from '../../core/utils/id.js'

export const retryCommand = new Command('retry')
  .description('Retry failed conversations')
  .option('--vault <path>', 'Obsidian vault path (overrides config)')
  .option('--overwrite', 'Overwrite existing notes')
  .action(async (opts: { vault?: string; overwrite?: boolean }) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Error: ANTHROPIC_API_KEY environment variable is required')
      process.exit(1)
    }

    const config = loadConfig({ vaultDir: opts.vault })
    const dataDir = resolveHome(config.dataDir)
    const dbPath = join(dataDir, 'archive.db')
    const db = await getDb(dbPath)

    const failed = findFailed(db)
    if (failed.length === 0) {
      console.log('No failed conversations to retry.')
      return
    }

    console.log(`\n🔄 Retrying ${failed.length} failed conversations...\n`)

    const jid = jobId()
    insertJob(db, {
      id: jid,
      type: 'retry',
      sourcePath: null,
      status: 'running',
      totalItems: failed.length,
      processedItems: 0,
      failedItems: 0,
      skippedItems: 0,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      lastError: null,
    })
    saveDb(db, dbPath)

    let processed = 0
    let errors = 0
    const allTags = new Map<string, string[]>()
    const allProjects = new Map<string, string[]>()

    for (let i = 0; i < failed.length; i++) {
      const row = failed[i]
      process.stdout.write(`\r[${i + 1}/${failed.length}] 🔄  ${row.title.slice(0, 60).padEnd(60)}`)

      try {
        const messages: Message[] = row.messages_json ? JSON.parse(row.messages_json) : []
        const enriched: EnrichedConversation = {
          id: row.id,
          source: row.source as EnrichedConversation['source'],
          externalId: row.external_id ?? undefined,
          title: row.title,
          createdAt: row.created_at,
          updatedAt: row.updated_at ?? undefined,
          messages,
          metadata: {},
          language: (row.language as EnrichedConversation['language']) ?? 'en',
          messageCount: row.message_count ?? messages.length,
          tokenEstimate: row.token_estimate ?? 0,
          contentHash: row.content_hash ?? '',
        }

        const analysis = await analyzeConversation(enriched, {
          model: config.llm.model,
          promptLanguage: config.promptLanguage,
        })

        insertAnalysis(db, enriched.id, analysis)
        updateStage(db, enriched.id, 'analyzed')

        if (config.vaultDir) {
          const result = exportToMarkdown(enriched, analysis, allTags, allProjects, {
            vaultDir: resolveHome(config.vaultDir),
            overwrite: opts.overwrite ?? false,
          })
          if (!result.skipped) {
            updatePublished(db, enriched.id, result.path)
            updateStage(db, enriched.id, 'published')
          }
        }

        processed++
        updateJob(db, jid, { processedItems: processed })
        saveDb(db, dbPath)

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        process.stdout.write(`\r[fail] ❌  ${row.title.slice(0, 50)}: ${errMsg.slice(0, 60)}\n`)
        errors++
        updateStage(db, row.id, 'failed', errMsg)
        updateJob(db, jid, { failedItems: errors, lastError: errMsg })
        saveDb(db, dbPath)
      }
    }

    const finalStatus = errors > 0 ? (processed > 0 ? 'partial' : 'failed') : 'completed'
    updateJob(db, jid, { status: finalStatus, finishedAt: new Date().toISOString() })
    saveDb(db, dbPath)

    console.log(`\n\n✅ Retry complete: ${processed} fixed, ${errors} still failing`)
  })

import { Command } from 'commander'
import { join } from 'pathe'
import { loadConfig } from '../config-loader.js'
import { resolveHome } from '../../core/domain/config.js'
import { getDb, countByStage, getLatestJobs, findFailed } from '../../storage/index.js'

export const inspectCommand = new Command('inspect')
  .description('View pipeline status, job history, and failed conversations')
  .option('--failed', 'Show only failed conversations')
  .option('--json', 'Output in JSON format')
  .action(async (opts: { failed?: boolean; json?: boolean }) => {
    const config = loadConfig()
    const dataDir = resolveHome(config.dataDir)
    const dbPath = join(dataDir, 'archive.db')

    try {
      const db = await getDb(dbPath)

      if (opts.failed) {
        const failed = findFailed(db)
        if (opts.json) {
          console.log(JSON.stringify(failed, null, 2))
        } else {
          if (failed.length === 0) {
            console.log('No failed conversations.')
          } else {
            console.log(`\n❌ ${failed.length} failed conversations:\n`)
            for (const f of failed) {
              console.log(`  ${f.id}  ${f.title}`)
              console.log(`    Error: ${f.last_error}`)
              console.log(`    Attempts: ${f.attempt_count}`)
              console.log()
            }
          }
        }
        return
      }

      const stages = countByStage(db)
      const jobs = getLatestJobs(db, 5)

      if (opts.json) {
        console.log(JSON.stringify({ stages, jobs }, null, 2))
        return
      }

      console.log('\n📊 Pipeline Status:\n')
      const stageOrder = ['imported', 'enriched', 'analyzed', 'published', 'too_long', 'failed']
      const icons: Record<string, string> = {
        imported: '📥', enriched: '🔍', analyzed: '🧠',
        published: '✅', too_long: '📏', failed: '❌',
      }
      for (const stage of stageOrder) {
        const count = stages[stage] ?? 0
        if (count > 0) {
          console.log(`  ${icons[stage] ?? '•'} ${stage}: ${count}`)
        }
      }

      const total = Object.values(stages).reduce((a, b) => a + b, 0)
      console.log(`\n  Total: ${total} conversations\n`)

      if (jobs.length > 0) {
        console.log('📋 Recent Jobs:\n')
        for (const j of jobs) {
          const status = j.status === 'completed' ? '✅' : j.status === 'failed' ? '❌' : j.status === 'partial' ? '⚠️' : '🔄'
          console.log(`  ${status} ${j.id}  ${j.type}  ${j.processedItems}/${j.totalItems} processed  ${j.startedAt.split('T')[0]}`)
          if (j.failedItems > 0) console.log(`     ${j.failedItems} failed`)
        }
      }
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

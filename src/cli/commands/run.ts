import { Command } from 'commander'
import { existsSync } from 'fs'
import { loadConfig } from '../config-loader.js'
import { runPipeline } from '../../core/pipeline/run-pipeline.js'
import type { ConversationSource } from '../../core/domain/conversation.js'

export const runCommand = new Command('run')
  .description('Import, analyze, and publish AI conversations to Obsidian')
  .argument('<input>', 'Path to export file (JSON)')
  .requiredOption('-s, --source <source>', 'Source platform: chatgpt, claude, manual')
  .option('--vault <path>', 'Obsidian vault path (overrides config)')
  .option('--dry-run', 'Preview what would be processed without executing LLM calls')
  .option('--overwrite', 'Overwrite existing notes in vault')
  .action(async (input: string, opts: {
    source: string
    vault?: string
    dryRun?: boolean
    overwrite?: boolean
  }) => {
    if (!existsSync(input)) {
      console.error(`Error: File not found: ${input}`)
      process.exit(1)
    }

    if (!['chatgpt', 'claude', 'manual'].includes(opts.source)) {
      console.error(`Error: Invalid source "${opts.source}". Use: chatgpt, claude, manual`)
      process.exit(1)
    }

    if (!process.env.ANTHROPIC_API_KEY && !opts.dryRun) {
      console.error('Error: ANTHROPIC_API_KEY environment variable is required')
      console.error('Set it with: export ANTHROPIC_API_KEY=sk-ant-xxx')
      process.exit(1)
    }

    const config = loadConfig({
      vaultDir: opts.vault,
    })

    if (!config.vaultDir && !opts.dryRun) {
      console.log('Note: No vault configured. Analysis will run but notes won\'t be published.')
      console.log('Set vaultDir in ~/.ai-archive/config.json or use --vault <path>')
    }

    const dryRun = opts.dryRun ?? false

    if (dryRun) {
      console.log('🔍 DRY RUN — previewing without LLM calls or publishing\n')
    } else {
      console.log('🚀 Starting pipeline...\n')
    }

    try {
      const stats = await runPipeline({
        source: opts.source as ConversationSource,
        inputPath: input,
        config,
        dryRun,
        overwrite: opts.overwrite ?? false,
        callbacks: {
          onProgress: (current, total, title) => {
            const prefix = dryRun ? '📋' : '⚙️'
            process.stdout.write(`\r[${current}/${total}] ${prefix}  ${title.slice(0, 60).padEnd(60)}`)
          },
          onSkip: (title, reason) => {
            process.stdout.write(`\r[skip] ⏭️  ${title.slice(0, 50)} (${reason})\n`)
          },
          onError: (title, error) => {
            process.stdout.write(`\r[fail] ❌  ${title.slice(0, 50)}: ${error.slice(0, 80)}\n`)
          },
          onComplete: (stats) => {
            console.log('\n')
            if (dryRun) {
              console.log('📋 DRY RUN RESULTS:')
            } else {
              console.log('✅ PROCESSING COMPLETE:')
            }
            console.log(`   ${stats.total} conversations found`)
            console.log(`   ├─ ${stats.processed} processed`)
            for (const [cat, count] of Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])) {
              console.log(`   │  └─ ${count} ${cat}`)
            }
            if (stats.tooLong > 0) console.log(`   ├─ ${stats.tooLong} skipped (too long)`)
            if (stats.skipped > 0) console.log(`   ├─ ${stats.skipped} skipped total`)
            if (stats.failed > 0) console.log(`   ├─ ${stats.failed} failed`)
            if (!dryRun && stats.published > 0) console.log(`   └─ ${stats.published} published`)
            console.log(`   Cost: ~$${stats.estimatedCost.toFixed(3)}`)
            if (config.vaultDir && !dryRun) {
              console.log(`   Published to: ${config.vaultDir}`)
            }
          },
        },
      })

      if (stats.failed > 0 && stats.processed > 0) process.exit(2)
      if (stats.failed > 0 && stats.processed === 0) process.exit(1)
    } catch (err) {
      console.error('\nFatal error:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

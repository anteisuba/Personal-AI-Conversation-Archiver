import { Command } from 'commander'
import { runCommand } from './commands/run.js'
import { inspectCommand } from './commands/inspect.js'
import { retryCommand } from './commands/retry.js'

const program = new Command()
  .name('ai-archive')
  .description('Import AI conversation logs, refine them into knowledge notes, and publish to Obsidian')
  .version('0.1.0')

program.addCommand(runCommand)
program.addCommand(inspectCommand)
program.addCommand(retryCommand)

program.parse()

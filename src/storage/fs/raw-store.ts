import { mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync } from 'fs'
import { join, basename } from 'pathe'
import type { ConversationSource } from '../../core/domain/conversation.js'

export function saveRawFile(
  dataDir: string,
  source: ConversationSource,
  filePath: string,
): string {
  const rawDir = join(dataDir, 'raw', source)
  mkdirSync(rawDir, { recursive: true })
  const dest = join(rawDir, basename(filePath))
  copyFileSync(filePath, dest)
  return dest
}

export function readRawFile(path: string): string {
  return readFileSync(path, 'utf-8')
}

export function rawDirExists(dataDir: string, source: ConversationSource): boolean {
  return existsSync(join(dataDir, 'raw', source))
}

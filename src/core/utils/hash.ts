import { createHash } from 'crypto'
import type { Message } from '../domain/conversation.js'

export function contentHash(messages: Message[]): string {
  const content = messages
    .map((m) => `${m.role}:${m.content}`)
    .join('\n')
  return createHash('sha256').update(content).digest('hex')
}

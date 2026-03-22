import type { SourceAdapter } from './types.js'
import type { NormalizedConversation, Message } from '../domain/conversation.js'
import { convId } from '../utils/id.js'
import { nanoid } from 'nanoid'

/**
 * Claude export format:
 * - Array of conversation objects
 * - Each has `chat_messages` array with { sender, text, created_at }
 */

interface ClaudeMessage {
  sender: 'human' | 'assistant'
  text: string
  created_at: string
}

interface ClaudeConversation {
  uuid?: string
  name: string
  created_at: string
  updated_at: string
  chat_messages: ClaudeMessage[]
}

export class ClaudeAdapter implements SourceAdapter {
  parse(raw: string): NormalizedConversation[] {
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      throw new Error('Claude adapter: invalid JSON')
    }

    const conversations = Array.isArray(data) ? data : [data]
    const results: NormalizedConversation[] = []

    for (const conv of conversations as ClaudeConversation[]) {
      if (!conv.chat_messages || conv.chat_messages.length === 0) continue

      const messages: Message[] = conv.chat_messages
        .filter((m) => m.text && m.text.trim().length > 0)
        .map((m) => ({
          id: nanoid(12),
          role: m.sender === 'human' ? 'user' as const : 'assistant' as const,
          content: m.text,
          createdAt: m.created_at,
        }))

      if (messages.length === 0) continue

      results.push({
        id: convId(),
        source: 'claude',
        externalId: conv.uuid,
        title: conv.name || 'Untitled',
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        messages,
        metadata: {},
      })
    }

    return results
  }
}

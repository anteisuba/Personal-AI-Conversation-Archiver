import type { SourceAdapter } from './types.js'
import type { NormalizedConversation, Message } from '../domain/conversation.js'
import { convId } from '../utils/id.js'

/**
 * ChatGPT export format:
 * - Array of conversation objects
 * - Each has a `mapping` tree (nodes with children[] for regenerations)
 * - Linearization: walk from root via children[0] to get the "chosen" path
 */

interface ChatGPTMessage {
  id: string
  message?: {
    id: string
    author: { role: string }
    content: { content_type: string; parts?: unknown[] }
    create_time?: number
  }
  parent?: string
  children: string[]
}

interface ChatGPTConversation {
  title: string
  create_time: number
  update_time: number
  mapping: Record<string, ChatGPTMessage>
  conversation_id?: string
}

export class ChatGPTAdapter implements SourceAdapter {
  parse(raw: string): NormalizedConversation[] {
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      throw new Error('ChatGPT adapter: invalid JSON')
    }

    const conversations = Array.isArray(data) ? data : [data]
    const results: NormalizedConversation[] = []

    for (const conv of conversations as ChatGPTConversation[]) {
      if (!conv.mapping) continue

      const messages = this.linearize(conv.mapping)
      if (messages.length === 0) continue

      results.push({
        id: convId(),
        source: 'chatgpt',
        externalId: conv.conversation_id,
        title: conv.title || 'Untitled',
        createdAt: conv.create_time
          ? new Date(conv.create_time * 1000).toISOString()
          : new Date().toISOString(),
        updatedAt: conv.update_time
          ? new Date(conv.update_time * 1000).toISOString()
          : undefined,
        messages,
        metadata: {},
      })
    }

    return results
  }

  private linearize(mapping: Record<string, ChatGPTMessage>): Message[] {
    // Find root node (no parent or parent not in mapping)
    const root = Object.values(mapping).find(
      (node) => !node.parent || !mapping[node.parent]
    )
    if (!root) return []

    const messages: Message[] = []
    let current: ChatGPTMessage | undefined = root

    while (current) {
      if (current.message) {
        const msg = current.message
        const role = msg.author.role
        if (role === 'user' || role === 'assistant') {
          const content = this.extractContent(msg.content.parts)
          if (content) {
            messages.push({
              id: msg.id,
              role: role as 'user' | 'assistant',
              content,
              createdAt: msg.create_time
                ? new Date(msg.create_time * 1000).toISOString()
                : undefined,
            })
          }
        }
      }

      // Follow first child (chosen path)
      const nextId = current.children[0]
      current = nextId ? mapping[nextId] : undefined
    }

    return messages
  }

  private extractContent(parts?: unknown[]): string {
    if (!parts || parts.length === 0) return ''
    return parts
      .filter((p): p is string => typeof p === 'string')
      .join('\n')
  }
}

import matter from 'gray-matter'
import { basename } from 'pathe'
import type { SourceAdapter } from './types.js'
import type { NormalizedConversation, Message } from '../domain/conversation.js'
import { convId } from '../utils/id.js'
import { nanoid } from 'nanoid'

/**
 * Manual adapter accepts 3 formats:
 * - .txt: treated as a single assistant message, title from filename
 * - .md: parsed with gray-matter — frontmatter provides title/source/date
 * - .json: must match { title, messages: [{ role, content }] }
 */

interface ManualJson {
  title: string
  messages: { role: string; content: string }[]
}

export class ManualAdapter implements SourceAdapter {
  private filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  parse(raw: string): NormalizedConversation[] {
    const ext = this.filePath.split('.').pop()?.toLowerCase()

    if (ext === 'json') return this.parseJson(raw)
    if (ext === 'md') return this.parseMarkdown(raw)
    return this.parsePlainText(raw)
  }

  private parseJson(raw: string): NormalizedConversation[] {
    let data: ManualJson
    try {
      data = JSON.parse(raw) as ManualJson
    } catch {
      throw new Error('Manual adapter: invalid JSON')
    }

    if (!data.messages || !Array.isArray(data.messages)) {
      throw new Error('Manual adapter: JSON must have a "messages" array')
    }

    const messages: Message[] = data.messages.map((m) => ({
      id: nanoid(12),
      role: (m.role === 'user' || m.role === 'assistant' || m.role === 'system')
        ? m.role as Message['role']
        : 'user',
      content: m.content,
    }))

    return [{
      id: convId(),
      source: 'manual',
      title: data.title || basename(this.filePath, '.json'),
      createdAt: new Date().toISOString(),
      messages,
      metadata: { originalFile: this.filePath },
    }]
  }

  private parseMarkdown(raw: string): NormalizedConversation[] {
    const { data: fm, content } = matter(raw)

    const messages: Message[] = [{
      id: nanoid(12),
      role: 'assistant',
      content: content.trim(),
    }]

    return [{
      id: convId(),
      source: 'manual',
      title: (fm.title as string) || basename(this.filePath, '.md'),
      createdAt: (fm.date as string) || new Date().toISOString(),
      messages,
      metadata: { originalFile: this.filePath, frontmatter: fm },
    }]
  }

  private parsePlainText(raw: string): NormalizedConversation[] {
    if (!raw.trim()) return []

    const messages: Message[] = [{
      id: nanoid(12),
      role: 'assistant',
      content: raw.trim(),
    }]

    return [{
      id: convId(),
      source: 'manual',
      title: basename(this.filePath).replace(/\.[^.]+$/, ''),
      createdAt: new Date().toISOString(),
      messages,
      metadata: { originalFile: this.filePath },
    }]
  }
}

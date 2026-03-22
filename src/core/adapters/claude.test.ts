import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { ClaudeAdapter } from './claude.js'

describe('ClaudeAdapter', () => {
  const adapter = new ClaudeAdapter()

  it('parses sample export file', () => {
    const raw = readFileSync(resolve(__dirname, '../../../examples/claude-sample.json'), 'utf-8')
    const conversations = adapter.parse(raw)

    expect(conversations).toHaveLength(1)
    expect(conversations[0].title).toBe('Setting Up a Node.js Monorepo')
    expect(conversations[0].source).toBe('claude')
  })

  it('maps sender to role correctly', () => {
    const raw = readFileSync(resolve(__dirname, '../../../examples/claude-sample.json'), 'utf-8')
    const conversations = adapter.parse(raw)
    const messages = conversations[0].messages

    expect(messages[0].role).toBe('user')
    expect(messages[1].role).toBe('assistant')
  })

  it('preserves timestamps', () => {
    const raw = readFileSync(resolve(__dirname, '../../../examples/claude-sample.json'), 'utf-8')
    const conversations = adapter.parse(raw)

    expect(conversations[0].createdAt).toBe('2026-03-10T10:00:00Z')
    expect(conversations[0].messages[0].createdAt).toBe('2026-03-10T10:00:00Z')
  })

  it('handles invalid JSON', () => {
    expect(() => adapter.parse('not json')).toThrow('invalid JSON')
  })

  it('skips conversations with empty messages', () => {
    const data = JSON.stringify([{ name: 'empty', created_at: '2026-01-01', updated_at: '2026-01-01', chat_messages: [] }])
    const conversations = adapter.parse(data)
    expect(conversations).toHaveLength(0)
  })
})

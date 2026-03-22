import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { ChatGPTAdapter } from './chatgpt.js'

describe('ChatGPTAdapter', () => {
  const adapter = new ChatGPTAdapter()

  it('parses sample export file', () => {
    const raw = readFileSync(resolve(__dirname, '../../../examples/chatgpt-sample.json'), 'utf-8')
    const conversations = adapter.parse(raw)

    expect(conversations).toHaveLength(2)
    expect(conversations[0].title).toBe('React Hook Form Validation')
    expect(conversations[0].source).toBe('chatgpt')
    expect(conversations[0].messages.length).toBeGreaterThan(0)
  })

  it('linearizes tree following children[0]', () => {
    const raw = readFileSync(resolve(__dirname, '../../../examples/chatgpt-sample.json'), 'utf-8')
    const conversations = adapter.parse(raw)

    // First conversation has 4 messages (2 user + 2 assistant)
    const messages = conversations[0].messages
    expect(messages).toHaveLength(4)
    expect(messages[0].role).toBe('user')
    expect(messages[1].role).toBe('assistant')
    expect(messages[2].role).toBe('user')
    expect(messages[3].role).toBe('assistant')
  })

  it('extracts content from parts array', () => {
    const raw = readFileSync(resolve(__dirname, '../../../examples/chatgpt-sample.json'), 'utf-8')
    const conversations = adapter.parse(raw)

    const firstMsg = conversations[0].messages[0]
    expect(firstMsg.content).toContain('form validation')
  })

  it('handles invalid JSON', () => {
    expect(() => adapter.parse('not json')).toThrow('invalid JSON')
  })

  it('skips conversations without mapping', () => {
    const data = JSON.stringify([{ title: 'no mapping' }])
    const conversations = adapter.parse(data)
    expect(conversations).toHaveLength(0)
  })

  it('assigns IDs with conv_ prefix', () => {
    const raw = readFileSync(resolve(__dirname, '../../../examples/chatgpt-sample.json'), 'utf-8')
    const conversations = adapter.parse(raw)

    for (const conv of conversations) {
      expect(conv.id).toMatch(/^conv_/)
    }
  })
})

import { describe, it, expect } from 'vitest'
import { contentHash } from './hash.js'
import { estimateTokens } from './token-estimate.js'
import { detectLanguage } from './language-detect.js'
import { convId, jobId } from './id.js'
import type { Message } from '../domain/conversation.js'

describe('contentHash', () => {
  it('produces consistent hashes', () => {
    const msgs: Message[] = [
      { id: '1', role: 'user', content: 'hello' },
      { id: '2', role: 'assistant', content: 'hi' },
    ]
    const h1 = contentHash(msgs)
    const h2 = contentHash(msgs)
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(64) // SHA-256 hex
  })

  it('produces different hashes for different content', () => {
    const msgs1: Message[] = [{ id: '1', role: 'user', content: 'hello' }]
    const msgs2: Message[] = [{ id: '1', role: 'user', content: 'world' }]
    expect(contentHash(msgs1)).not.toBe(contentHash(msgs2))
  })
})

describe('estimateTokens', () => {
  it('estimates English text', () => {
    const msgs: Message[] = [
      { id: '1', role: 'user', content: 'Hello world this is a test message' },
    ]
    const tokens = estimateTokens(msgs)
    expect(tokens).toBeGreaterThan(5)
    expect(tokens).toBeLessThan(50)
  })

  it('estimates CJK text higher', () => {
    const msgs: Message[] = [
      { id: '1', role: 'user', content: '你好世界这是一条测试消息' },
    ]
    const tokens = estimateTokens(msgs)
    expect(tokens).toBeGreaterThan(10)
  })
})

describe('detectLanguage', () => {
  it('detects English', () => {
    const msgs: Message[] = [
      { id: '1', role: 'user', content: 'How do I implement a linked list in Python?' },
    ]
    expect(detectLanguage(msgs)).toBe('en')
  })

  it('detects Chinese', () => {
    const msgs: Message[] = [
      { id: '1', role: 'user', content: '如何在 Python 中实现链表？这是一个常见的面试题。' },
    ]
    expect(detectLanguage(msgs)).toBe('zh')
  })

  it('detects mixed', () => {
    const msgs: Message[] = [
      { id: '1', role: 'user', content: '帮我 debug 这个 React component' },
    ]
    const lang = detectLanguage(msgs)
    expect(['zh', 'mixed']).toContain(lang)
  })

  it('defaults to en for empty messages', () => {
    expect(detectLanguage([])).toBe('en')
  })
})

describe('id generation', () => {
  it('generates conv IDs with prefix', () => {
    const id = convId()
    expect(id).toMatch(/^conv_/)
    expect(id.length).toBeGreaterThan(5)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => convId()))
    expect(ids.size).toBe(100)
  })

  it('generates job IDs with prefix', () => {
    expect(jobId()).toMatch(/^job_/)
  })
})

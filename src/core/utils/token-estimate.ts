import type { Message } from '../domain/conversation.js'

/**
 * Rough token estimate: ~4 chars per token for English, ~2 chars per CJK character.
 * This is intentionally approximate — used for cost estimation and too_long detection,
 * not for precise token counting.
 */
export function estimateTokens(messages: Message[]): number {
  let total = 0
  for (const msg of messages) {
    const text = msg.content
    let cjkChars = 0
    let otherChars = 0
    for (const char of text) {
      const code = char.codePointAt(0)!
      if (
        (code >= 0x4e00 && code <= 0x9fff) ||  // CJK Unified
        (code >= 0x3040 && code <= 0x30ff) ||  // Hiragana + Katakana
        (code >= 0xac00 && code <= 0xd7af)     // Korean
      ) {
        cjkChars++
      } else {
        otherChars++
      }
    }
    // CJK: ~1.5 tokens per character, Latin: ~0.25 tokens per character
    total += Math.ceil(cjkChars * 1.5 + otherChars * 0.25)
    // Message overhead (role, formatting)
    total += 4
  }
  return total
}

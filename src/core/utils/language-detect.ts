import type { Message } from '../domain/conversation.js'

type Language = 'zh' | 'ja' | 'en' | 'mixed'

/**
 * Simple heuristic language detection based on Unicode ranges.
 * Looks at user messages only (assistant messages often mirror user language).
 */
export function detectLanguage(messages: Message[]): Language {
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('')

  if (!userText) return 'en'

  let cjk = 0
  let japanese = 0
  let total = 0

  for (const char of userText) {
    const code = char.codePointAt(0)!
    if (code > 0x7f) total++
    if (code >= 0x4e00 && code <= 0x9fff) cjk++
    if (
      (code >= 0x3040 && code <= 0x309f) || // Hiragana
      (code >= 0x30a0 && code <= 0x30ff)    // Katakana
    ) {
      japanese++
    }
  }

  const textLen = userText.length
  if (textLen === 0) return 'en'

  const cjkRatio = cjk / textLen
  const jpRatio = japanese / textLen

  if (jpRatio > 0.05) return 'ja'
  if (cjkRatio > 0.15) return 'zh'
  if (cjkRatio > 0.05) return 'mixed'
  return 'en'
}

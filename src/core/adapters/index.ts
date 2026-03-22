import type { ConversationSource } from '../domain/conversation.js'
import type { SourceAdapter } from './types.js'
import { ChatGPTAdapter } from './chatgpt.js'
import { ClaudeAdapter } from './claude.js'
import { ManualAdapter } from './manual.js'

export function getAdapter(source: ConversationSource, filePath: string): SourceAdapter {
  switch (source) {
    case 'chatgpt': return new ChatGPTAdapter()
    case 'claude': return new ClaudeAdapter()
    case 'manual': return new ManualAdapter(filePath)
    default:
      throw new Error(`Unsupported source: ${source}. Supported: chatgpt, claude, manual`)
  }
}

export type { SourceAdapter } from './types.js'

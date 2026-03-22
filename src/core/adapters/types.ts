import type { NormalizedConversation } from '../domain/conversation.js'

export interface SourceAdapter {
  parse(raw: string): NormalizedConversation[]
}

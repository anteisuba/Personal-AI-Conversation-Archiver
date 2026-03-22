import { z } from 'zod/v4'

export const MessageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool'])
export type MessageRole = z.infer<typeof MessageRoleSchema>

export const MessageSchema = z.object({
  id: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  createdAt: z.string().optional(),
})
export type Message = z.infer<typeof MessageSchema>

export const ConversationSourceSchema = z.enum([
  'chatgpt',
  'claude',
  'gemini',
  'cursor',
  'manual',
])
export type ConversationSource = z.infer<typeof ConversationSourceSchema>

export const ConversationStageSchema = z.enum([
  'imported',
  'enriched',
  'analyzed',
  'published',
  'failed',
  'too_long',
])
export type ConversationStage = z.infer<typeof ConversationStageSchema>

export const NormalizedConversationSchema = z.object({
  id: z.string(),
  source: ConversationSourceSchema,
  externalId: z.string().optional(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  messages: z.array(MessageSchema),
  metadata: z.record(z.string(), z.unknown()),
})
export type NormalizedConversation = z.infer<typeof NormalizedConversationSchema>

export interface EnrichedConversation extends NormalizedConversation {
  language: 'zh' | 'ja' | 'en' | 'mixed'
  messageCount: number
  tokenEstimate: number
  contentHash: string
}

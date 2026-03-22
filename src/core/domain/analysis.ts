import { z } from 'zod/v4'

export const CategorySchema = z.enum([
  'programming',
  'project',
  'career',
  'language',
  'ai-tools',
  'life',
])
export type Category = z.infer<typeof CategorySchema>

/**
 * Unified LLM output schema — single call extracts all fields.
 * EUREKA: meta-analysis and note-refinement are independent fields
 * extractable in one structured output call.
 */
export const ConversationAnalysisSchema = z.object({
  category: CategorySchema,
  tags: z.array(z.string()),
  project: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  actionItems: z.array(z.string()),
  rewrittenNote: z.string(),
})
export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>

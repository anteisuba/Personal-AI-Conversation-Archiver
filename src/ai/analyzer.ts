import Anthropic from '@anthropic-ai/sdk'
import { ConversationAnalysisSchema, type ConversationAnalysis } from '../core/domain/analysis.js'
import type { EnrichedConversation } from '../core/domain/conversation.js'
import { buildAnalysisPrompt } from './prompt.js'

const MAX_RETRIES = 3
const BACKOFF_MS = [1000, 4000, 16000]

const TOOL_SCHEMA = {
  name: 'extract_knowledge',
  description: 'Extract structured knowledge from an AI conversation',
  input_schema: {
    type: 'object' as const,
    properties: {
      category: {
        type: 'string',
        enum: ['programming', 'project', 'career', 'language', 'ai-tools', 'life'],
      },
      tags: { type: 'array', items: { type: 'string' } },
      project: { type: ['string', 'null'] },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      summary: { type: 'string' },
      keyPoints: { type: 'array', items: { type: 'string' } },
      actionItems: { type: 'array', items: { type: 'string' } },
      rewrittenNote: { type: 'string' },
    },
    required: ['category', 'tags', 'project', 'confidence', 'summary', 'keyPoints', 'actionItems', 'rewrittenNote'],
  },
}

export interface AnalyzerOptions {
  model: string
  promptLanguage: 'auto' | 'zh' | 'en'
}

export async function analyzeConversation(
  conv: EnrichedConversation,
  options: AnalyzerOptions,
): Promise<ConversationAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }

  const client = new Anthropic({ apiKey })
  const prompt = buildAnalysisPrompt(conv, options.promptLanguage)

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: options.model,
        max_tokens: 4096,
        tools: [TOOL_SCHEMA],
        tool_choice: { type: 'tool', name: 'extract_knowledge' },
        messages: [{ role: 'user', content: prompt }],
      })

      const toolBlock = response.content.find((b) => b.type === 'tool_use')
      if (!toolBlock || toolBlock.type !== 'tool_use') {
        throw new Error('LLM did not return tool_use response')
      }

      const parsed = ConversationAnalysisSchema.safeParse(toolBlock.input)
      if (!parsed.success) {
        throw new Error(`Zod validation failed: ${JSON.stringify(parsed.error.issues)}`)
      }

      return parsed.data
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Check for rate limit
      if (lastError.message.includes('rate_limit') || lastError.message.includes('429')) {
        const retryAfter = BACKOFF_MS[attempt] ?? 16000
        await sleep(retryAfter)
        continue
      }

      // Zod validation failures are retryable (LLM may produce different output)
      if (lastError.message.includes('Zod validation')) {
        if (attempt < MAX_RETRIES - 1) {
          await sleep(BACKOFF_MS[attempt] ?? 1000)
          continue
        }
      }

      // Other errors: still retry with backoff
      if (attempt < MAX_RETRIES - 1) {
        await sleep(BACKOFF_MS[attempt] ?? 1000)
        continue
      }
    }
  }

  throw lastError ?? new Error('Analysis failed after all retries')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

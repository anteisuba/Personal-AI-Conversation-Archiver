import { z } from 'zod/v4'

export const AppConfigSchema = z.object({
  dataDir: z.string().default('~/.ai-archive/data'),
  vaultDir: z.string().optional(),
  llm: z.object({
    model: z.string().default('claude-haiku-4-5-20251001'),
  }).default({}),
  categories: z.array(z.string()).default([
    'programming', 'project', 'career', 'language', 'ai-tools', 'life',
  ]),
  promptLanguage: z.enum(['auto', 'zh', 'en']).default('auto'),
})
export type AppConfig = z.infer<typeof AppConfigSchema>

export function resolveHome(path: string): string {
  if (path.startsWith('~/')) {
    return path.replace('~', process.env.HOME ?? '')
  }
  return path
}

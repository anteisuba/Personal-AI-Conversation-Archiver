import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'pathe'
import { AppConfigSchema, resolveHome, type AppConfig } from '../core/domain/config.js'

const CONFIG_DIR = '~/.ai-archive'
const CONFIG_FILE = 'config.json'

const DEFAULT_CONFIG = {
  dataDir: '~/.ai-archive/data',
  llm: {
    model: 'claude-haiku-4-5-20251001',
  },
  categories: ['programming', 'project', 'career', 'language', 'ai-tools', 'life'],
  promptLanguage: 'auto' as const,
}

export function loadConfig(overrides?: Partial<AppConfig>): AppConfig {
  const configDir = resolveHome(CONFIG_DIR)
  const configPath = join(configDir, CONFIG_FILE)

  // Auto-init: create dir and default config if not exists
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  let fileConfig: Record<string, unknown> = {}
  if (existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
    } catch {
      // Invalid config file — use defaults
    }
  } else {
    // Write default config
    writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8')
  }

  const merged = { ...DEFAULT_CONFIG, ...fileConfig, ...overrides }
  return AppConfigSchema.parse(merged)
}

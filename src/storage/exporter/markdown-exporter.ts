import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'pathe'
import type { ConversationAnalysis } from '../../core/domain/analysis.js'
import type { EnrichedConversation } from '../../core/domain/conversation.js'

export interface ExportOptions {
  vaultDir: string
  overwrite: boolean
}

export interface ExportResult {
  path: string
  skipped: boolean
}

export function exportToMarkdown(
  conv: EnrichedConversation,
  analysis: ConversationAnalysis,
  allTags: Map<string, string[]>,
  allProjects: Map<string, string[]>,
  options: ExportOptions,
): ExportResult {
  const categoryDir = join(options.vaultDir, analysis.category)
  mkdirSync(categoryDir, { recursive: true })

  const safeTitle = sanitizeFilename(analysis.summary.slice(0, 60) || conv.title)
  const filePath = join(categoryDir, `${safeTitle}.md`)

  if (existsSync(filePath) && !options.overwrite) {
    return { path: filePath, skipped: true }
  }

  const wikilinks = buildWikilinks(conv.id, analysis, allTags, allProjects)
  const markdown = buildMarkdown(conv, analysis, wikilinks)

  writeFileSync(filePath, markdown, 'utf-8')
  return { path: filePath, skipped: false }
}

function buildMarkdown(
  conv: EnrichedConversation,
  analysis: ConversationAnalysis,
  wikilinks: string[],
): string {
  const frontmatter = [
    '---',
    `title: "${escapeYaml(conv.title)}"`,
    `source: ${conv.source}`,
    `category: ${analysis.category}`,
    `tags: [${analysis.tags.join(', ')}]`,
    analysis.project ? `project: ${analysis.project}` : null,
    `created: ${conv.createdAt.split('T')[0]}`,
    `refined: ${new Date().toISOString().split('T')[0]}`,
    `confidence: ${analysis.confidence}`,
    `conversation_id: ${conv.id}`,
    `language: ${conv.language}`,
    `message_count: ${conv.messageCount}`,
    '---',
  ].filter(Boolean).join('\n')

  const sections = [
    frontmatter,
    '',
    `# ${conv.title}`,
    '',
    '## 摘要',
    analysis.summary,
    '',
    '## 关键要点',
    ...analysis.keyPoints.map((p) => `- ${p}`),
  ]

  if (analysis.actionItems.length > 0) {
    sections.push('', '## 行动项')
    sections.push(...analysis.actionItems.map((a) => `- [ ] ${a}`))
  }

  sections.push('', '## 知识笔记', analysis.rewrittenNote)

  if (wikilinks.length > 0) {
    sections.push('', '## 相关笔记', ...wikilinks.map((l) => `- ${l}`))
  }

  sections.push('', '---', `*对话来源: ${conv.source} | ID: ${conv.id}*`)

  return sections.join('\n') + '\n'
}

function buildWikilinks(
  currentId: string,
  analysis: ConversationAnalysis,
  allTags: Map<string, string[]>,
  allProjects: Map<string, string[]>,
): string[] {
  const links: Set<string> = new Set()

  // Link by shared tags
  for (const tag of analysis.tags) {
    const relatedIds = allTags.get(tag) ?? []
    for (const id of relatedIds) {
      if (id !== currentId) links.add(id)
    }
  }

  // Link by shared project
  if (analysis.project) {
    const relatedIds = allProjects.get(analysis.project) ?? []
    for (const id of relatedIds) {
      if (id !== currentId) links.add(id)
    }
  }

  return Array.from(links).slice(0, 10).map((id) => `[[${id}]]`)
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) || 'untitled'
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"')
}

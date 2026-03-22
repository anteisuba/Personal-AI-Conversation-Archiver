import type { Database } from 'sql.js'
import type { ConversationAnalysis } from '../../core/domain/analysis.js'

export function insertAnalysis(
  db: Database,
  conversationId: string,
  analysis: ConversationAnalysis,
): void {
  db.run(
    `INSERT OR REPLACE INTO analysis_notes
      (conversation_id, category, project, tags_json, confidence,
       summary, key_points_json, action_items_json, rewritten_note, analyzed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      conversationId,
      analysis.category,
      analysis.project,
      JSON.stringify(analysis.tags),
      analysis.confidence,
      analysis.summary,
      JSON.stringify(analysis.keyPoints),
      JSON.stringify(analysis.actionItems),
      analysis.rewrittenNote,
      new Date().toISOString(),
    ],
  )
}

export function getAnalysis(db: Database, conversationId: string): ConversationAnalysis | null {
  const result = db.exec(
    'SELECT * FROM analysis_notes WHERE conversation_id = ?',
    [conversationId],
  )
  if (result.length === 0 || result[0].values.length === 0) return null

  const cols = result[0].columns
  const vals = result[0].values[0]
  const row: Record<string, unknown> = {}
  cols.forEach((c, i) => { row[c] = vals[i] })

  return {
    category: row.category as ConversationAnalysis['category'],
    tags: JSON.parse(row.tags_json as string),
    project: row.project as string | null,
    confidence: row.confidence as number,
    summary: row.summary as string,
    keyPoints: JSON.parse(row.key_points_json as string),
    actionItems: JSON.parse(row.action_items_json as string),
    rewrittenNote: row.rewritten_note as string,
  }
}

export function updatePublished(
  db: Database,
  conversationId: string,
  markdownPath: string,
): void {
  db.run(
    `UPDATE analysis_notes
     SET markdown_path = ?, published_at = ?
     WHERE conversation_id = ?`,
    [markdownPath, new Date().toISOString(), conversationId],
  )
}

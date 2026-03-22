import type { Database } from 'sql.js'
import type { EnrichedConversation, ConversationStage } from '../../core/domain/conversation.js'

export interface ConversationRow {
  id: string
  source: string
  external_id: string | null
  title: string
  created_at: string
  updated_at: string | null
  language: string | null
  message_count: number | null
  token_estimate: number | null
  content_hash: string | null
  raw_path: string | null
  messages_json: string | null
  current_stage: string
  attempt_count: number
  last_error: string | null
  job_id: string | null
  inserted_at: string
}

export function insertConversation(
  db: Database,
  conv: EnrichedConversation,
  rawPath: string | null,
  jobId: string,
): void {
  db.run(
    `INSERT INTO conversations
      (id, source, external_id, title, created_at, updated_at,
       language, message_count, token_estimate, content_hash,
       raw_path, messages_json, current_stage, job_id, inserted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'imported', ?, ?)`,
    [
      conv.id,
      conv.source,
      conv.externalId ?? null,
      conv.title,
      conv.createdAt,
      conv.updatedAt ?? null,
      conv.language,
      conv.messageCount,
      conv.tokenEstimate,
      conv.contentHash,
      rawPath,
      JSON.stringify(conv.messages),
      jobId,
      new Date().toISOString(),
    ],
  )
}

export function updateStage(
  db: Database,
  convId: string,
  stage: ConversationStage,
  error?: string,
): void {
  if (error) {
    db.run(
      `UPDATE conversations
       SET current_stage = ?, last_error = ?, attempt_count = attempt_count + 1
       WHERE id = ?`,
      [stage, error, convId],
    )
  } else {
    db.run(
      `UPDATE conversations SET current_stage = ?, last_error = NULL WHERE id = ?`,
      [stage, convId],
    )
  }
}

export function findByHash(db: Database, hash: string): ConversationRow | null {
  const result = db.exec(
    'SELECT * FROM conversations WHERE content_hash = ? LIMIT 1',
    [hash],
  )
  if (result.length === 0 || result[0].values.length === 0) return null
  return rowToObject(result[0].columns, result[0].values[0])
}

export function findByStage(db: Database, stage: ConversationStage): ConversationRow[] {
  const result = db.exec(
    'SELECT * FROM conversations WHERE current_stage = ? ORDER BY inserted_at',
    [stage],
  )
  if (result.length === 0) return []
  return result[0].values.map((row) => rowToObject(result[0].columns, row))
}

export function findByJobId(db: Database, jobId: string): ConversationRow[] {
  const result = db.exec(
    'SELECT * FROM conversations WHERE job_id = ? ORDER BY inserted_at',
    [jobId],
  )
  if (result.length === 0) return []
  return result[0].values.map((row) => rowToObject(result[0].columns, row))
}

export function findFailed(db: Database): ConversationRow[] {
  return findByStage(db, 'failed')
}

export function countByStage(db: Database): Record<string, number> {
  const result = db.exec(
    'SELECT current_stage, COUNT(*) as cnt FROM conversations GROUP BY current_stage',
  )
  if (result.length === 0) return {}
  const counts: Record<string, number> = {}
  for (const row of result[0].values) {
    counts[row[0] as string] = row[1] as number
  }
  return counts
}

export function getAllConversations(db: Database): ConversationRow[] {
  const result = db.exec('SELECT * FROM conversations ORDER BY inserted_at')
  if (result.length === 0) return []
  return result[0].values.map((row) => rowToObject(result[0].columns, row))
}

function rowToObject(columns: string[], values: unknown[]): ConversationRow {
  const obj: Record<string, unknown> = {}
  columns.forEach((col, i) => { obj[col] = values[i] })
  return obj as unknown as ConversationRow
}

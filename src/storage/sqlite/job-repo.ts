import type { Database } from 'sql.js'
import type { Job, JobStatus } from '../../core/domain/job.js'

export function insertJob(db: Database, job: Job): void {
  db.run(
    `INSERT INTO jobs
      (id, type, source_path, status, total_items, processed_items,
       failed_items, skipped_items, started_at, finished_at, last_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      job.id, job.type, job.sourcePath, job.status,
      job.totalItems, job.processedItems, job.failedItems, job.skippedItems,
      job.startedAt, job.finishedAt, job.lastError,
    ],
  )
}

export function updateJob(
  db: Database,
  jobId: string,
  updates: Partial<Pick<Job, 'status' | 'processedItems' | 'failedItems' | 'skippedItems' | 'finishedAt' | 'lastError'>>,
): void {
  const sets: string[] = []
  const params: unknown[] = []

  for (const [key, val] of Object.entries(updates)) {
    const col = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    sets.push(`${col} = ?`)
    params.push(val)
  }

  if (sets.length === 0) return
  params.push(jobId)
  db.run(`UPDATE jobs SET ${sets.join(', ')} WHERE id = ?`, params)
}

export function getJob(db: Database, jobId: string): Job | null {
  const result = db.exec('SELECT * FROM jobs WHERE id = ?', [jobId])
  if (result.length === 0 || result[0].values.length === 0) return null

  const cols = result[0].columns
  const vals = result[0].values[0]
  const row: Record<string, unknown> = {}
  cols.forEach((c, i) => { row[c] = vals[i] })

  return {
    id: row.id as string,
    type: row.type as Job['type'],
    sourcePath: row.source_path as string | null,
    status: row.status as JobStatus,
    totalItems: row.total_items as number,
    processedItems: row.processed_items as number,
    failedItems: row.failed_items as number,
    skippedItems: row.skipped_items as number,
    startedAt: row.started_at as string,
    finishedAt: row.finished_at as string | null,
    lastError: row.last_error as string | null,
  }
}

export function getLatestJobs(db: Database, limit = 10): Job[] {
  const result = db.exec(
    'SELECT * FROM jobs ORDER BY started_at DESC LIMIT ?',
    [limit],
  )
  if (result.length === 0) return []

  return result[0].values.map((vals) => {
    const row: Record<string, unknown> = {}
    result[0].columns.forEach((c, i) => { row[c] = vals[i] })
    return {
      id: row.id as string,
      type: row.type as Job['type'],
      sourcePath: row.source_path as string | null,
      status: row.status as JobStatus,
      totalItems: row.total_items as number,
      processedItems: row.processed_items as number,
      failedItems: row.failed_items as number,
      skippedItems: row.skipped_items as number,
      startedAt: row.started_at as string,
      finishedAt: row.finished_at as string | null,
      lastError: row.last_error as string | null,
    }
  })
}

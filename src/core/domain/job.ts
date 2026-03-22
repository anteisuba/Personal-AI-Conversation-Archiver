export type JobStatus = 'running' | 'completed' | 'failed' | 'partial'

export interface Job {
  id: string
  type: 'run' | 'retry'
  sourcePath: string | null
  status: JobStatus
  totalItems: number
  processedItems: number
  failedItems: number
  skippedItems: number
  startedAt: string
  finishedAt: string | null
  lastError: string | null
}

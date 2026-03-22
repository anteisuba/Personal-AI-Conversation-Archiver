import initSqlJs, { type Database } from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'pathe'

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  language TEXT,
  message_count INTEGER,
  token_estimate INTEGER,
  content_hash TEXT,
  raw_path TEXT,
  messages_json TEXT,
  current_stage TEXT NOT NULL DEFAULT 'imported',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  job_id TEXT,
  inserted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analysis_notes (
  conversation_id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  project TEXT,
  tags_json TEXT NOT NULL,
  confidence REAL NOT NULL,
  summary TEXT NOT NULL,
  key_points_json TEXT NOT NULL,
  action_items_json TEXT NOT NULL,
  rewritten_note TEXT NOT NULL,
  markdown_path TEXT,
  analyzed_at TEXT NOT NULL,
  published_at TEXT,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source_path TEXT,
  status TEXT NOT NULL,
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  skipped_items INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source);
CREATE INDEX IF NOT EXISTS idx_conversations_content_hash ON conversations(content_hash);
CREATE INDEX IF NOT EXISTS idx_conversations_current_stage ON conversations(current_stage);
CREATE INDEX IF NOT EXISTS idx_conversations_job_id ON conversations(job_id);
`

const CURRENT_VERSION = 1

let _db: Database | null = null
let _dbPath: string | null = null

export async function getDb(dbPath: string): Promise<Database> {
  if (_db && _dbPath === dbPath) return _db

  const SQL = await initSqlJs()

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    _db = new SQL.Database(buffer)
  } else {
    mkdirSync(dirname(dbPath), { recursive: true })
    _db = new SQL.Database()
  }

  _db.run(SCHEMA_SQL)

  // Set schema version if not set
  const versionResult = _db.exec('SELECT version FROM schema_version LIMIT 1')
  if (versionResult.length === 0) {
    _db.run('INSERT INTO schema_version (version) VALUES (?)', [CURRENT_VERSION])
  }

  _dbPath = dbPath
  return _db
}

export function saveDb(db: Database, dbPath: string): void {
  const data = db.export()
  const buffer = Buffer.from(data)
  mkdirSync(dirname(dbPath), { recursive: true })
  writeFileSync(dbPath, buffer)
}

export function closeDb(): void {
  if (_db) {
    _db.close()
    _db = null
    _dbPath = null
  }
}

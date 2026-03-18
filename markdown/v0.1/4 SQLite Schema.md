## 4.1 conversations

Stores normalized conversation metadata and current status.

Suggested columns:

- `id` TEXT PRIMARY KEY
    
- `source` TEXT NOT NULL
    
- `external_id` TEXT
    
- `title` TEXT NOT NULL
    
- `created_at` TEXT NOT NULL
    
- `updated_at` TEXT
    
- `language` TEXT
    
- `message_count` INTEGER
    
- `token_estimate` INTEGER
    
- `content_hash` TEXT
    
- `raw_path` TEXT NOT NULL
    
- `normalized_path` TEXT
    
- `status` TEXT NOT NULL
    
- `last_error` TEXT
    
- `inserted_at` TEXT NOT NULL
    

### Suggested indexes

- index on `source`
    
- index on `content_hash`
    
- index on `status`
    
- index on `created_at`
    

---

## 4.2 analysis_results

Stores the output of meta analysis.

Suggested columns:

- `conversation_id` TEXT PRIMARY KEY
    
- `category` TEXT NOT NULL
    
- `project` TEXT
    
- `tags_json` TEXT NOT NULL
    
- `confidence` REAL NOT NULL
    
- `analyzed_at` TEXT NOT NULL
    

### Notes

- `tags_json` stores a JSON array string.
    
- one row per conversation in v0.1
    

---

## 4.3 notes

Stores refined note output and export metadata.

Suggested columns:

- `conversation_id` TEXT PRIMARY KEY
    
- `title` TEXT NOT NULL
    
- `summary` TEXT NOT NULL
    
- `key_points_json` TEXT NOT NULL
    
- `action_items_json` TEXT NOT NULL
    
- `reusable_prompts_json` TEXT NOT NULL
    
- `rewritten_note` TEXT NOT NULL
    
- `markdown_path` TEXT
    
- `refined_at` TEXT NOT NULL
    
- `published_at` TEXT
    

### Notes

- `markdown_path` is nullable until publish succeeds.
    
- `published_at` is nullable until publish succeeds.
    

---

## 4.4 jobs

Tracks batch-level job execution.

Suggested columns:

- `id` TEXT PRIMARY KEY
    
- `type` TEXT NOT NULL
    
- `source_path` TEXT
    
- `status` TEXT NOT NULL
    
- `total_items` INTEGER NOT NULL
    
- `processed_items` INTEGER NOT NULL
    
- `failed_items` INTEGER NOT NULL
    
- `started_at` TEXT NOT NULL
    
- `finished_at` TEXT
    
- `last_error` TEXT
    

---

## 4.5 job_items

Tracks per-conversation progress inside a job.

Suggested columns:

- `job_id` TEXT NOT NULL
    
- `conversation_id` TEXT NOT NULL
    
- `stage` TEXT NOT NULL
    
- `status` TEXT NOT NULL
    
- `attempt_count` INTEGER NOT NULL DEFAULT 0
    
- `last_error` TEXT
    
- `updated_at` TEXT NOT NULL
    

### Suggested composite key

- `(job_id, conversation_id, stage)`
    

### Suggested indexes

- index on `job_id`
    
- index on `conversation_id`
    
- index on `status`
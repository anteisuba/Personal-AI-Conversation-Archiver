Imports raw source file(s) into the app data directory.

### Usage

ai-archive import <input> --source <source>

### Examples

ai-archive import ./exports/chatgpt-export.json --source chatgpt  
ai-archive import ./exports/claude/ --source claude  
ai-archive import ./tmp/conversation.md --source manual

### Behavior

- creates a job of type `import`
    
- copies or serializes raw payloads into `raw/`
    
- records conversation placeholders in SQLite if identifiable
    
- does not call any LLM
    
- does not publish notes
    

### Useful flags

- `--source <source>` required
    
- `--recursive` scan directories recursively
    
- `--copy` physically copy raw files
    
- `--link` store references instead of copying where supported
    
- `--limit <n>` import only first N items
    

---

## 7. `process`

Runs normalize + local enrichment + AI processing.  
Does not publish to Obsidian unless explicitly requested.

### Usage

ai-archive process [jobId]  
ai-archive process --conversation <conversationId>

### Examples

ai-archive process  
ai-archive process job_20260318_001  
ai-archive process --conversation conv_abc123

### Behavior

- normalizes imported data if needed
    
- computes local enrichment fields
    
- runs LLM call #1 for meta analysis
    
- runs LLM call #2 for refined note
    
- saves results into file storage and SQLite
    
- updates status and job_items stage records
    

### Useful flags

- `--job <jobId>` process a specific job
    
- `--conversation <conversationId>` process a single conversation
    
- `--resume <jobId>` continue from previous incomplete state
    
- `--only-stage <stage>` run a specific stage only
    
- `--only-failed` process failed items only
    
- `--force` reprocess even if already processed
    
- `--limit <n>` process only first N items
    

### Valid stages for `--only-stage`

- `normalize`
    
- `enrich`
    
- `analyze`
    
- `refine`
    

---

## 8. `publish`

Publishes processed notes into the configured Obsidian vault.

### Usage

ai-archive publish [jobId]  
ai-archive publish --conversation <conversationId>

### Examples

ai-archive publish  
ai-archive publish job_20260318_001  
ai-archive publish --conversation conv_abc123

### Behavior

- reads refined note records
    
- generates frontmatter and markdown body
    
- resolves export path
    
- writes note into vault
    
- records markdown path and published timestamp
    

### Useful flags

- `--job <jobId>`
    
- `--conversation <conversationId>`
    
- `--vault <path>`
    
- `--overwrite`
    
- `--preview` print target path and markdown without writing
    
- `--only-failed`
    

---

## 9. `inspect`

Inspects jobs, conversations, or notes.

### Usage

ai-archive inspect  
ai-archive inspect --job <jobId>  
ai-archive inspect --conversation <conversationId>

### Examples

ai-archive inspect  
ai-archive inspect --job job_20260318_001  
ai-archive inspect --conversation conv_abc123

### Behavior

- prints current status summary
    
- shows counts by stage/status
    
- shows failure info if present
    
- can print note/export metadata for a single conversation
    

### Suggested output sections

- jobs overview
    
- failed items
    
- stage distribution
    
- latest processed items
    
- unresolved errors
    

### Useful flags

- `--job <jobId>`
    
- `--conversation <conversationId>`
    
- `--failed`
    
- `--json`
    

---

## 10. `retry`

Retries failed conversations or incomplete stages.

### Usage

ai-archive retry --job <jobId>  
ai-archive retry --conversation <conversationId>

### Examples

ai-archive retry --job job_20260318_001  
ai-archive retry --conversation conv_abc123

### Behavior

- identifies failed stages from `job_items`
    
- resumes processing from the failed stage
    
- increments attempt counter
    
- preserves previous error history where possible
    

### Useful flags

- `--job <jobId>`
    
- `--conversation <conversationId>`
    
- `--from-stage <stage>`
    
- `--only-failed`
    
- `--force`
    

### Valid stages for `--from-stage`

- `normalized`
    
- `enriched`
    
- `analyzed`
    
- `refined`
    
- `published`
    

---

## 11. Exit Codes

Suggested exit code conventions:

- `0` success
    
- `1` general runtime error
    
- `2` invalid arguments
    
- `3` configuration error
    
- `4` source adapter error
    
- `5` LLM processing error
    
- `6` storage/database error
    
- `7` publish/export error
    

---

## 12. Logging Expectations

### Default output

Human-readable summary:

- current command
    
- item counts
    
- progress
    
- failures
    
- final summary
    

### Verbose output

Detailed stage-level logs:

- source parsing
    
- normalized IDs
    
- provider/model used
    
- per-stage timing
    
- retry attempts
    
- export path resolution
    

### JSON mode

For automation or scripts:

- structured command result
    
- counts
    
- job id
    
- failed items
    
- elapsed time
    

---

## 13. Typical Workflows

## 13.1 Everyday workflow

ai-archive run ./exports/chatgpt-export.json --source chatgpt

Use this when you want the full pipeline in one step.

---

## 13.2 Debug import only

ai-archive import ./exports/chatgpt-export.json --source chatgpt  
ai-archive inspect

Use this when validating source parsing and raw storage.

---

## 13.3 Reprocess a failed batch

ai-archive retry --job job_20260318_001

Use this when a batch failed midway.

---

## 13.4 Publish only

ai-archive publish --job job_20260318_001

Use this when processing succeeded but export was skipped or failed.

---

## 13.5 Process one conversation

ai-archive process --conversation conv_abc123 --force  
ai-archive publish --conversation conv_abc123 --overwrite

Use this when tuning prompts or templates.

---

## 14. Source Values

Suggested valid values for `--source`:

- `chatgpt`
    
- `claude`
    
- `gemini`
    
- `cursor`
    
- `manual`
    

---

## 15. Error Handling Expectations

### Source parsing failure

- mark job item as failed
    
- record parser error
    
- continue processing other items where possible
    

### LLM failure

- mark current stage as failed
    
- preserve normalized data
    
- allow retry from failed stage
    

### Export failure

- keep refined note intact
    
- mark publish stage as failed
    
- allow retry publish separately
    

### Configuration failure

- fail fast before starting job
    

---

## 16. Future CLI Additions

These are intentionally out of v0.1 but may be added later.

- `watch`
    
- `summarize`
    
- `rebuild-index`
    
- `dedupe`
    
- `reprocess`
    
- `doctor`
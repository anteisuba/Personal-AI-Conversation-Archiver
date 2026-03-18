# Roadmap

## 1. Product Vision

AI Convo Archiver is a local-first CLI tool for importing conversation logs from multiple AI tools,
normalizing them into a unified internal format, refining them into knowledge-oriented notes with LLMs,
and publishing the results into an Obsidian vault.

The long-term goal is not chat backup alone, but conversation-to-knowledge transformation.

---

## 2. Development Principles

1. Start with the happy path, but never ignore resume/retry support.
2. Keep v0.1 lightweight and CLI-first.
3. Avoid over-modularization too early.
4. Prefer Markdown as the final knowledge artifact.
5. Use SQLite only for indexing, state tracking, and job management.
6. Treat source adapters as replaceable components.
7. Optimize for local workflows before considering cloud sync or collaboration.

---

## 3. Version Strategy

### v0.1 — Single-user local pipeline
Goal: Make the full pipeline usable end-to-end.

#### Scope
- Import raw conversation files from supported sources
- Normalize them into a single internal model
- Perform lightweight local enrichment
- Run 2 LLM calls:
  - meta analysis
  - refined note generation
- Store metadata and status in SQLite
- Export Markdown notes to Obsidian
- Support retry and resume for failed/interrupted jobs

#### Supported sources (initial target)
- manual text / markdown / json
- ChatGPT export
- Claude export
- one additional source as stretch target:
  - Gemini or Cursor

#### Deliverables
- working CLI
- SQLite schema and migration
- configurable data directory
- configurable vault path
- Markdown export template
- docs for architecture, CLI, and data model

#### Non-goals
- browser extension
- web UI
- real-time sync
- vector database
- semantic search
- team collaboration
- automatic deduplication
- Obsidian plugin

---

### v0.2 — Workflow hardening
Goal: Improve maintainability and day-to-day usability.

#### Scope
- add retry policies per stage
- batch processing improvements
- better progress output and inspection commands
- add weekly summary generation
- project-aware export routing
- configurable category rules
- note refresh / reprocess support
- basic dedupe using content hash

#### Possible additions
- import directory watch mode
- richer prompt tuning
- processing cache by conversation hash
- skip unchanged items automatically

---

### v0.3 — Knowledge consolidation
Goal: Turn multiple related conversations into higher-level knowledge assets.

#### Scope
- similarity detection
- topic aggregation
- project timeline notes
- repeated-question clustering
- reusable prompt extraction improvement
- summary pages by category/project/time range

#### Possible additions
- embeddings-based similarity
- cross-note linking suggestions
- note merging workflows

---

### v1.0 — Productized local system
Goal: A stable and opinionated personal knowledge pipeline.

#### Scope
- robust multi-source support
- fully documented config system
- stable CLI UX
- migration and upgrade path
- plugin/API extension points
- test coverage for major pipeline stages

#### Optional expansion directions
- Obsidian plugin
- browser extension
- lightweight local dashboard
- self-hosted sync mode

---

## 4. Milestones

### Milestone A — Foundation
- initialize monorepo
- create 4 packages:
  - apps/cli
  - packages/core
  - packages/ai
  - packages/storage
- establish TypeScript workspace config
- define core domain models
- define data directory conventions

### Milestone B — Import and Normalize
- implement raw file import
- implement adapter selection
- implement normalized conversation model
- save raw and normalized payloads
- persist conversation rows in SQLite

### Milestone C — Local Enrichment
- detect language locally
- compute message count
- estimate token count
- compute content hash
- update SQLite status and metadata

### Milestone D — AI Processing
- implement provider abstraction
- implement analyze-meta task
- implement refine-note task
- validate outputs with schemas
- store analysis and notes in SQLite + processed files

### Milestone E — Publish
- implement Markdown template
- implement frontmatter builder
- implement path resolver
- write into configured Obsidian vault

### Milestone F — Resume and Retry
- implement jobs and job_items tracking
- implement resume logic
- implement retry command
- improve failure visibility

---

## 5. Priority Order

### P0
Must exist for v0.1 to be considered usable.
- import
- normalize
- enrich local
- analyze meta
- refine note
- persist results
- publish markdown
- job tracking
- retry/resume
- configurable paths

### P1
Highly desirable for v0.1.x or v0.2.
- inspect command
- better CLI progress output
- batch summary
- reprocess single conversation
- weekly summary
- project-based export routing

### P2
Can wait until after the pipeline is proven useful.
- watch mode
- dedupe
- similarity detection
- category statistics
- dashboard
- plugin/extension ecosystem

---

## 6. Risks

### Risk 1: Source format instability
Different AI platforms may change export formats.

Mitigation:
- isolate source-specific parsing inside adapters
- preserve raw payloads
- keep normalized model stable

### Risk 2: LLM cost and latency
Multiple API calls per conversation can get expensive.

Mitigation:
- keep to 2 calls per conversation
- do language detection locally
- support selective reprocessing
- consider caching by content hash later

### Risk 3: Export noise in Obsidian
Too many low-quality notes can pollute the vault.

Mitigation:
- refine notes before export
- keep raw data outside the vault
- make export routing configurable

### Risk 4: Long-running job failure
Batch jobs may fail mid-run.

Mitigation:
- use jobs + job_items tables
- track stage-level status
- support resume from failure points

---

## 7. Exit Criteria for v0.1

v0.1 is complete when all of the following are true:

1. A user can import at least one supported conversation source.
2. Imported files are normalized into the internal data model.
3. Each conversation can be processed through the full pipeline.
4. The system uses only 2 LLM calls per conversation.
5. Results are stored in SQLite and in processed files.
6. Markdown notes are exported into Obsidian successfully.
7. Interrupted jobs can be resumed.
8. Failed items can be retried.
9. All critical paths are documented in `ARCHITECTURE.md`, `DATA_MODEL.md`, and `CLI.md`.

---

## 8. Open Questions

These do not block v0.1 but should be revisited later.

- Should project routing be automatic or config-driven?
- How opinionated should the Markdown template be?
- Should raw exports ever be linkable from notes?
- How should note overwrites vs versioning work?
- When should similarity clustering be introduced?
- When should adapters be split out into a separate package?
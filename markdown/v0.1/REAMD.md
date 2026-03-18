# AI Convo Archiver Architecture

## 1. Overview

AI Convo Archiver is a local-first CLI tool for importing AI conversation logs,
normalizing them into a unified format, refining them with LLMs, and publishing
knowledge-oriented Markdown notes into an Obsidian vault.

The project focuses on personal knowledge consolidation rather than chat replay.

## 2. Goals

### v0.1 Goals
- Import conversation files from multiple AI sources
- Normalize them into a single internal data model
- Perform lightweight local enrichment
- Use 2 LLM calls to analyze and refine content
- Store metadata and processing status in SQLite
- Publish Markdown notes into Obsidian
- Support retry and resume for interrupted jobs

### Non-goals for v0.1
- Real-time sync
- Browser extension
- Web UI
- Vector database
- Similarity clustering
- Team collaboration

## 3. Design Principles

1. Local-first  
   Data is stored locally and processed locally whenever possible.

2. Source-agnostic  
   Source-specific formats are converted into a unified domain model.

3. Markdown-first  
   Final knowledge artifacts live as Markdown files, not database rows.

4. SQLite for state/index only  
   SQLite tracks jobs, statuses, metadata, and exported note paths.

5. Resume-friendly pipeline  
   Processing should be restartable from failure points.

## 4. High-level Flow

```text
Import -> Normalize -> Enrich Local -> Analyze Meta -> Refine Note -> Persist -> Publish
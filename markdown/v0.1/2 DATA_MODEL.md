# Data Model

## 1. Overview

This document defines the core data structures and persistence model used by AI Convo Archiver.

The system stores data in two layers:

1. File-based artifacts
   - raw imported payloads
   - normalized conversations
   - processed results
   - exported markdown

2. SQLite metadata
   - indexing
   - job tracking
   - stage status
   - note lookup
   - error reporting

The database is not the final knowledge store.
Markdown files in Obsidian are the final knowledge artifacts.

---

## 2. Directory-level Data Layout

Recommended app data directory:

`~/.ai-archive/data`

Suggested structure:

```text
data/
├── raw/
│   ├── chatgpt/
│   ├── claude/
│   ├── gemini/
│   ├── cursor/
│   └── manual/
├── normalized/
├── processed/
│   ├── analysis/
│   └── notes/
├── exports/
└── sqlite/
    └── app.db
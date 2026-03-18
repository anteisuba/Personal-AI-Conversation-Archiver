# Personal-AI-Conversation-Archiver
1. 收集多個 AI 平台的聊天記錄 2. 轉成統一格式 3. 用 LLM 做整理、分類、提煉 4. 輸出為 Obsidian 友好的 Markdown 5. 讓你後續用 Claude Code 持續清理和沉澱
# AI Convo Archiver

A local-first CLI tool for importing AI conversation logs, refining them into knowledge-oriented notes, and publishing them into an Obsidian vault.

## Why this project exists

AI conversations are often valuable, but most of them stay scattered across different tools:

- ChatGPT
- Claude
- Gemini
- Cursor
- manual notes / copied chat logs

This project is designed to turn those conversations into structured, reusable knowledge.

Instead of treating AI chats as temporary Q&A, AI Convo Archiver treats them as raw material for a personal knowledge system.

---

## What it does

AI Convo Archiver provides a pipeline that:

1. imports conversation files from multiple sources
2. normalizes them into a unified internal format
3. enriches them locally with metadata
4. uses LLMs to analyze and refine the content
5. stores processing state in SQLite
6. exports knowledge-oriented Markdown notes into Obsidian

The goal is not just chat backup.

The goal is **conversation → knowledge**.

---

## v0.1 Scope

This repository currently focuses on a lightweight, practical v0.1.

### Included in v0.1
- CLI-first workflow
- local-first data storage
- multi-source import
- unified normalized conversation model
- 2-step LLM refinement pipeline
- SQLite-based job tracking
- retry / resume support
- Markdown export to Obsidian

### Not included in v0.1
- browser extension
- web UI
- real-time sync
- vector database
- semantic search
- team collaboration
- Obsidian plugin

---

## Core design principles

- **Local-first**  
  Code, data, and exports stay under your control.

- **Source-agnostic**  
  Different chat platforms are converted into one internal model.

- **Markdown-first**  
  Final knowledge lives as Markdown notes, not database rows.

- **SQLite for state, not for knowledge**  
  SQLite tracks jobs, status, metadata, and exported paths.

- **Resume-friendly pipeline**  
  Long-running processing should be retryable and restartable.

---

## High-level flow

```text
Import -> Normalize -> Enrich Local -> Analyze Meta -> Refine Note -> Persist -> Publish
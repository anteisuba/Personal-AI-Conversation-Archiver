# AI Convo Archiver

A local-first CLI tool to import AI conversation logs, refine them into knowledge-oriented notes with LLM, and publish them into Obsidian.

## Why

AI conversations contain valuable knowledge — solutions, decisions, insights — buried in back-and-forth chat. Existing tools only export conversations as-is. This tool performs a **process → knowledge transformation**: it uses LLM to extract structured knowledge from your conversations and publishes it to Obsidian as interconnected notes.

## Quick Start

```bash
# Install
npm install -g ai-convo-archiver

# Set API key
export ANTHROPIC_API_KEY=sk-ant-xxx

# Configure Obsidian vault
echo '{"vaultDir": "~/Documents/Obsidian/AI-Vault"}' > ~/.ai-archive/config.json

# Run with sample data
ai-archive run examples/chatgpt-sample.json --source chatgpt

# Preview without API calls
ai-archive run export.json --source chatgpt --dry-run
```

## Commands

### `run` — Full pipeline

```bash
ai-archive run <input> --source <chatgpt|claude|manual> [options]

Options:
  --vault <path>    Obsidian vault path (overrides config)
  --dry-run         Preview without LLM calls or publishing
  --overwrite       Overwrite existing notes in vault
```

### `inspect` — View status

```bash
ai-archive inspect [--failed] [--json]
```

### `retry` — Retry failed conversations

```bash
ai-archive retry [--vault <path>] [--overwrite]
```

## Pipeline

```
raw file → [Import] → [Enrich] → [Analyze] → [Publish] → Obsidian
              ↓           ↓          ↓           ↓
           raw store   SQLite     SQLite      Markdown
                      (local     (1 LLM       (vault)
                       fields)   call)
```

1. **Import** — parse export file via source adapter (ChatGPT, Claude, manual)
2. **Enrich** — detect language, estimate tokens, compute content hash
3. **Analyze** — single LLM call extracts category, tags, summary, key points, and rewritten note
4. **Publish** — generate Markdown with frontmatter and wikilinks → Obsidian vault

## Supported Sources

| Source | Format | Status |
|--------|--------|--------|
| ChatGPT | `conversations.json` from Settings → Export | ✅ v0.1 |
| Claude | `conversations.json` from Settings → Export | ✅ v0.1 |
| Manual | `.txt`, `.md`, `.json` | ✅ v0.1 |
| Gemini | — | 🔜 v0.2 |
| Cursor | — | 🔜 v0.2 |

## Output

Each conversation becomes a Markdown note in Obsidian:

```markdown
---
title: "React Hook Form Validation"
source: chatgpt
category: programming
tags: [react, form-validation, hooks]
created: 2026-03-15
confidence: 0.92
---

# React Hook Form Validation

## 摘要
...

## 关键要点
- ...

## 知识笔记
[Structured knowledge extracted by LLM]

## 相关笔记
- [[conv_xxx]] (shared tags)
```

Notes with matching tags or projects are automatically linked via `[[wikilinks]]`.

## Configuration

Config file: `~/.ai-archive/config.json`

```json
{
  "dataDir": "~/.ai-archive/data",
  "vaultDir": "~/Documents/Obsidian/AI-Vault",
  "llm": {
    "model": "claude-haiku-4-5-20251001"
  },
  "promptLanguage": "auto"
}
```

API key via environment variable only (never stored in config):
```bash
export ANTHROPIC_API_KEY=sk-ant-xxx
```

## Tech Stack

- TypeScript + Node.js
- [sql.js](https://github.com/sql-js/sql.js) (WASM SQLite — zero native dependencies)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) (structured output via tool_use)
- [commander](https://github.com/tj/commander.js) (CLI)
- [zod](https://github.com/colinhacks/zod) (schema validation)

## License

MIT

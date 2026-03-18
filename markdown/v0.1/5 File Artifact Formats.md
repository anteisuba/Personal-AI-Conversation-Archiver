## 5.1 Raw file

Stores the imported source payload as-is.

Recommended behavior:

- preserve original structure
    
- do not mutate
    
- add import-level wrapper only if necessary
    

Example path:

- `raw/chatgpt/chatgpt-20260318-001.json`
    

---

## 5.2 Normalized file

Stores `NormalizedConversation` as JSON.

Example path:

- `normalized/chatgpt-20260318-001.json`
    

---

## 5.3 Processed analysis file

Stores `ConversationMetaAnalysis` as JSON.

Example path:

- `processed/analysis/chatgpt-20260318-001.json`
    

---

## 5.4 Processed note file

Stores `RefinedNote` as JSON.

Example path:

- `processed/notes/chatgpt-20260318-001.json`
    

---

## 5.5 Exported Markdown

Stored in the configured Obsidian vault.

Suggested routing:

- by category
    
- optionally by project
    
- configurable path strategy
    

Example path:

- `Programming/Nextjs/Next.js 锁文件问题.md`
    
- `Projects/pixelvault/Prisma 迁移问题.md`
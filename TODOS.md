# TODOS

## TODO-1: SQLite Schema Version Control
**What:** Add a `schema_version` table and sequential migration scripts to SQLite initialization.
**Why:** Without versioning, the first schema change after v0.1 will break existing installations — users would need to manually delete their DB.
**Pros:** Future-proofs the DB for upgrades; trivial cost now, saves significant pain later.
**Cons:** Adds ~30 lines of migration boilerplate.
**Context:** v0.1 creates the DB on first run via auto-init. When v0.2 adds new tables/columns, the app needs to detect the old schema and migrate. A simple `schema_version` table with an integer version + ordered SQL scripts (`001_init.sql`, `002_add_column.sql`) is sufficient. No ORM or migration framework needed.
**Depends on:** SQLite initialization code (must be implemented first).
**Priority:** Should be done before v0.2 release at the latest.

## TODO-2: Update Supporting Design Docs
**What:** Update or replace `markdown/v0.1/` docs to match the eng-review-adjusted plan.
**Why:** The 6 supporting docs reference 5 adapters, 4 packages, 2 LLM calls, 8 exit codes, and 5 SQLite tables — all of which changed during eng review. Leaving them as-is creates confusion for contributors.
**Pros:** Ensures all docs are consistent; makes onboarding easier.
**Cons:** Time spent on docs that may become obsolete as the project evolves.
**Context:** The canonical source of truth is now the plan file at `~/.claude/plans/zany-singing-sutton.md` (also saved as a gstack design doc). The `markdown/v0.1/` files can either be updated to match or replaced with a single `docs/ARCHITECTURE.md` generated from the plan.
**Depends on:** Completing v0.1 implementation (update docs to match what was actually built).
**Priority:** After v0.1 is functional, before public release.

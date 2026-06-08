# HLD-Prep Skill & Command File Audit — Fixes

## Context
Reviewed all skill files, command files, and CLAUDE.md in hld-prep against the write-a-skill standard. Found 5 issues: missing frontmatter, oversized SKILL.md, inconsistent path prefixes, missing-file crash in start-hld, and duplicated staging logic.

---

## Tasks

### Task 1 — Add YAML frontmatter to `srs-revision-coach/SKILL.md`

**File:** `.claude/skills/srs-revision-coach/SKILL.md`

Replace the top comment-style lines:
```
# Skill: SRS Interval Calculator — HLD Edition
# Reusable by: hld-prep review command
# Adapted from: dsa-prep SRS skill — same intervals, HLD-specific review modes
```

With proper YAML frontmatter:
```yaml
---
name: srs-revision-coach
description: SRS interval calculator and review mode selector for HLD interview prep. Use when running an HLD revision session, computing next review date, or assigning Full/Snippet/Blitz/Sprint mode for a design card.
---
```

---

### Task 2 — Split `srs-revision-coach/SKILL.md` → extract mode details to `REFERENCE.md`

**Goal:** Keep SKILL.md under 100 lines. Move execution details to `.claude/skills/srs-revision-coach/REFERENCE.md`.

**Move to REFERENCE.md** (the 4 mode execution descriptions):
- Full Mode — Redesign from scratch (full block)
- Snippet Mode — Fill in the critical gaps (full block)
- Blitz Mode — Core insight flash card (full block)
- Sprint Mode — Forced recall while memory fresh (full block)

**Keep in SKILL.md:**
- Stage → Base Interval table
- Rating → Next Interval table
- Double-Strong Fast-Track rule
- Mode Assignment rules (8 rules)
- Initial Stage Assignment section (added in Task 5)
- SRS Tracking Block template
- After Each Review block

**Add to SKILL.md** after Mode Assignment:
```
See [REFERENCE.md](REFERENCE.md) for per-mode execution details.
```

---

### Task 3 — Standardize path prefixes to `@notes/` everywhere

**Files:** `.claude/commands/review-hld.md`, `.claude/commands/start-hld.md`

Replace all occurrences of `@hld-prep/notes/` → `@notes/`
Replace all occurrences of `@hld-prep/PREP-PLAN.md` → `@PREP-PLAN.md`

Affected references:
- `@hld-prep/notes/REVIEW.md` → `@notes/REVIEW.md`
- `@hld-prep/notes/GAP-DRILLS-HLD.md` → `@notes/GAP-DRILLS-HLD.md`
- `@hld-prep/notes/[file].md` → `@notes/[file].md`
- `@hld-prep/PREP-PLAN.md` → `@PREP-PLAN.md`

---

### Task 4 — Graceful fallback in `start-hld.md` when `PREP-PLAN.md` is missing

**File:** `.claude/commands/start-hld.md`

Replace Step 4 body with:
```
## Step 4 — Next System
If PREP-PLAN.md does not exist:
  Say: "No prep plan found. Say any system name to start a design session."
  Skip this step.

If PREP-PLAN.md exists:
  Check week sequence. Find the next system not yet in REVIEW.md (not yet designed).
  Suggest:
    📐 Next system in your plan: [System Name]
    Say "[System Name]" to start the design session.

  If all plan systems are already designed:
    ✅ All planned systems designed. You're in full review mode.
    Next review: [date] — [N] designs due.
```

---

### Task 5 — Consolidate Initial Stage Assignment into skill; remove duplicates

**Step A — Add section to `.claude/skills/srs-revision-coach/SKILL.md`:**

```markdown
## Initial Stage Assignment (first design session only)
Set Stage based on the session's overall rating score:
- 5/5 → Stage 3 (first review in 10 days)
- 4/5 → Stage 2 (first review in 3 days)
- 3/5 and below → Stage 1 (review tomorrow)
```

**Step B — Remove from `review-hld.md`:**
Delete the entire `## Initial Stage for Newly Designed Systems` section (lines 99–106).

**Step C — Update `CLAUDE.md` Phase 8 Card Save:**
Replace the inline staging rules with:
```
Set initial Stage per srs-revision-coach skill Initial Stage Assignment rules.
```

---

## Verification

1. Open `srs-revision-coach/SKILL.md` — confirm frontmatter present, file under 100 lines, mode details absent, link to REFERENCE.md present
2. Open `srs-revision-coach/REFERENCE.md` — confirm all 4 mode descriptions present
3. Grep for `@hld-prep/` in all .md files — should return zero results
4. Run `/start-hld` with no PREP-PLAN.md — Step 4 should show the fallback message
5. Grep for "Initial Stage" in review-hld.md — should return zero results
6. Check CLAUDE.md Phase 8 — staging rules should delegate to skill

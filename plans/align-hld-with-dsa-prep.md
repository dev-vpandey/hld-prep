# HLD-Prep: Align Coach Flow with DSA-Prep

## Context

User compared hld-prep against dsa-prep (the reference implementation) to find missing features and contradictions. 7 grilling questions resolved all decisions. Goal: make hld-prep's coach flow structurally consistent with dsa-prep while respecting that HLD sessions are heavier (3 reviews/session not 5, design phases not algorithm phases).

---

## Changes Required

### 1. Bug Fixes — CLAUDE.md

**File:** `CLAUDE.md`

Three contradictions to fix:

- **Wrong command name:** Phase 8 says `"Saved. Run /review to start the retention cycle."` → change to `/review-hld`
- **Stale path:** Template path uses `/Users/vicky/Java_Projects/hld-prep/shared/templates/hld-design-card.md` → fix to `shared/templates/hld-design-card.md` (relative) or correct absolute path
- **Duplicate save instruction:** Under "Design Card Template" comment block, there's a flat save reference `@notes/[system-name]-design.md` — remove it. Canonical save is subfolder: `@notes/[system-name]/[system-name]-design.md`
- **GRADUATED.md not mentioned:** CLAUDE.md never references `notes/GRADUATED.md` but review command uses it. Add reference under "Solved Designs" section.

---

### 2. Bug Fix — review-hld.md

**File:** `.claude/commands/review-hld.md`

- Remove `"Hard daily cap: 5 designs total per day"` — contradicts `"Max 3 per session"`. Keep only: **Max 3 per session, hard cap.**
- DSA forces Blitz for 3+ days overdue (regardless of stage). Add same rule:
  ```
  3+ days overdue → force Blitz (overrides normal mode assignment)
  ```

---

### 3. SRS Skill — Stage 3 Interval Fix

**File:** `.claude/skills/srs-revision-coach/SKILL.md`

Change Stage 3 base interval from **7 days → 10 days** to match DSA-prep:

```
Stage 1 → 1d  |  Stage 2 → 3d  |  Stage 3 → 10d
Stage 4 → 21d  |  Stage 5 → 45d  |  Stage 6 → 90d
```

Also add **Double-Strong Fast-Track** rule (currently missing):
```
Stage 3 + Last Rating Strong + Current Rating Strong → advance to Stage 4 immediately
```

---

### 4. SRS Skill — Sprint Mode

**File:** `.claude/skills/srs-revision-coach/SKILL.md`

Add Sprint Mode for Stage 1/2 designs (mirror DSA-prep):

```
Sprint Mode applies to: Stage 1 and Stage 2 designs only

Day+1 (Full Sprint):
  - Show system name only
  - Prompt: "Walk me through your design. Start with requirements."
  - No card, no hints unless asked
  - Rate normally (Strong / Okay / Weak / Blank)

Day+3 (Snippet Sprint):
  - Show system name + tag
  - Prompt: "Sketch the core architecture. Call out 2 critical trade-offs."
  - No full walkthrough needed — components + trade-offs only
  - Rate immediately when done

Sprint pass/fail:
  - Pass (Okay/Strong) → advance normally (Stage 2 = 3 days out)
  - Fail (Weak/Blank) → stay Stage 1, Review Date = today + 1
```

Add Sprint Mode to the Mode Assignment table:
```
Stage 1, never reviewed      → Full Sprint (Day+1)
Stage 1, reviewed Day+1      → Snippet Sprint (Day+3)
Stage 1–2, Last Okay/Strong  → Snippet
Stage 3–4                    → Snippet
Stage 5–6                    → Blitz
Graduated                    → Blitz
Blank/Weak last rating       → Full (always, overrides above)
3+ days overdue              → Blitz (always, overrides above)
```

---

### 5. review-hld.md — Sprint Mode Integration

**File:** `.claude/commands/review-hld.md`

Add to Step 2 (Build Queue) — Sprint check runs first:
```
Sprint Check (runs before normal queue):
  - Any Stage 1 design saved today (Day+1) → top of queue, Full Sprint
  - Any Stage 1 design saved 3 days ago (Day+3) → top of queue, Snippet Sprint
  - Sprint items don't count toward the 3-per-session cap
```

Add to Step 3 (Session Plan) — show sprint items separately:
```
🏃 Sprint (must-do):
#  System           Stage  Mode           Saved
1  Twitter Feed     1      Full Sprint    today

📋 Queue:
#  System           Stage  Mode     Reason
2  Rate Limiter     3      Snippet  Stage 3-4
```

---

### 6. New File — notes/GAP-DRILLS-HLD.md

**File:** `notes/GAP-DRILLS-HLD.md` (create)

Template:
```markdown
# HLD Gap Drills
# Format: | System | Tag | Gap Type | Logged | Notes |
# Gap Types: Depth (know components, can't articulate failure modes) | Choice (can't justify storage/queue/cache choice)

| System | Tag | Gap Type | Logged | Notes |
|--------|-----|----------|--------|-------|
```

Add to review-hld.md Step 1 (Setup):
```
After asking time available:
- Read notes/GAP-DRILLS-HLD.md
- If open gap drills exist, surface first: "You have [N] open gap drills. Want to start there?"
```

Add to review-hld.md Step 4 (Per Design) — after Weak/Blank rating:
```
Coach asks: "Was this a Depth gap (knew components, fumbled failure modes) or Choice gap (couldn't justify the storage/queue choice)?"
Log to notes/GAP-DRILLS-HLD.md.
```

Add to review-hld.md Step 5 (Session Summary):
```
Open gap drills: [N] (Depth: X, Choice: Y)
```

---

### 7. New File — .claude/commands/start-hld.md

**File:** `.claude/commands/start-hld.md` (create)

Logic mirrors DSA-prep's `/start`:

```
## /start-hld

Step 1 — Sprint Check
  Read REVIEW.md. If any Stage 1 design:
    - saved today → Day+1 Sprint due
    - saved 3 days ago → Day+3 Sprint due
  If sprints due: show sprint table, prompt "Run /review-hld to start."

Step 2 — Reviews Due
  Count designs due today or overdue.
  If N > 0: show "You have [N] designs due for review. Run /review-hld."

Step 3 — Category Gap
  Find domains (from Tag column in REVIEW.md) not practiced in 7+ days.
  Suggest: "You haven't reviewed [tag] in [N] days. Consider designing [next system in that category]."

Step 4 — Next System (PREP-PLAN sequence)
  Check PREP-PLAN.md week sequence. Find next undesigned system.
  Suggest: "Next system in your plan: [System Name]. Ready to start?"

If nothing pending: "All caught up. Next system: [X]. Say the name to begin."
```

---

## Files to Modify

╔══════════════════════════════════════════════════════╦══════════════════════════════════════════════════════════════╗
║ File                                                 ║ Change                                                       ║
╠══════════════════════════════════════════════════════╬══════════════════════════════════════════════════════════════╣
║ CLAUDE.md                                            ║ Fix /review → /review-hld; fix stale path; remove flat save  ║
║                                                      ║ ref; add GRADUATED.md mention                                ║
║ .claude/commands/review-hld.md                       ║ Remove daily cap; add overdue Blitz rule; add sprint queue   ║
║ .claude/skills/srs-revision-coach/SKILL.md           ║ Stage 3: 7d → 10d; add Double-Strong Fast-Track; Sprint Mode ║
╚══════════════════════════════════════════════════════╩══════════════════════════════════════════════════════════════╝

## Files to Create

╔══════════════════════════════════╦══════════════════════════════════════════════════════════════╗
║ File                             ║ Purpose                                                      ║
╠══════════════════════════════════╬══════════════════════════════════════════════════════════════╣
║ notes/GAP-DRILLS-HLD.md          ║ Track Depth/Choice gaps per system                           ║
║ .claude/commands/start-hld.md    ║ Session initializer: sprint → reviews → gap → next system    ║
╚══════════════════════════════════╩══════════════════════════════════════════════════════════════╝

---

## Verification

1. Run `/start-hld` → shows sprint/review/category status
2. Design a system, say `done` → card to subfolder, row in REVIEW.md, tells you to run `/review-hld`
3. Next day run `/review-hld` → Day+1 sprint at top, marked Full Sprint
4. Day+3 run `/review-hld` → Day+3 sprint item, marked Snippet Sprint
5. Rate Weak → coach asks Depth or Choice gap → logs to GAP-DRILLS-HLD.md
6. Mark a design 4 days overdue → run `/review-hld` → gets Blitz regardless of stage
7. Check SRS skill → Stage 3 = 10d; Double-Strong rule present

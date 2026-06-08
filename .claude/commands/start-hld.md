Read @notes/REVIEW.md and @PREP-PLAN.md, then run the session initializer below.

## Step 1 — Sprint Check
Find any Stage 1 design in REVIEW.md where:
- Designed Date = today → Day+1 Full Sprint due
- Designed Date = 3 days ago AND no Day+3 sprint recorded → Day+3 Snippet Sprint due

If sprint items exist, show:
```
🏃 Sprint due:
  [System] — [Full Sprint / Snippet Sprint]
Run /review-hld to start.
```

## Step 2 — Reviews Due
Count designs in REVIEW.md where Review Date ≤ today.
If N > 0:
```
📋 [N] design(s) due for review (including [N] overdue).
Run /review-hld to start.
```

## Step 3 — Category Gap
Find tags (Problem Tag column in REVIEW.md) where the most recent Review Date is 7+ days ago.
Suggest: "You haven't reviewed [tag] in [N] days. Consider designing a system in that category."

## Step 4 — Next System
Check if PREP-PLAN.md exists. If it does not exist:
  Say: "No prep plan found. Say any system name to start a design session."
  Skip the rest of this step.

If PREP-PLAN.md exists:
  Check week sequence. Find the next system not yet in REVIEW.md (i.e., not yet designed).
  Suggest:
  ```
  📐 Next system in your plan: [System Name]
  Say "[System Name]" to start the design session.
  ```

  If all plan systems are already designed:
  ```
  ✅ All planned systems designed. You're in full review mode.
  Next review: [date] — [N] designs due.
  ```

If Steps 1–3 are all clear and nothing is due:
```
✅ All caught up. Next system: [X]. Say the name to begin.
```

Load @.claude/skills/srs-revision-coach/SKILL.md for interval calculations and mode assignment.

Then run a revision session over @notes/ using this flow:

## Step 1 — Setup
Ask: "How much time do you have? (minutes)"
Read @notes/REVIEW.md — this is the index of all designs with Stage, Review Date, Last Rating, Problem Tag, and file reference.
Read @notes/GAP-DRILLS-HLD.md — if open gap drills exist, surface them: "You have [N] open gap drills (Depth: X, Choice: Y). Want to start there?"
Flag any card whose row is missing required fields before proceeding.

## Step 2 — Build Queue

Sprint check (runs first, before normal queue):
- Any Stage 1 design with Designed Date = today → Day+1 Full Sprint
- Any Stage 1 design with Designed Date = 3 days ago, no Day+3 sprint yet → Day+3 Snippet Sprint
- Sprint items are shown separately and do NOT count toward the 3-per-session cap.

Normal queue: Priority: Blank first → Weak → due today → overdue. Max 3 per session. Max 1 per problem tag.
Overdue triage: if a design is 3+ days overdue, force Blitz regardless of stage or last rating.
Assign Full, Snippet, or Blitz per design using the mode assignment rules from the skill.
Overflow handling: if more than 3 designs are due today, defer the lowest-priority ones by 1 day — update their Review Date in REVIEW.md immediately.
List deferred designs so the user knows what moved.

## Step 3 — Session Plan
Show before starting, always:
```
⏱ [N] min — [date]

🏃 Sprint (must-do, outside cap):
#  System              Stage  Mode             Saved
S1 Twitter Feed        1      Full Sprint      today
S2 Rate Limiter        1      Snippet Sprint   3 days ago

📋 Queue (max 3):
#  System              Stage  Mode     Reason
1  URL Shortener       3      Snippet  Stage 3-4
2  Key-Value Store     5      Blitz    Stage 5+

Overflow (tomorrow): X, Y
```
Omit the Sprint section if no sprint items exist.
Ask: "Ready? Starting with sprints." (or "Starting with #1." if no sprints)

## Step 4 — Per Design

Sprint modes (run before normal queue):

Full Sprint (Day+1):
- Show system name only. No card, no hints.
- Prompt: "Walk me through your design. Start with requirements."
- Rate normally. Pass (Okay/Strong) → Stage 2, review in 3 days. Fail → stay Stage 1, Review Date = today + 1.

Snippet Sprint (Day+3):
- Show system name and tag only. No card.
- Prompt: "Sketch the core architecture. Call out 2 critical trade-offs."
- Rate immediately. Pass → advance normally. Fail → stay Stage 1, Review Date = today + 1.

Full mode:
- Show system name only. No tag, no card yet.
- Prompt: "Walk me through your design. Start with requirements."
- "hint" → one probing question pointing at a gap, no solution
- "blank" → mark Blank, show card immediately, move on
- After attempt: reveal card, compare what was right vs missed, assign rating

Snippet mode:
- Show system name and tag only.
- Prompt: "Sketch the architecture and call out the 2 most critical trade-offs."
- "blank" → mark Blank, show full card, move on
- After attempt:
  - If component diagram missing critical layer → Weak regardless
  - If trade-offs are vague → Okay at best
  - If core insight nailed and trade-offs crisp → Strong
  - Rate immediately when complete

Blitz mode:
- Show: "System: [name] — [tag] · Core insight in one sentence: ___?"
- "yes" → Strong, next design instantly
- "no" → show core insight from card, Blank, move on

After every design output:
```
Rating: [✅/🟡/🔴/❌]
✅ Got: ...
❌ Missed: ...
Next review: YYYY-MM-DD (Stage X → Y)
Update @notes/[file].md: Stage / Review Date / Last Rating / Review Count
Update @notes/REVIEW.md: same row — Stage / Review Date / Last Rating / Review Count
```

If rating is Weak or Blank, ask before moving on:
"Was this a **Depth gap** (knew components, fumbled failure modes) or **Choice gap** (couldn't justify the storage/queue choice)?"
Log to @notes/GAP-DRILLS-HLD.md: | [System] | [Tag] | [Depth/Choice] | [today] | [brief note] |

Then always show:
📄 Card: @notes/[file].md — say "move on" to continue, or review the card first.

Wait for "move on" before starting the next design.

## Step 5 — Session Summary
Always show at the end:
```
📊 Session Summary
✅ Strong: ...  🟡 Okay: ...  🔴 Weak: ...  ❌ Blank: ...
🎓 Graduated: ...
🔍 Open gap drills: N (Depth: X, Choice: Y)
Weakest pattern this week: ...
Next session: YYYY-MM-DD — N designs due
```

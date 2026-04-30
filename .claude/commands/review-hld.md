Load @.claude/skills/srs-revision-coach/SKILL.md for interval calculations and mode assignment.

Then run a revision session over @hld-prep/notes/ using this flow:

## Step 1 — Setup
Ask: "How much time do you have? (minutes)"
Read @hld-prep/notes/REVIEW.md — this is the index of all designs with Stage, Review Date, Last Rating, Problem Tag, and file reference.
Flag any card whose row is missing required fields before proceeding.

## Step 2 — Build Queue
Priority: Blank first → Weak → due today → overdue. Max 3 per session (designs take longer than DSA). Max 1 per problem tag. Hard daily cap: 5 designs total per day.
Assign Full, Snippet, or Blitz per design using the mode assignment rules from the skill.
Overflow handling: if more than 5 designs are due today, defer the lowest-priority ones by 1 day — update their Review Date in REVIEW.md immediately.
List deferred designs so the user knows what moved.

## Step 3 — Session Plan
Show before starting, always:
```
⏱ [N] min — [date]

#  System                  Stage  Mode     Reason
1  Design Twitter Feed     2      Full     Stage 1-2
2  Design Rate Limiter     4      Snippet  Stage 3-4
3  Design URL Shortener    5      Blitz    Stage 5+

Overflow (tomorrow): X, Y
```
Ask: "Ready? Starting with #1."

## Step 4 — Per Design

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
Update @hld-prep/notes/[file].md: Stage / Review Date / Last Rating / Review Count
Update @hld-prep/notes/REVIEW.md: same row — Stage / Review Date / Last Rating / Review Count
```

Then always show:
📄 Card: @notes/[file].md — say "move on" to continue, or review the card first.

Wait for "move on" before starting the next design.

## Initial Stage for Newly Designed Systems
When saving a card after a first design session (not a review), set Stage based on overall rating:
- 5/5 → Stage 3 (first review in 7 days)
- 4/5 → Stage 2 (first review in 3 days)
- 3/5 and below → Stage 1 (review tomorrow)

Graduation: when Stage hits 6 with Strong, output graduation notice and
append to @hld-prep/notes/GRADUATED.md: name | tag | date | next ping +90 days

## Step 5 — Session Summary
Always show at the end:
```
📊 Session Summary
✅ Strong: ...  🟡 Okay: ...  🔴 Weak: ...  ❌ Blank: ...
🎓 Graduated: ...
Weakest pattern this week: ...
Next session: YYYY-MM-DD — N designs due
```

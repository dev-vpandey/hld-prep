# SRS Revision Coach — Mode Execution Reference

## HLD Review Modes

### Full Mode — Redesign from scratch
- Show system name only. No tag, no card, no hints.
- Prompt: "Walk me through your design for [System]. Start with requirements."
- Let user drive all 7 phases (requirements → estimation → API → HLD → deep dive → trade-offs → failure modes)
- "hint" → one probing question pointing at a gap
- "blank" → mark Blank, show card immediately, move on
- After attempt: reveal card, compare what was right vs missed, assign rating
- Rating criteria:
  - ✅ Strong: covered all phases, articulated trade-offs and failure modes unprompted
  - 🟡 Okay: covered main design, missed 1 phase or 1 major trade-off
  - 🔴 Weak: missed core insight or key component, needed hints
  - ❌ Blank: couldn't start or got core insight wrong

### Snippet Mode — Fill in the critical gaps
- Show system name and tag only.
- Prompt: "Sketch the architecture and call out the 2 most critical trade-offs you made."
- User writes:
  - ASCII component diagram (rough is fine)
  - 2–3 critical trade-offs from the card
  - Core insight in one sentence
- "blank" → mark Blank, show full card, move on
- After attempt:
  - If component diagram is wrong (missing critical layer) → Weak regardless
  - If trade-offs are vague ("I used SQL because it's reliable") → Okay at best
  - If core insight is nailed and trade-offs are crisp → Strong
  - Once coverage is complete → rate immediately, no follow-up

### Blitz Mode — Core insight flash card
- Show: "System: [name] — [tag] · Core insight in one sentence: ___?"
- User answers in one sentence
- "yes" → Strong, next problem instantly
- "no" → show core insight from card, Blank, move on
- No architecture, no trade-offs discussion

### Sprint Mode — Forced recall while memory fresh (Stage 1/2 only)

Sprint Mode fires on the two days immediately after a design is first saved. It forces active recall before the design fades.

**Day+1 Full Sprint** (design saved today, never reviewed):
- Show system name only. No card, no hints.
- Prompt: "Walk me through your design. Start with requirements."
- Rate normally: Strong / Okay / Weak / Blank
- Pass (Okay/Strong) → advance to Stage 2, review in 3 days
- Fail (Weak/Blank) → stay Stage 1, Review Date = today + 1

**Day+3 Snippet Sprint** (design saved 3 days ago, Day+1 done):
- Show system name and tag only. No card.
- Prompt: "Sketch the core architecture. Call out 2 critical trade-offs."
- Rate immediately when complete
- Pass (Okay/Strong) → advance normally from Stage 1
- Fail (Weak/Blank) → stay Stage 1, Review Date = today + 1

Sprint items are shown separately from the normal review queue and do not count toward the 3-per-session cap.

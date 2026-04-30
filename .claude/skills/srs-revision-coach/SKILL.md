# Skill: SRS Interval Calculator — HLD Edition
# Reusable by: hld-prep review command
# Adapted from: dsa-prep SRS skill — same intervals, HLD-specific review modes

---

## Stage → Base Interval
| Stage | Interval |
|---|---|
| 1 | 1 day |
| 2 | 3 days |
| 3 | 7 days |
| 4 | 21 days |
| 5 | 45 days |
| 6 | 90 days — graduated |

## Rating → Next Interval
| Rating | Next interval | Stage change |
|---|---|---|
| ✅ Strong | base × 1.5, round up | +1 |
| 🟡 Okay | base interval | no change |
| 🔴 Weak | base ÷ 2, min 1 day | no change |
| ❌ Blank | 1 day | reset to Stage 1 |

Graduated exception: Blank on a graduated card → reset to Stage 3 only, not Stage 1.

## Mode Assignment
Given card state, assign Full, Snippet, or Blitz:
- Last Rating Blank or Weak → Full (always, overrides everything)
- Stage 1, Last Rating — (never reviewed) → Full
- Stage 1–2, Last Rating Okay or Strong → Snippet
- Stage 3–4 → Snippet
- Stage 5–6 → Blitz
- Graduated → Blitz

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

## SRS Tracking Block (required on every card)
```
## SRS Tracking
- Stage: 1
- Review Date: YYYY-MM-DD
- Last Rating: —
- Review Count: 0
- Graduated: No
```
If a card is missing this block, flag it before the session and show the default values above.

## After Each Review — What to Update
```
Stage: [old → new]
Review Date: [new date]
Last Rating: [Strong / Okay / Weak / Blank]
Review Count: [increment by 1]
Graduated: [Yes if Stage just hit 6 with Strong, otherwise No]
```

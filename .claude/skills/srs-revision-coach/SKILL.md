---
name: srs-revision-coach
description: SRS interval calculator and review mode selector for HLD interview prep. Use when running an HLD revision session, computing next review date, or assigning Full/Snippet/Blitz/Sprint mode for a design card.
---

## Stage → Base Interval
| Stage | Interval |
|---|---|
| 1 | 1 day |
| 2 | 3 days |
| 3 | 10 days |
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

Double-Strong Fast-Track: Stage 3 + Last Rating Strong + Current Rating Strong → advance to Stage 4 immediately (don't wait for the 10-day base interval).

## Mode Assignment
Given card state, assign Sprint, Full, Snippet, or Blitz. Override rules run top to bottom — first match wins:

1. 3+ days overdue → **Blitz** (always, overrides everything)
2. Last Rating Blank or Weak → **Full** (always)
3. Stage 1, Last Rating — (never reviewed, saved today) → **Full Sprint** (Day+1)
4. Stage 1, reviewed Day+1 (saved 3 days ago, no Day+3 sprint yet) → **Snippet Sprint** (Day+3)
5. Stage 1–2, Last Rating Okay or Strong → **Snippet**
6. Stage 3–4 → **Snippet**
7. Stage 5–6 → **Blitz**
8. Graduated → **Blitz**

## Initial Stage Assignment (first design session only)
Set Stage based on the session's overall rating score:
- 5/5 → Stage 3 (first review in 10 days)
- 4/5 → Stage 2 (first review in 3 days)
- 3/5 and below → Stage 1 (review tomorrow)

See [REFERENCE.md](REFERENCE.md) for per-mode execution details.

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

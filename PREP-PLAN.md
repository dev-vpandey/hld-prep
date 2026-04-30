# MAANG Prep Plan — HLD + DSA Integration

**Target:** Staff Engineer at MAANG · **Timeline:** 4 months (~17 weeks) · **Start:** 2026-04-11

---

## Time Budget

```
╔══════════╦══════════════════════════════════════════╦═══════╗
║ Day      ║ Block                                    ║ Time  ║
╠══════════╬══════════════════════════════════════════╬═══════╣
║ Weekdays ║ Total available                          ║ 90 min║
║ Weekends ║ Total available                          ║120 min║
║ DSA rev  ║ Cap (SRS-based, any day)                 ║ 25 min║
╚══════════╩══════════════════════════════════════════╩═══════╝
```

---

## Two-Phase Arc

### Phase 1 — Weeks 1–6 (DSA new problems primary)

```
╔══════════╦══════════════════════════════════════════╦═══════╗
║ Day      ║ Block                                    ║ Time  ║
╠══════════╬══════════════════════════════════════════╬═══════╣
║ Mon–Fri  ║ DSA review (SRS-based)                   ║ 20 min║
║          ║ DSA new problem                          ║ 65 min║
╠══════════╬══════════════════════════════════════════╬═══════╣
║ Saturday ║ Full HLD session (all 8 phases)          ║ 90 min║
║          ║ Card save + diagram                      ║ 30 min║
╠══════════╬══════════════════════════════════════════╬═══════╣
║ Sunday   ║ DSA catch-up / hard problem              ║ 90 min║
║          ║ HLD SRS review if cards due              ║ 30 min║
╚══════════╩══════════════════════════════════════════╩═══════╝
```

DSA topic order: DP-1D → DP-2D → DP-Intervals/Strings → Backtracking → Greedy → MST/Graph

### Phase 2 — Weeks 7–17 (DSA review-only, HLD expanded)

```
╔══════════╦══════════════════════════════════════════╦═══════╗
║ Day      ║ Block                                    ║ Time  ║
╠══════════╬══════════════════════════════════════════╬═══════╣
║ Mon–Fri  ║ DSA review (SRS-based)                   ║ 25 min║
║          ║ /review-hld (SRS)                        ║ 25 min║
║          ║ Mock / deep-dive practice                ║ 40 min║
╠══════════╬══════════════════════════════════════════╬═══════╣
║ Saturday ║ Full HLD session (all 8 phases)          ║ 90 min║
║          ║ Card save + diagram                      ║ 30 min║
╠══════════╬══════════════════════════════════════════╬═══════╣
║ Sunday   ║ HLD SRS + trade-off drilling             ║ 60 min║
║          ║ Week recap / prep for next system        ║ 60 min║
╚══════════╩══════════════════════════════════════════╩═══════╝
```

---

## HLD System Sequence (17 weeks)

```
╔══════╦══════════════════════════════════╦════════════════════════════╗
║ Week ║ System                           ║ Core Patterns              ║
╠══════╬══════════════════════════════════╬════════════════════════════╣
║  1   ║ URL Shortener                    ║ Hashing, Redirect, KV      ║
║  2   ║ Rate Limiter                     ║ Token bucket, Sliding win  ║
║  3   ║ Key-Value Store                  ║ LSM, Consistent hash, Rep  ║
║  4   ║ Unique ID Generator              ║ Snowflake, Clock skew       ║
╠══════╬══════════════════════════════════╬════════════════════════════╣
║  5   ║ Notification System              ║ Pub-sub, Fan-out, DLQ      ║
║  6   ║ Chat System (WhatsApp/Slack)      ║ WebSocket, Msg store, Sync ║
║  7   ║ News Feed (Instagram/Twitter)    ║ Fan-out write/read, Hybrid ║
╠══════╬══════════════════════════════════╬════════════════════════════╣
║  8   ║ Web Crawler                      ║ BFS, Dedup, Politeness     ║
║  9   ║ Search Autocomplete              ║ Trie, Prefix cache, Rank   ║
║ 10   ║ Google Search (simplified)       ║ Inverted index, MapReduce  ║
╠══════╬══════════════════════════════════╬════════════════════════════╣
║ 11   ║ YouTube / Video Streaming        ║ CDN, Chunking, Encoding    ║
║ 12   ║ Google Drive / Dropbox           ║ Blob store, Delta sync     ║
║ 13   ║ Ad Click Aggregator              ║ Stream, Count-min, Batch   ║
╠══════╬══════════════════════════════════╬════════════════════════════╣
║ 14   ║ Uber / Proximity Service         ║ Geo-index, QuadTree, WS    ║
║ 15   ║ Ticketmaster / Booking           ║ Optimistic lock, Inventory ║
║ 16   ║ Payment System                   ║ Idempotency, Saga, 2PC     ║
╠══════╬══════════════════════════════════╬════════════════════════════╣
║ 17   ║ Metrics / Monitoring System      ║ Time series, Pull vs push  ║
╚══════╩══════════════════════════════════╩════════════════════════════╝
```

---

## Workflow

**Start a new HLD session:**
1. Say `Design [System Name]` — coach runs all 8 phases
2. Say `done` — triggers Phase 8 rating + card save
3. Card saved to `notes/[system-name]/`, row appended to `notes/REVIEW.md`

**Run SRS review:**
- `/review-hld` — reads REVIEW.md, builds queue, runs Full/Snippet/Blitz mode

**Hint system during sessions:**

```
╔══════════════╦══════════════════════════════════════════════════╗
║ You say      ║ Coach does                                       ║
╠══════════════╬══════════════════════════════════════════════════╣
║ hint         ║ One probing question — no names, no solutions    ║
║ stuck        ║ Real-world analogy for the concept gap           ║
║ hint hint    ║ Describes the type of problem                    ║
║ hint hint hint║ Names the component / pattern / technique       ║
╚══════════════╩══════════════════════════════════════════════════╝
```

---

## Key Files

```
╔══════════════════════════════════════════════════╦══════════════════════════════╗
║ File                                             ║ Purpose                      ║
╠══════════════════════════════════════════════════╬══════════════════════════════╣
║ CLAUDE.md                                        ║ Coach config (8-phase flow)  ║
║ PREP-PLAN.md                                     ║ This file                    ║
║ notes/REVIEW.md                                  ║ SRS index (all cards)        ║
║ notes/GRADUATED.md                               ║ Graduated designs            ║
║ notes/cheatsheets/cheatsheet-index.md            ║ Pattern keyword lookup       ║
║ notes/[system]/[system]-design.md                ║ Design cards (per system)    ║
║ notes/[system]/[system]-diagram.drawio           ║ Architecture diagram         ║
║ shared/templates/hld-design-card.md              ║ Card template                ║
║ .claude/commands/review-hld.md                   ║ /review-hld command          ║
║ .claude/skills/srs-revision-coach/SKILL.md       ║ SRS interval logic           ║
╚══════════════════════════════════════════════════╩══════════════════════════════╝
```

---

## SRS Stages

```
╔═══════╦══════════════╦═══════════════════════════════════════╗
║ Stage ║ Interval     ║ Review Mode                           ║
╠═══════╬══════════════╬═══════════════════════════════════════╣
║  1    ║ 1 day        ║ Full (redesign from scratch)          ║
║  2    ║ 3 days       ║ Snippet (sketch + 2 trade-offs)       ║
║  3    ║ 7 days       ║ Snippet                               ║
║  4    ║ 21 days      ║ Snippet                               ║
║  5    ║ 45 days      ║ Blitz (core insight one-liner)        ║
║  6    ║ 90 days      ║ Graduated                             ║
╚═══════╩══════════════╩═══════════════════════════════════════╝
```

Rating multipliers: Strong → stage up + ×1.5 · Okay → base · Weak → ÷2 · Blank → reset Stage 1

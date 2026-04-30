# HLD Design Card Template
# Location: shared/templates/hld-design-card.md
# Used by: hld-prep/CLAUDE.md (on solve) and hld-prep/.claude/commands/review.md (on review)
# Do NOT edit the SRS Tracking block structure — the review command reads these exact field names

---

# [System Name] — [Difficulty: Medium / Hard / Staff]
Problem: [one-line description of what needs to be built]
Designed Date: [YYYY-MM-DD]
Problem Tag: [e.g. feed-system / distributed-cache / rate-limiter / messaging-queue / search / url-shortener / cdn / storage / auth / notification / payment]

## SRS Tracking
- Stage: 1
- Review Date: [Designed Date + N days based on rating]
- Last Rating: —
- Review Count: 0
- Graduated: No

---

## Requirements

### Functional
1. ...
2. ...
3. ...
(4. ...)
(5. ...)

### Non-Functional
- Scale: [DAU / peak QPS / storage size]
- Latency SLA: [p99 read / write]
- Availability: [99.9% / 99.99%]
- Consistency: [strong / eventual — which operations need which]
- Durability: [data loss tolerance]

---

## Capacity Estimation

╔══════════════════════╦════════════════╦════════════════════════════════════════╗
║ Dimension            ║ Number         ║ How derived                            ║
╠══════════════════════╬════════════════╬════════════════════════════════════════╣
║ DAU                  ║                ║                                        ║
║ Writes/s (peak)      ║                ║                                        ║
║ Reads/s (peak)       ║                ║                                        ║
║ Storage (1 yr)       ║                ║                                        ║
║ Bandwidth (egress)   ║                ║                                        ║
╚══════════════════════╩════════════════╩════════════════════════════════════════╝

---

## API Design

### Core Endpoints
```
POST   /[resource]           → create
GET    /[resource]/{id}      → read
DELETE /[resource]/{id}      → delete
GET    /[resource]?cursor=&limit=  → list (paginated)
```

### Key Design Decisions
- Idempotency: [how writes are made idempotent]
- Auth: [token type / scope]
- Pagination: [cursor / offset / keyset]

---

## High-Level Architecture

### System Diagram (ASCII)
```
[Client]
   │
   ▼
[API Gateway / Load Balancer]
   │
   ├──────────────────┐
   ▼                  ▼
[Service A]       [Service B]
   │                  │
   ▼                  ▼
[Data Store]      [Cache / Queue]
```
(replace with actual component diagram)

### Component Responsibilities

╔══════════════════════════╦══════════════════════════════════════════════════╗
║ Component                ║ Role + Why this choice                           ║
╠══════════════════════════╬══════════════════════════════════════════════════╣
║ ...                      ║ ...                                              ║
╚══════════════════════════╩══════════════════════════════════════════════════╝

### Data Flow — Write Path
1. ...
2. ...
3. ...

### Data Flow — Read Path
1. ...
2. ...
3. ...

---

## Database Design

### Storage Choices

╔══════════════════╦══════════════════╦═════════════════════════════════════╗
║ Data type        ║ Storage choice   ║ Why                                 ║
╠══════════════════╬══════════════════╬═════════════════════════════════════╣
║ ...              ║ ...              ║ ...                                 ║
╚══════════════════╩══════════════════╩═════════════════════════════════════╝

### Hot-Path Schema
```sql
-- or NoSQL document/key structure
```

### Indexing Strategy
- Primary key: [field — why]
- Secondary indexes: [field — access pattern it serves]
- Sharding key: [field — why it avoids hotspots]

---

## Deep Dives

### Critical Component: [Name]

**The problem at scale:**
...

**Solution:**
...

**Failure mode:**
| Failure                  | Detection              | Mitigation                       |
|--------------------------|------------------------|----------------------------------|
| ...                      | ...                    | ...                              |

### Critical Component: [Name] (if applicable)

**The problem at scale:**
...

**Solution:**
...

---

## Trade-offs

╔══════════════════════════════╦═══════════════════════════╦════════════════════════════════╗
║ Decision Made                ║ What I gave up            ║ Why this side of the trade-off ║
╠══════════════════════════════╬═══════════════════════════╬════════════════════════════════╣
║ ...                          ║ ...                       ║ ...                            ║
╚══════════════════════════════╩═══════════════════════════╩════════════════════════════════╝

---

## Failure Modes Summary

╔═══════════════════════╦══════════════════════════╦══════════════════════════════════════╗
║ Component             ║ Failure mode             ║ Mitigation                           ║
╠═══════════════════════╬══════════════════════════╬══════════════════════════════════════╣
║ ...                   ║ ...                      ║ ...                                  ║
╚═══════════════════════╩══════════════════════════╩══════════════════════════════════════╝

---

## Core Insight
One sentence — the architectural "aha" that makes this design work at scale.

## Staff-Level Differentiator
What would a Staff answer add that a Senior answer misses for this specific system?

## Real-World Analogy
Any real-world analogy used to explain the hardest design decision.

## Watch Out For
- Gotcha 1 (e.g., hot key problem in cache)
- Gotcha 2 (e.g., fan-out on write vs read for feeds)
- Gotcha 3

## Evolution Path
How this design changes at 10x traffic / 2 years out.

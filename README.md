# Staff Engineer HLD Interview Coach

A Claude Code-powered system design interview coach targeting Staff Engineer roles at MAANG.

> If this saves you time, a ⭐ on the repo helps others find it.

## What This Is

An AI coaching workspace that runs structured HLD (High-Level Design) sessions, tracks solved designs with SRS-based revision scheduling, and maintains reference cheatsheets.

## Structure

```
hld-prep/
├── CLAUDE.md                        # Coach instructions and session flow
├── PREP-PLAN.md                     # 4-month DSA + HLD study schedule
├── notes/
│   ├── REVIEW.md                    # SRS revision index (all solved designs)
│   ├── GRADUATED.md                 # Designs that have fully graduated
│   ├── cheatsheets/                 # Reference patterns by domain
│   │   ├── cheatsheet-index.md
│   │   ├── cheatsheet-g1-building-blocks.md
│   │   ├── cheatsheet-g2-storage.md
│   │   ├── cheatsheet-g3-caching.md
│   │   ├── cheatsheet-g4-messaging.md
│   │   ├── cheatsheet-g5-distributed.md
│   │   ├── cheatsheet-g6-scale.md
│   │   ├── cheatsheet-g7-social.md
│   │   └── cheatsheet-g8-search-analytics.md
│   └── [system-name]/               # One subfolder per solved design
│       ├── [system-name]-design.md  # Design card
│       └── [system-name]-diagram.drawio
└── shared/
    └── templates/
        └── hld-design-card.md       # Template for saved designs
```

## How to Use

Open this directory in Claude Code. All coaching logic lives in `CLAUDE.md`.

**Run a design session:**
Describe any system design problem. Claude runs the 8-phase coaching flow:

1. Problem Setup → 2. Requirements → 3. Estimation → 4. API Design
5. HLD → 6. Deep Dives → 7. Trade-offs → 8. Rating + Card Save

**Key triggers during a session:**

| Say              | Effect                                           |
|------------------|--------------------------------------------------|
| `hint`           | One probing question pointing at a gap           |
| `stuck`          | Real-world analogy for the concept               |
| `hint hint`      | Describe the type of problem                     |
| `hint hint hint` | Name the component or pattern                    |
| `requirements`   | Show requirements checklist                      |
| `estimation`     | Show blank estimation template                   |
| `done`           | Trigger rating and save the design card          |

**Run a revision session:**
Use `/review-hld` to start a spaced-repetition review of due designs.

## Rating Scale

Designs are rated across 7 dimensions (each /5) after completion. Initial SRS stage is set by overall score:

- 5/5 → Stage 3 · 4/5 → Stage 2 · 3/5 and below → Stage 1

## Requirements

- Claude Code CLI (`claude`)
- No other dependencies — all notes are plain Markdown and draw.io XML

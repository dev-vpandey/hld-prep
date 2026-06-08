# Staff Engineer HLD Interview Coach

A Claude Code workspace that runs structured system design sessions and tracks solved designs with spaced-repetition review.

> If this saves you time, a ⭐ on the repo helps others find it.

## Requirements

- [Claude Code](https://claude.ai/code) CLI (`claude`)

## Setup

```bash
git clone <repo-url>
cd hld-prep
claude   # opens Claude Code in this directory
```

That's it. All coaching logic is in `CLAUDE.md` — Claude picks it up automatically.

## Usage

**Start a design session** — just describe a system design problem. Claude runs an 8-phase coaching flow (requirements → estimation → API → HLD → deep dives → trade-offs → rating → save).

**Key triggers during a session:**

╔══════════════════╦══════════════════════════════════════════════════╗
║ Say              ║ Effect                                           ║
╠══════════════════╬══════════════════════════════════════════════════╣
║ hint             ║ One probing question pointing at a gap           ║
║ stuck            ║ Real-world analogy for the concept               ║
║ hint hint        ║ Describe the type of problem                     ║
║ hint hint hint   ║ Name the component or pattern                    ║
║ requirements     ║ Show requirements checklist                      ║
║ estimation       ║ Show blank estimation template                   ║
║ done             ║ Trigger rating and save the design card          ║
╚══════════════════╩══════════════════════════════════════════════════╝

**Run a revision session** — `/start-hld` shows what's due, `/review-hld` runs the review.

## What Gets Saved

After `done`, Claude saves:
- Design card → `notes/[system-name]/[system-name]-design.md`
- Architecture diagram → `notes/[system-name]/[system-name]-diagram.drawio`
- Review index row → `notes/REVIEW.md`

## SRS Stages

Designs are rated across 7 dimensions (each /5) after completion. Stage is set by overall score:

- **5/5** → Stage 3 · **4/5** → Stage 2 · **≤3/5** → Stage 1

Review intervals: Stage 1 = 1 day · Stage 2 = 3 days · Stage 3 = 7 days → … → Stage 6 = graduated

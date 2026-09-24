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

## Live Notes Library

For readers and editors of the HLD notes. Requires Node.js 22+ and npm.

The [HTML library](notes/explanations/distributed-systems-foundations.html) is generated from Markdown files directly inside [explanations](notes/explanations) and [cheatsheets](notes/cheatsheets). Keep editing the Markdown, not the generated HTML.

### Quick Start

Run these commands from `hld-prep`:

```bash
npm ci
npm run watch
```

Open the localhost URL printed by the watcher, normally <http://127.0.0.1:4173/notes/explanations/distributed-systems-foundations.html>. If that port is occupied, it tries the next available port. The preview is bound to this machine only.

Save a Markdown file to rebuild the HTML, navigation, keyword links, and search. The preview reloads at the current reading position. Adding, renaming, or deleting Markdown files also rebuilds the guide; new explanations appear under **More explanations**.

### Automatic Startup

[The workspace task](.vscode/tasks.json) runs `npm run watch` when this workspace folder opens. After installing dependencies, allow the task if VS Code requests permission. If it does not start, run **Tasks: Manage Automatic Tasks in Folder**, allow automatic tasks, and reopen the workspace. It runs only while the VS Code task is alive; this is not a system-wide background service.

To start it manually in VS Code, run **Tasks: Run Task** and choose **HLD Notes: Watch and preview**. To stop it, terminate that task or press Ctrl+C in its terminal. The watcher must be running for saved edits to update the HTML.

### Build and Verify

```bash
npm run build   # Rebuild once, without a server
npm test        # Test saves, discovery, failures, diagram guards, and preview
```

The standalone HTML still opens offline without Node.js or a server, but a `file://` browser page cannot auto-reload. Use the localhost preview for live updates. Unsaved editor changes are not included, and nested Markdown folders are not scanned.

### Diagram Changes and Build Errors

The existing custom SVGs are matched to source-block fingerprints in [scripts/diagram-sources.json](scripts/diagram-sources.json). Inserting a block cannot accidentally select another diagram. If a mapped diagram changes, the build shows the current source with **SVG redraw pending** instead of reusing the old SVG. New ASCII diagrams are likewise flagged; this tool does not automatically draw new SVG artwork.

To refresh artwork, update its scene in [scripts/build.mjs](scripts/build.mjs), then update only that reviewed source block's SHA-256 fingerprint in the manifest. Do not regenerate all fingerprints merely to suppress warnings. The watcher also notices changes to the builder and manifest.

Failed builds keep the last successful HTML. The preview displays an error and the terminal logs the cause; fix it and save again to retry. If startup reports missing packages, run `npm ci`. If a newly installed Node.js is not found by the automatic task, restart VS Code.

## What Gets Saved

After `done`, Claude saves:
- Design card → `notes/[system-name]/[system-name]-design.md`
- Architecture diagram → `notes/[system-name]/[system-name]-diagram.drawio`
- Review index row → `notes/REVIEW.md`

## SRS Stages

Designs are rated across 7 dimensions (each /5) after completion. Stage is set by overall score:

- **5/5** → Stage 3 · **4/5** → Stage 2 · **≤3/5** → Stage 1

Review intervals: Stage 1 = 1 day · Stage 2 = 3 days · Stage 3 = 7 days → … → Stage 6 = graduated

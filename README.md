# Reading Feedback Across Styles on a Global Team

A self-contained micro-learning module built to the team's micro-learning standard, wired for both GitHub Copilot and Claude Code.

## What's in here

- `index.html`, `css/`, `js/`, `assets/` — the module itself: a standalone, statically hostable browser build.
- `docs/` — the instructional-design spec and the knowledge base behind the module.
- `.github/instructions/microlearning.instructions.md` — the enforceable standard, which GitHub Copilot reads automatically in this repo. **Generated — do not edit by hand.**
- `.github/standards.env`, `.github/standards.ref` — point at the canonical standards repo and pin its version.
- `.github/scripts/build-instructions.sh` — regenerates the instructions file from the pinned version.
- `CLAUDE.md` — points Claude Code at the same standard (via `@import`), so Claude Code follows it too, not just Copilot.
- `.github/workflows/standards-check.yml` — fails CI if the instructions file drifts from the pinned version.
- `.github/workflows/sync-standards.yml` — opens a PR to bump to the latest standard release.
- `.gitattributes` — keeps the scripts/config as LF so they run on the CI runners.

## Building on this module

The module's HTML/CSS/JS lives at the repo root. Copilot and Claude Code both hold the work to the standard above as you go. Before shipping, the standard's own review checklist (Part 3) is the definition of done.

## Updating the standard

You don't pull updates by hand. When a new standard release is cut, this repo's **sync** workflow opens a pull request — review and merge it. The **standards check** guarantees the instructions file is never hand-edited out of sync.

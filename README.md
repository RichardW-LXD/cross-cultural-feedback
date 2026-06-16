# Micro-learning module (template)

A starter for a single micro-learning module. Every repo created from this # Cross-cultural feedback module arrives already wired to the team standard — no setup required.

## What's in here

- `.github/instructions/microlearning.instructions.md` — the enforceable standard, which GitHub Copilot reads automatically in this repo. **Generated — do not edit by hand.**
- `.github/standards.env`, `.github/standards.ref` — point at the canonical standards repo and pin its version.
- `.github/scripts/build-instructions.sh` — regenerates the instructions file from the pinned version.
- `CLAUDE.md` — points Claude Code at the same standard (via `@import`), so Claude Code follows it too, not just Copilot.
- `.github/workflows/standards-check.yml` — fails CI if the instructions file drifts from the pinned version.
- `.github/workflows/sync-standards.yml` — opens a PR to bump to the latest standard release.
- `.gitattributes` — keeps the scripts/config as LF so they run on the CI runners.

## Building your module

Add your module's HTML/CSS/JS. Copilot and Claude Code both hold the work to the standard above as you go. Before shipping, the standard's own review checklist (Part 3) is the definition of done.

## Updating the standard

You don't pull updates by hand. When a new standard release is cut, this repo's **sync** workflow opens a pull request — review and merge it. The **standards check** guarantees the instructions file is never hand-edited out of sync.

---

Created with `new-module.ps1` (see the standards repo / handoff notes), which also enables the one repo setting templates can't carry.

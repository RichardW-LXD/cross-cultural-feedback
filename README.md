# Reading Feedback Across Styles on a Global Team

A self-contained micro-learning module built to the team's micro-learning standard, wired for both GitHub Copilot and Claude Code.

## What's in here

- `index.html`, `css/`, `js/`, `assets/` — the module itself: a standalone, statically hostable browser build.
- `js/coach.js` + `api/feedback.js` — an **optional** AI-coaching layer (see below). The module is fully usable without it.
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

## Optional: AI coaching backend

When a learner highlights a cue-phrase and writes their reasoning, the module asks an AI coach to give
specific feedback. That call goes through a small serverless function so your Anthropic API key stays on
the server, never in the page. **This is a progressive enhancement** — if the function isn't deployed, is
offline, or the page is opened from a file, the module falls back to built-in static feedback and still
works end-to-end (standard rule B-35).

To enable it:

1. Install the SDK the function uses: `npm install @anthropic-ai/sdk` (creates/updates `package.json`).
2. Set environment variables (see `.env.example`): `ANTHROPIC_API_KEY`, and `ALLOWED_ORIGIN` (your site's origin) for CORS.
3. Deploy `api/feedback.js` as a serverless function alongside the static page. It's written in the
   Vercel/Next.js `(req, res)` style; `api/feedback.js` has inline notes for adapting to Netlify Functions
   or Cloudflare Workers. The page calls the endpoint set in `index.html` → `window.MODULE_CONFIG.feedbackEndpoint`
   (default `/api/feedback`); change it there if your function lives elsewhere.

The function uses Claude Sonnet 4.6, sends only the learner's comment in the POST body (never in a URL),
and does not log or store comments.

## Updating the standard

You don't pull updates by hand. When a new standard release is cut, this repo's **sync** workflow opens a pull request — review and merge it. The **standards check** guarantees the instructions file is never hand-edited out of sync.

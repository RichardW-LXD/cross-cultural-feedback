---
applyTo: "**"
---

<!-- GENERATED FILE — DO NOT EDIT.
     Synced from RichardW-LXD/microlearning-standards@v1.1.0 by .github/scripts/build-instructions.sh.
     Change the source in that repo and cut a new release; do not edit here. -->

# Micro-Learning Standard — Design & Browser Build

**Status: ENFORCEABLE STANDARD.** This is not advisory guidance. An AI assistant reading this file MUST treat its rules as constraints on any work it generates, reviews, or refactors in this domain.

**Version: 1.1** — adds a machine-readable module metadata block (§1.0), an interaction & engagement section grounded in ICAP (§1.8), and concrete standalone-hosting and client-side persistence rules (§2.3, §2.8).

**Scope.** Self-contained micro-learning modules — short, single-objective learning units — that are **designed** to teach effectively *and* **built** as standalone web pages (HTML/CSS/JS) hosted at a stable URL and linked from the author's website, responsive across viewports, delivered online. Part 1 governs the learning design and content. Part 2 governs the browser implementation. Part 3 verifies both. These modules also serve as **client-facing demonstrations**, so production quality is part of the spec (§1.8).

**Out of scope.** Full courses or curricula, multi-module sequencing strategy (beyond the spacing hooks noted), authoring-tool–specific packaging (Storyline/Rise/SCORM), native apps, and instructor-led material. Where a rule could apply to those, adapt it deliberately rather than assuming it transfers.

---

## How to use this file at the start of a task

1. **Read the whole file before producing anything.** Do not generate, review, or refactor a module until you have loaded every rule.
2. **Rule strength is binding:**
   - **MUST / MUST NOT** — blocking. Output that violates one is non-conforming and must not be delivered. If a MUST is genuinely impossible in the target context, stop and say so explicitly rather than working around it.
   - **SHOULD / SHOULD NOT** — strong default. Deviating is allowed only with a stated, specific justification recorded in the work.
3. **When generating:** emit the §1.0 metadata block first, then satisfy Part 1 and Part 2, then self-run Part 3 before declaring the work done.
4. **When reviewing or refactoring:** parse the §1.0 metadata block and confirm it matches the module (M-2); then cite the specific rule ID (e.g., `D-3`, `B-12`, `M-2`) for every issue you raise, and report against the Part 3 checklist so "done" is verifiable, not subjective.
5. **House-style items** are marked `🏠 HOUSE-STYLE — confirm`. These are choices, not findings. Do not present them to the end user as research-derived, and flag any that have not been confirmed.
6. **Traceability.** Each design section lists its grounding frameworks; each accessibility rule cites its WCAG success criterion. Full references are at the end. Do not invent citations, effect sizes, or page numbers beyond what is stated here.

**Legend.** `M-#` = machine-readable metadata rule. `D-#` = design/content rule. `B-#` = build/implementation rule. `[WCAG x.x.x]` = a specific Web Content Accessibility Guidelines 2.2 success criterion. `🏠` = house-style choice requiring confirmation. Framework names in *Grounding* lines map to the References section.

---

# Part 1 — Design & Content Spec (what the deliverable must be)

These rules govern the learning design regardless of how the module is built. They are grounded in established learning science; where a number is a house choice it is flagged.

## §1.0 Module metadata (machine-readable)

*Purpose: a fixed, parseable contract at the top of every module so a tool — or this standard's reviewer — can validate conformance automatically, and so each module is self-describing.*

- **M-1 (MUST):** Every module MUST embed a machine-readable metadata block as a non-rendering, parseable element at the top of the document. Canonical form for an HTML module is a single `<script type="application/json" id="module-metadata">…</script>` placed in the `<head>` or as the first child of `<body>`. (For modules authored in Markdown that compile to HTML, equivalent YAML front matter carrying the same fields is acceptable.)
- **M-2 (MUST):** The metadata MUST accurately describe the built module. In particular: `bloomLevel` MUST match the verb/level of the objective (D-2); `practiceItemCount` MUST equal the actual number of practice items; `interactionTypes` MUST list the interaction patterns actually present (§1.8); and `passCriterion` MUST match the implemented scoring (D-33). Any mismatch between metadata and module is a conformance failure.
- **M-3 (SHOULD):** The block SHOULD validate against the shared schema below so tools can check it programmatically. Unknown extra fields are permitted; the required fields MUST be present and correctly typed.

**Required fields**

| Field | Type | Notes |
|---|---|---|
| `standard` | string | Version of this standard the module targets, e.g. `microlearning-standard@1.1` |
| `id` | string | Stable, kebab-case identifier |
| `title` | string | Human-readable module title |
| `objective` | string | The single measurable objective (D-1, D-2, D-3) |
| `bloomLevel` | string | One of: `remember` `understand` `apply` `analyze` `evaluate` `create` |
| `estimatedMinutes` | number | Target completion time |
| `interactionTypes` | string[] | Interaction patterns actually used (§1.8) |
| `practiceItemCount` | integer | Actual number of practice items (≥ 1) |
| `passCriterion` | string | Criterion-referenced pass condition (D-33) |
| `version` | string | Module version (semver) |

**Optional fields:** `prerequisites` (string[]), `lang` (BCP-47 string, e.g. `en`).

**Example**

```json
{
  "standard": "microlearning-standard@1.1",
  "id": "network-tokenization-card-on-file-01",
  "title": "How Network Tokenization Protects a Card-on-File Payment",
  "objective": "Given a card-on-file checkout scenario, decide which token protects the transaction and justify the choice, with all decisions correct.",
  "bloomLevel": "apply",
  "estimatedMinutes": 5,
  "interactionTypes": ["branching-scenario", "predict-then-check"],
  "practiceItemCount": 3,
  "passCriterion": "All 3 scenario decisions correct",
  "prerequisites": ["What a PAN is"],
  "lang": "en",
  "version": "1.0.0"
}
```

**Minimal validation schema (JSON Schema, draft 2020-12)**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "microlearning-module-metadata",
  "type": "object",
  "required": ["standard","id","title","objective","bloomLevel","estimatedMinutes","interactionTypes","practiceItemCount","passCriterion","version"],
  "properties": {
    "standard": { "type": "string" },
    "id": { "type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" },
    "title": { "type": "string", "minLength": 1 },
    "objective": { "type": "string", "minLength": 1 },
    "bloomLevel": { "type": "string", "enum": ["remember","understand","apply","analyze","evaluate","create"] },
    "estimatedMinutes": { "type": "number", "exclusiveMinimum": 0 },
    "interactionTypes": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
    "practiceItemCount": { "type": "integer", "minimum": 1 },
    "passCriterion": { "type": "string", "minLength": 1 },
    "version": { "type": "string" },
    "prerequisites": { "type": "array", "items": { "type": "string" } },
    "lang": { "type": "string" }
  }
}
```

## §1.1 Objective & scope

*Grounding: Mager (instructional objectives); Anderson & Krathwohl, revised Bloom's taxonomy.*

- **D-1 (MUST):** Each module MUST address exactly one primary learning objective. One module = one objective.
- **D-2 (MUST):** The objective MUST be written as an observable, measurable performance — what the learner will be able to *do* — using an action verb mapped to a single cognitive level of the revised Bloom's taxonomy (Remember, Understand, Apply, Analyze, Evaluate, Create). It MUST NOT be phrased as a coverage statement ("this module covers…") or an internal state ("understand/know/appreciate") with no observable behavior.
- **D-3 (SHOULD):** The objective SHOULD specify the conditions of performance and the criterion for success (the performance/condition/criterion structure), so it is checkable rather than aspirational.
- **D-4 (MUST):** The objective MUST be stated to the learner near the start of the module (see D-18).
- **D-5 (MUST NOT):** A module MUST NOT introduce content that does not serve its single objective. Surplus content is moved to another module or cut.
- **D-6 (🏠 HOUSE-STYLE — confirm):** Target completion time is **3–7 minutes**. *This is a house choice, not a research-derived threshold; confirm or replace.*

## §1.2 Cognitive load management

*Grounding: Sweller, Cognitive Load Theory (intrinsic / extraneous / germane load; in current CLT, germane load is reframed as resources devoted to intrinsic load rather than an independent third type — the practical mandate below is unaffected); Mayer (coherence, signaling, segmenting, pre-training).*

- **D-7 (MUST):** Extraneous load MUST be minimized. Remove decorative media, off-topic anecdotes, background audio, and any element that does not support the objective (coherence principle).
- **D-8 (MUST):** Content MUST be segmented into discrete, learner-paced chunks rather than presented as one continuous block (segmenting principle). The learner controls advancement; the module MUST NOT force-advance through substantive content on a timer.
- **D-9 (SHOULD):** A single screen/step SHOULD present one idea. If a screen carries multiple distinct ideas, split it.
- **D-10 (MUST):** Essential structure MUST be cued (signaling) — headings, emphasis, and ordering that make the organization visible. Signaling MUST NOT be achieved by visual noise (e.g., highlighting everything).
- **D-11 (SHOULD):** Key terms, names, and prerequisite concepts SHOULD be introduced before the segment that depends on them (pre-training principle), especially for novice audiences.
- **D-12 (SHOULD):** Intrinsic load SHOULD be managed for the intended prior-knowledge level — sequence simpler-to-complex and do not assume expertise the audience lacks.
- **D-13 (🏠 HOUSE-STYLE — confirm):** Cap substantive on-screen text at roughly **one short paragraph (~50 words) per step**. *House choice; confirm or replace.*

## §1.3 Multimedia & media pairing

*Grounding: Mayer, Cognitive Theory of Multimedia Learning; Paivio, dual coding.*

- **D-14 (SHOULD):** Where a concept is spatial, procedural, or structural, it SHOULD pair words with a relevant graphic rather than words alone (multimedia principle). Visuals MUST be instructionally relevant, not ornamental.
- **D-15 (SHOULD NOT):** When narration accompanies a graphic or animation, the module SHOULD NOT simultaneously display the full narration text on screen (redundancy principle). Brief on-screen labels or key terms next to the relevant part of the graphic are acceptable.
- **D-16 (SHOULD):** When using graphics with explanatory words, prefer spoken narration over on-screen prose for the explanatory channel (modality principle) — provided accessibility equivalents from Part 2 are present (captions/transcript; see B-7).
- **D-17 (MUST):** Related words and visuals MUST be placed together — adjacent in space, and synchronized in time for narrated visuals (spatial and temporal contiguity). Corresponding label and image MUST NOT be separated onto different screens or far apart.

## §1.4 Structure & sequence

*Grounding: Gagné, events of instruction (adapted to micro scale).*

- **D-18 (MUST):** Every module MUST, at minimum: (a) gain attention / establish relevance, (b) state the objective, (c) present the content, (d) provide at least one opportunity to practice or apply, (e) give feedback on that practice, and (f) close with a retention or transfer cue (summary, job aid, or next-step prompt).
- **D-19 (SHOULD):** Where the learner plausibly has relevant prior knowledge, the module SHOULD activate it before presenting new content (recall of prior learning).
- **D-20 (SHOULD NOT):** A module SHOULD NOT be pure exposition. Content-only modules with no retrieval or application violate the practice requirement in §1.5.

## §1.5 Retrieval, practice & feedback

*Grounding: Roediger & Karpicke, retrieval/testing effect; Cepeda et al., distributed practice / spacing; Bjork, desirable difficulties; Ebbinghaus, forgetting curve. (How practice is realized as engaging interaction is governed by §1.8.)*

- **D-21 (MUST):** Each module MUST include at least one active retrieval or application task — the learner must produce or do something from memory, not merely recognize that they read it. Passive "click next to continue" is not retrieval.
- **D-22 (MUST):** Practice tasks MUST be aligned to the objective's cognitive level (D-2). A module whose objective is *Apply* MUST NOT assess only *Remember*.
- **D-23 (MUST):** Every practice attempt MUST receive feedback. Feedback MUST explain *why* an answer is correct or incorrect, not only mark right/wrong.
- **D-24 (SHOULD):** Practice difficulty SHOULD be calibrated as a *desirable* difficulty — effortful but achievable for the intended learner — rather than trivially easy or unfairly hard.
- **D-25 (SHOULD):** If the module is one of a related series, it SHOULD support spaced revisiting (e.g., a brief retrieval check that recalls prior modules, or a design hook that allows scheduled review). Spacing schedule itself is out of scope here.
- **D-26 (🏠 HOUSE-STYLE — confirm):** Include **2–4 practice items** per module. *House choice; confirm or replace.*

## §1.6 Language & writing

*Grounding: Mayer (personalization principle); Mager (criterion clarity).*

- **D-27 (MUST):** Instructional copy MUST use plain, direct language and active voice. Avoid unexplained jargon; define a term on first use or pre-train it (D-11).
- **D-28 (SHOULD):** Instructional copy SHOULD address the learner directly in a conversational register (personalization principle) rather than impersonal third person.
- **D-29 (MUST):** Terminology, labels, and capitalization MUST be consistent throughout a module (e.g., one canonical name per concept).
- **D-30 (MUST):** Headings and step titles MUST be meaningful and descriptive of their content (this also supports B-2/B-6).
- **D-31 (🏠 HOUSE-STYLE — confirm):** Target reading level is **plain-language / approximately grade 8**. *House choice; confirm or replace, especially for a multilingual or specialist audience.*

## §1.7 Assessment alignment

*Grounding: Biggs, constructive alignment; Mager, criterion-referenced objectives; Anderson & Krathwohl.*

- **D-32 (MUST):** Any assessment or check MUST be aligned to the stated objective and its cognitive level (constructive alignment). Objective, content, practice, and assessment MUST all target the same performance.
- **D-33 (MUST):** Scoring MUST be criterion-referenced against the objective's success criterion (D-3), not norm-referenced or arbitrary.
- **D-34 (SHOULD NOT):** Assessment items SHOULD NOT test incidental detail (font of a heading, an aside) instead of the objective.

## §1.8 Interaction & engagement

*Grounding: Chi & Wylie, ICAP framework (cognitive engagement increases Passive → Active → Constructive → Interactive); Mayer (generative-processing principles; coherence); Sweller (extraneous-load guardrail). Because these modules also serve as client-facing demonstrations, production quality is treated as part of the spec.*

> **ICAP in one line, applied here.** *Passive* = read/watch; *Active* = manipulate/select; *Constructive* = generate something new (a reasoned decision, an explanation, an arrangement, a prediction); *Interactive* = two-way adaptive exchange that responds to the learner (adaptive dialogue or responsive branching). Learning rises up the modes — so the standard requires at least Constructive, and prizes Interactive.

- **D-35 (MUST):** Each module MUST move the learner past passive consumption and past mere recognition (selecting or revealing). At least one core task MUST be **Constructive** — the learner generates or externalizes something (a decision with reasoning, a constructed artifact, a prediction, an explanation, an arrangement). An **Interactive** task (adaptive dialogue or branching that reacts to the learner's input) SHOULD be used where feasible.
- **D-36 (SHOULD):** Interaction types SHOULD be varied and selected to fit the objective's cognitive level (D-2). Suitable richer patterns include, but are not limited to: branching scenario / decision simulation; an interactive diagram or model the learner manipulates; sequencing or prioritization with visible consequences; "build/assemble" construction tasks; predict-then-check; sorting evidence into a conceptual model; a guided sandbox or simulation; and role-play or conversational practice.
- **D-37 (SHOULD NOT):** A module SHOULD NOT rely on bare multiple-choice, simple drag-and-drop, or flip-to-reveal as its primary interaction. These patterns are permitted only when **elevated** — set in a meaningful scenario, carrying real consequence, and paired with explanatory feedback (D-23) — never as low-effort filler.
- **D-38 (MUST):** Engagement devices MUST serve the objective. Novelty, animation, gamification, or spectacle that increases extraneous load without advancing the objective is prohibited (coherence principle; cognitive load). When fun and learning compete, learning wins.
- **D-39 (MUST):** Every interaction, however creative, MUST conform to Part 2 — keyboard operable (B-2), a non-dragging single-pointer alternative for any drag interaction (B-9), adequate target size (B-8), and reduced-motion respected (B-12) — and MUST degrade gracefully if scripting or media fail (B-32, B-33). An interaction that cannot be made accessible MUST be redesigned, not shipped.
- **D-40 (SHOULD):** Feedback SHOULD be immediate, specific, and woven into the interaction (e.g., the consequence of a choice shown within the scenario) rather than a generic right/wrong popup (extends D-23).
- **D-41 (MUST):** At delivery, a module MUST NOT contain placeholder or lorem-ipsum content, broken or empty states, or an unstyled default-template appearance.
- **D-42 (SHOULD):** A module SHOULD demonstrate deliberate craft suitable for a client showcase: purposeful motion and micro-interactions, consistent and intentional visual design, and a coherent voice. *Note: "polished enough to impress a client" is partly a judgment call — see the review note accompanying this standard.*

---

# Part 2 — Implementation Spec (how it's built: browser / HTML / CSS / JS)

These rules govern the browser build. The target is the open web platform; they are written framework-neutral. Where a rule necessarily touches a mechanism (notably persistence), the **principle** is stated generically so the module can be re-hosted later without rewriting learning logic.

## §2.1 Accessibility — conform to WCAG 2.2 Level AA

The module MUST conform to **WCAG 2.2 Level AA** (W3C Recommendation, October 2023). The following are the load-bearing criteria for interactive micro-learning; they are a floor, not the full standard.

- **B-1 (MUST):** Use semantic HTML for structure and controls — real `button`, `a`, `input`, `label`, headings, landmarks. Custom widgets MUST expose correct name, role, and value/state to assistive technology [WCAG 4.1.2].
- **B-2 (MUST):** All functionality MUST be operable by keyboard alone, with no keyboard trap [WCAG 2.1.1, 2.1.2]. Tab order MUST follow a logical reading/operation order.
- **B-3 (MUST):** A visible keyboard focus indicator MUST be present on every interactive element [WCAG 2.4.7], and the focused element MUST NOT be entirely hidden by other content such as sticky bars or overlays [WCAG 2.4.11].
- **B-4 (MUST):** Text contrast MUST be at least **4.5:1**, or **3:1** for large text (≥ 24px, or ≥ 18.66px bold) [WCAG 1.4.3]. Non-text UI components and meaningful graphical objects MUST meet **3:1** against adjacent colors [WCAG 1.4.11].
- **B-5 (MUST):** Color MUST NOT be the sole means of conveying information, indicating an action, or distinguishing a correct/incorrect answer [WCAG 1.4.1]. Pair color with text, icon, or pattern.
- **B-6 (MUST):** Every non-text element that conveys meaning MUST have a text alternative; purely decorative images MUST be marked so assistive tech ignores them [WCAG 1.1.1].
- **B-7 (MUST):** Prerecorded video with audio MUST have captions [WCAG 1.2.2], and audio/video MUST provide an equivalent alternative — a transcript and, where visual information is essential, audio description [WCAG 1.2.x]. This is the accessibility counterpart to the narration-first design choice D-16.
- **B-8 (MUST):** Pointer target size MUST be at least **24 × 24 CSS pixels** (or meet a spacing/equivalent exception) [WCAG 2.5.8].
- **B-9 (MUST):** Any function using a dragging movement MUST have a single-pointer (e.g., tap/click) alternative [WCAG 2.5.7]. (This applies directly to creative drag-based exercises under §1.8.)
- **B-10 (MUST):** Form and answer controls MUST have programmatically associated labels and instructions; errors MUST be identified in text and described, not signaled by color or position alone [WCAG 1.3.1, 3.3.1, 3.3.2].
- **B-11 (MUST):** Content MUST remain readable and operable with text resized to 200% [WCAG 1.4.4] and with user text-spacing overrides applied [WCAG 1.4.12], without loss of content or function.
- **B-12 (SHOULD):** Honor the user's reduced-motion preference (`prefers-reduced-motion`): non-essential animation SHOULD be reduced or removed, and any moving/auto-updating content lasting more than ~5 seconds MUST be pausable/stoppable [WCAG 2.2.2].
- **B-13 (SHOULD):** Set the document language and any in-content language changes programmatically [WCAG 3.1.1, 3.1.2].

## §2.2 Responsiveness & layout

*Anchored to a real WCAG criterion (Reflow); breakpoint/width specifics are house-style.*

- **B-14 (MUST):** Content MUST reflow to a viewport of **320 CSS px** width without requiring two-dimensional (horizontal) scrolling [WCAG 1.4.10]. No fixed-width layouts that overflow small screens.
- **B-15 (MUST):** The module MUST be fully usable in both portrait and landscape; orientation MUST NOT be locked unless essential [WCAG 1.3.4].
- **B-16 (MUST):** Layout MUST adapt fluidly across the supported viewport range — phone browser through desktop browser — with legible type and no clipped or overlapping interactive elements at any supported width.
- **B-17 (SHOULD):** Use relative/fluid units and flexible layout primitives; SHOULD NOT pin critical dimensions in absolute pixels where a relative unit would adapt.
- **B-18 (🏠 HOUSE-STYLE — confirm):** Comfortable touch target ≥ **44 × 44 CSS px** (stronger than the WCAG 2.5.8 floor of 24 px), and a maximum readable text-column measure of ~**70 characters**. *These are house choices above the standard's minimum; confirm or replace.*

## §2.3 State & progress persistence

> **Deployment context (now fixed).** These modules are standalone, statically hostable web pages reached by a stable URL and linked from the author's website (see §2.8). There is no LMS or server runtime in the default deployment, so progress persistence — where used — is **client-side** (browser web storage). The rules below state the principle so the module could later be re-hosted (e.g., inside an LMS using its own bookmarking) without rewriting learning logic.

- **B-19 (SHOULD):** A module longer than a single screen SHOULD let the learner resume where they left off — persisting current position and practice completion — using client-side browser storage.
- **B-20 (MUST):** Persistence MUST degrade gracefully. If storage is unavailable, blocked (e.g., private-browsing or embedded sandbox), or cleared, the module MUST still function as a fresh, completable session and MUST NOT error out or trap the learner.
- **B-21 (MUST):** State logic MUST be isolated behind a small, swappable interface (e.g., `saveProgress` / `loadProgress`) so the storage mechanism can be replaced — browser storage today, an LMS or back-end later — without touching learning logic. The module MUST NOT scatter direct calls to a specific storage API throughout the codebase.
- **B-22 (MUST NOT):** The module MUST NOT persist personal or sensitive data client-side merely to track progress (see §2.7).

## §2.4 Reusability & maintainability

- **B-23 (MUST):** Content MUST be separated from presentation and logic. Instructional text, questions, answers, and feedback MUST live as structured data/content, not be hard-coded inline within behavioral logic.
- **B-24 (SHOULD):** The module SHOULD be built from a reusable, parameterized template/component pattern (e.g., a configurable scenario or practice-item component) so new modules can be produced by supplying content, not by rewriting code.
- **B-25 (MUST):** Naming of files, components, and content keys MUST be consistent and descriptive. No duplicated copies of the same logic that must be kept in sync by hand.
- **B-26 (SHOULD):** Configuration (objective metadata, item set, pass criterion) SHOULD be declared in one clearly identified place and documented, so a non-author can see how to adapt the module. The §1.0 metadata block satisfies part of this.
- **B-27 (SHOULD):** Code SHOULD include brief comments only where intent is non-obvious; it SHOULD NOT carry dead code, commented-out blocks, or unused assets.

## §2.5 Performance & assets

- **B-28 (MUST):** The module MUST remain usable on a constrained connection — core content and the first interaction MUST be reachable without waiting on large media.
- **B-29 (SHOULD):** Heavy media (images, audio, video) SHOULD be optimized and compressed for web delivery, and non-critical/below-the-fold media SHOULD be loaded lazily.
- **B-30 (MUST):** Media MUST declare intrinsic dimensions or reserved space to avoid layout shift while loading.
- **B-31 (🏠 HOUSE-STYLE — confirm):** Initial load budget ≈ **1.5 MB** transferred before first interaction; total module weight ≈ **5 MB**. *House choices; confirm or replace against the audience's real bandwidth.*

## §2.6 Robustness & graceful degradation

- **B-32 (MUST):** Core instructional content (objective, text, and a readable path through the material) MUST be available even if enhancement scripts fail to load — progressive enhancement, not script-dependence for reading the content.
- **B-33 (MUST):** Interactive failures MUST be handled — invalid input, missing media, or a failed save MUST produce a clear, accessible message and a way forward, never a silent dead end or an unhandled console error.
- **B-34 (MUST):** The module MUST run without console errors in current versions of the major evergreen browsers it targets.
- **B-35 (SHOULD):** The module SHOULD NOT depend on a network call to a third-party service at runtime to deliver core content. Any adaptive/AI-driven interaction (e.g., to reach the ICAP *Interactive* tier) MUST be layered as a progressive enhancement over a working static core (B-32) and handled per B-33 if its endpoint is unavailable.

## §2.7 Data & privacy

- **B-36 (MUST NOT):** The module MUST NOT collect personally identifiable information beyond what the experience genuinely requires and the user expects.
- **B-37 (MUST NOT):** The module MUST NOT embed third-party trackers or advertising. Only first-party, privacy-respecting analytics that the author sanctions are permitted.
- **B-38 (MUST):** If the module reports any learner data (e.g., to first-party analytics or a results endpoint), it MUST send that data only to the sanctioned endpoint over a secure connection, and MUST NOT place it in URLs/query strings or otherwise expose it client-side.

## §2.8 Packaging, hosting & linking

*The deployment target: a standalone module hosted at a stable URL and linked from the author's website, and presentable to clients.*

- **B-39 (MUST):** The module MUST be self-contained and deployable as static web assets (HTML/CSS/JS plus media) with **no required server-side runtime** to deliver and run its core content, so it can be placed on static hosting and linked.
- **B-40 (MUST):** The module MUST be reachable at a stable, linkable URL and MUST render and function correctly when opened directly at that URL — it MUST NOT depend on being embedded inside a specific parent page or app shell to work.
- **B-41 (SHOULD):** The module SHOULD work both as a full-page link and embedded within an `iframe`/container on the website, responsive within its container. When embedded, it MUST still meet keyboard and focus rules (B-2, B-3) and reflow (B-14).
- **B-42 (MUST):** Asset references MUST be relative (or resolve to a configurable base), so the module runs regardless of the host path it is deployed to. No hard-coded `localhost` or environment-specific absolute URLs.
- **B-43 (SHOULD):** The module SHOULD set a descriptive page `<title>` and basic link-preview metadata (Open Graph / Twitter Card) so a link shared with a client previews professionally.
- **B-44 (MUST):** The module MUST NOT load mixed/insecure content; all subresources MUST load over HTTPS so it works when embedded on or linked from a secure (https) site.

---

# Part 3 — Review Checklist (run before "done")

Each item is a binary check. A module is **conforming** only when every MUST-derived item is ✅. Cite the rule ID on any ❌. SHOULD-derived items that are ❌ require a recorded justification.

### Metadata
- [ ] Machine-readable metadata block present and parseable at top of document (M-1)
- [ ] Metadata accurately matches the built module — `bloomLevel`↔objective, `practiceItemCount`, `interactionTypes`, `passCriterion` (M-2)
- [ ] Block validates against the shared schema (M-3)

### Design — objective & load
- [ ] Exactly one primary objective, observable and measurable, mapped to one Bloom level (D-1, D-2)
- [ ] Objective stated to the learner early (D-4, D-18b)
- [ ] No content present that doesn't serve the objective (D-5, D-7)
- [ ] Content segmented into learner-paced chunks; no forced timed advance (D-8)
- [ ] Essential structure is signaled without visual noise (D-10)
- [ ] Prerequisite terms pre-trained where needed (D-11)
- [ ] 🏠 Completion time within confirmed target (D-6) · 🏠 per-step text within confirmed cap (D-13)

### Design — media
- [ ] Visuals are instructionally relevant, not decorative (D-14)
- [ ] No full narration text duplicated on screen alongside narration (D-15)
- [ ] Related words and visuals are adjacent / synchronized (D-17)

### Design — structure, practice, language
- [ ] All six structural elements present: attention, objective, content, practice, feedback, retention cue (D-18)
- [ ] ≥ 1 active retrieval/application task; not click-through only (D-21, D-20)
- [ ] Practice matches the objective's cognitive level (D-22)
- [ ] Every attempt gets explanatory feedback (D-23)
- [ ] Plain language, active voice, consistent terminology, meaningful headings (D-27, D-29, D-30)
- [ ] 🏠 Practice item count within confirmed range (D-26) · 🏠 reading level within confirmed target (D-31)

### Design — alignment
- [ ] Objective, content, practice, and assessment all target the same performance (D-32)
- [ ] Scoring is criterion-referenced to the success criterion (D-33)

### Design — interaction & engagement
- [ ] ≥ 1 Constructive (generative) task; not selection/reveal only; Interactive used where feasible (D-35)
- [ ] Interaction types varied and fit the objective's level (D-36)
- [ ] No bare MCQ / drag-drop / flip-to-reveal as primary; any such use is elevated with scenario + consequence + feedback (D-37)
- [ ] Every engagement device serves the objective; no load-adding spectacle (D-38)
- [ ] Every interaction keyboard-operable, has a single-pointer drag alternative, adequate targets, reduced-motion, graceful degradation (D-39)
- [ ] Feedback immediate, specific, woven into the interaction (D-40)
- [ ] No placeholder/lorem content, broken states, or unstyled default-template look at delivery (D-41)
- [ ] Demo-grade craft: purposeful motion, consistent intentional design (D-42)

### Build — accessibility (WCAG 2.2 AA floor)
- [ ] Semantic HTML; custom controls expose name/role/value (B-1)
- [ ] Full keyboard operability, no trap, logical order (B-2)
- [ ] Visible focus, not obscured by overlays/sticky UI (B-3)
- [ ] Text contrast ≥ 4.5:1 (3:1 large); UI/graphics ≥ 3:1 (B-4)
- [ ] Information never by color alone, including answer correctness (B-5)
- [ ] Text alternatives for meaningful non-text; decorative marked as such (B-6)
- [ ] Captions + transcript/description for audio-video (B-7)
- [ ] Pointer targets ≥ 24×24 px (B-8); dragging has a single-pointer alternative (B-9)
- [ ] Labeled inputs; errors described in text (B-10)
- [ ] Usable at 200% text zoom and with text-spacing overrides (B-11)
- [ ] Reduced-motion honored; long-running motion is pausable (B-12)
- [ ] Document/content language set programmatically (B-13)

### Build — responsiveness
- [ ] Reflows at 320px width with no horizontal scroll (B-14)
- [ ] Works in portrait and landscape; orientation not locked (B-15)
- [ ] Fluid across phone→desktop widths; nothing clipped/overlapping (B-16)
- [ ] 🏠 Comfortable target size / column measure within confirmed values (B-18)

### Build — state, reuse, performance, robustness, privacy
- [ ] Resume works where applicable via client-side storage (B-19)
- [ ] Functions correctly when storage is unavailable/cleared (B-20)
- [ ] Storage isolated behind a swappable interface; no scattered storage calls (B-21)
- [ ] Content separated from logic as structured data (B-23)
- [ ] Reusable/parameterized template; consistent naming; documented config (B-24, B-25, B-26)
- [ ] Core content reachable on a constrained connection (B-28); media optimized + lazy where non-critical (B-29); no layout shift on load (B-30)
- [ ] 🏠 Load/total weight within confirmed budget (B-31)
- [ ] Core content readable if enhancement scripts fail (B-32); interactive failures handled accessibly (B-33); no console errors in target browsers (B-34); any AI/adaptive layer is enhancement-only (B-35)
- [ ] No third-party trackers; learner data only to a sanctioned endpoint over HTTPS, never in URLs (B-36, B-37, B-38)

### Build — packaging, hosting & linking
- [ ] Self-contained static deploy; no server runtime for core content (B-39); renders and functions when opened directly at its URL (B-40)
- [ ] Relative/configurable asset paths; no localhost or environment-specific absolute URLs (B-42)
- [ ] No mixed content; all subresources load over HTTPS (B-44)
- [ ] Works as a full-page link and embedded in an iframe without breaking; iframed version keeps keyboard/focus/reflow (B-41)
- [ ] Descriptive page title + link-preview metadata for sharing (B-43)

---

# References

Frameworks this standard rests on, listed at the work level for traceability. No page numbers or effect sizes are asserted beyond what is named here.

**Learning design**
- Mager, R. F. *Preparing Instructional Objectives.* — measurable performance objectives (performance / condition / criterion).
- Anderson, L. W., & Krathwohl, D. R. (Eds.). (2001). *A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives.* New York: Longman. — Remember / Understand / Apply / Analyze / Evaluate / Create; knowledge dimension. (Original: Bloom et al., 1956.)
- Gagné, R. M. *The Conditions of Learning*; Gagné, Briggs, & Wager, *Principles of Instructional Design.* — events of instruction.
- Biggs, J. (1996). Enhancing teaching through constructive alignment. *Higher Education*; Biggs & Tang, *Teaching for Quality Learning at University.* — constructive alignment of objective, activity, and assessment.

**Cognitive science of learning**
- Sweller, J. (1988) and Sweller, van Merriënboer, & Paas (1998); Sweller (2010). Cognitive Load Theory — intrinsic, extraneous, and germane load (germane load later reframed as resources devoted to intrinsic load).
- Mayer, R. E. *Multimedia Learning* (Cambridge University Press); Mayer (Ed.), *The Cambridge Handbook of Multimedia Learning.* — Cognitive Theory of Multimedia Learning and its principles (coherence, signaling, redundancy, spatial/temporal contiguity, segmenting, pre-training, modality, multimedia, personalization, voice, image).
- Paivio, A. Dual Coding Theory — separate verbal and visual processing channels.
- Roediger, H. L., III, & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3). — retrieval/testing effect.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354–380. — spacing/distributed practice. (See also Ebbinghaus, 1885, the forgetting curve.)
- Bjork, R. A. Desirable difficulties — effortful, conditions-of-learning view of durable retention.
- Chi, M. T. H., & Wylie, R. (2014). The ICAP framework: Linking cognitive engagement to active learning outcomes. *Educational Psychologist, 49*(4), 219–243. — engagement modes Passive < Active < Constructive < Interactive; basis for the §1.8 interaction requirements.

**Accessibility & web standards**
- W3C Web Accessibility Initiative. *Web Content Accessibility Guidelines (WCAG) 2.2* (W3C Recommendation, October 2023), conformance Level AA. Specific success criteria are cited inline in Part 2.

**Related (referenced in spirit, not a rule basis)**
- Kirkpatrick four-level model of training evaluation — relevant if module-level success measurement is later extended to behavior/results.

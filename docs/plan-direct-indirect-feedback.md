# Module Plan — Reading Feedback Across Styles on a Global Team

> **v2 update (current build).** The interaction was reworked: the learner now takes the teammates
> **one at a time** (Sam, then Alex); for each, they **highlight marked cue-phrases** in the message
> and **write their reasoning**, an **AI coach** (Claude Sonnet 4.6, via a serverless proxy) gives
> specific feedback on that reasoning — with **static cue feedback as a graceful fallback** — and the
> **reply step is kept**. The scenario, the two messages, the reply choices/feedback, and the KB
> grounding below are unchanged; the cue-phrases map to the observable cues in `docs/kb-…` §2. The
> original v1 design (single thread, three quiz-style decisions, one self-explanation) is described
> in the sections that follow for reference.

**What this is.** The instructional-design spec for one micro-learning module — the *what* and the pedagogy. It is the design source for the build. Read it alongside the standard (in this repo at `.github/instructions/microlearning.instructions.md`) and the knowledge base (`docs/kb-direct-indirect-feedback.md`). Implementation choices — file structure, components, state, styling — are deliberately left to the build (plan mode); this doc does not prescribe them.

**Status.** Draft v0.1 for review. Self-contained: a fresh build agent should be able to produce the module from this doc + the standard + the KB, without the conversation that produced it.

---

## 1. Objective, audience, scope

**Objective (single, measurable).** Given a global-team exchange where blunt or vague feedback causes friction, the learner determines whether the cause is a direct/indirect communication-style difference rather than intent, and chooses a response that addresses the work issue without escalating.

**Audience.** Individual contributors on distributed, multi-region teams. No management role assumed. No prior cross-cultural training assumed.

**Estimated time.** ~5 minutes (within the 3–7 min house standard).

**Framing.** Anchored on the directness-of-feedback dimension (Meyer's Evaluating scale), grounded in the KB. The module teaches reading of *observable behavior*; it never states or implies any character's nationality, culture, or origin (see §3, naming).

---

## 2. Design rationale (alignment)

- **Bloom.** The objective integrates *Analyze* (diagnose the cause of the friction — style vs. intent vs. real issue) and *Apply* (select an effective response in context). Terminal performance is Apply; the diagnosis is the Analyze component. Metadata `bloomLevel`: Apply.
- **ICAP engagement.** The branching choices are *Active* (selecting). One required *Constructive* moment is built in: a brief self-explanation step where the learner generates their own reasoning before seeing feedback (§4, Decision 1). This satisfies the standard's ≥1-Constructive requirement. True *Interactive* (adaptive dialogue) is out of scope for v1 — see §7.
- **Constructive alignment (Biggs).** The decisions *are* the assessment: each asks the learner to perform the objective (diagnose, then respond). No separate quiz.
- **Why scenario-based.** The skill is judgment under realistic conditions; a decision scenario with consequences exercises it directly, where recall items could not.

---

## 3. The scenario

**Setting.** Lumen Pay, a fictional fintech. *(Company name is a placeholder — swap freely.)* The learner is a product writer. Tomorrow they present the new in-app **transaction-dispute flow** — the screens and copy that walk a customer through reporting a charge they don't recognize. Last night they shared a first draft in the team channel; this morning two replies are waiting.

**Cast.**
- **You** — the learner (second person, for immersion).
- **Sam** — a teammate who gives feedback at the *direct* end: plain, blunt, specific, no cushioning.
- **Alex** — a teammate who gives feedback at the *indirect* end: warm, softened, cushioned, the concern implied.

*Naming note.* "Sam" and "Alex" are deliberately origin-neutral placeholders, and their roles are not tied to their styles. The module states nothing about where either person is from. If either name reads as coding a nationality, swap it — the design principle (read behavior, not origin) must hold.

**The two messages** *(both flag the same real issue — screen 3 — at opposite ends of the directness scale; this is intentional, so the learner sees identical substance in very different wrapping):*

> **Sam:** "The dispute flow doesn't work yet. Screen 3 is confusing — customers won't know whether to tap 'Report' or 'Cancel,' and the wording is far too vague about the timeline. This needs a rework before tomorrow."

> **Alex:** "This is looking great — really nice work! I think it's almost there. Maybe screen 3 could be a tiny bit clearer? Just a small thought, totally up to you. Excited to see it tomorrow!"

---

## 4. Interaction flow

Three decision points. Every choice gets specific, consequence-based feedback. On a miss, the learner sees why and chooses again before moving on (no dead ends, no scoring penalty — this is practice, not a test).

### Intro (screen)
Set the scene (above). Frame the task: *Two replies, two very different tones. Your job: figure out what each teammate is really telling you, and respond so the work gets better and the relationship stays intact.*

### Decision 1 — Read Sam's message (diagnose)
**Prompt:** How do you read Sam's message?
- **A.** Sam's being harsh and dismissive of your work. *(distractor — reacting to delivery)*
- **B.** Sam communicates directly — the bluntness isn't personal, and the screen-3 points look worth taking seriously. *(aligned)*
- **C.** Sam's just venting; there's nothing here you can act on. *(distractor — misreads specific feedback as empty)*

**Constructive step (required):** Before feedback is revealed, the learner types a one-sentence answer to: *"What in the message makes you read it that way?"* Then the feedback and a short model rationale appear, for self-comparison. *(No automated grading — the value is in generating the explanation.)*

**Feedback:**
- **B:** Direct feedback can sting, but blunt ≠ rude — and the screen-3 concern is specific and real. You've separated *what* Sam said from *how* they said it.
- **A:** Understandable reaction, but answering the tone risks missing a valid point. The feedback is specific, not personal — a sign it's about the work, delivered directly.
- **C:** Look again: Sam named exactly what's confusing (Report vs. Cancel, the timeline wording). Blunt, but concrete and actionable.

### Decision 2 — Respond to Sam
**Prompt:** You've got a few hours before the review. How do you reply?
- **A.** "Screen 3 is fine — I think you're misreading the flow." *(distractor — defensive)*
- **B.** "Thanks, that's useful. Quick check — is the bigger risk the Report/Cancel labels or the timeline wording? Want to fix the right thing before tomorrow." *(aligned — engages substance, clarifying question, matches Sam's concise/direct register)*
- **C.** "Oh no, you're totally right — I'll redo the whole thing tonight." *(distractor — over-corrects)*

**Feedback:**
- **B:** You acted on the substance, asked a focused question, and matched Sam's direct register without escalating. That's flexing toward their style.
- **A:** Defending the work shuts down a valid, specific point and turns a work issue into a standoff.
- **C:** Over-correcting treats blunt delivery as a verdict on everything. You don't need to redo it all — just fix what was specifically flagged.

### Decision 3 — Handle Alex's message
**Prompt:** Alex's note is warm and easy to wave off. How do you handle it?
- **A.** Reply "Thanks, glad you like it!" and move on — it sounds basically fine. *(distractor — dismisses soft feedback as no-issue)*
- **B.** "Thanks! You mentioned screen 3 — what's tripping you up there? I'd rather catch it now than in the review." *(aligned — reads the real concern under the softness, makes it explicit with a specific question)*
- **C.** "Is it good or not? I can't tell what you want me to change." *(distractor — frustrated, puts it back on Alex)*

**Feedback:**
- **B:** You heard the real concern under the politeness. Soft delivery doesn't mean "no problem" — and notice Alex flagged the *same* screen 3 Sam did. Same issue, opposite wrapping.
- **A:** "Maybe a tiny bit clearer" is often a real concern in soft packaging. Take it at face value and you may walk into the review with a known gap.
- **C:** Wanting clarity is right, but this puts the work back on Alex and reads as irritated. A specific, friendly question gets you further.

### Debrief (screen)
Two teammates, the same real issue — screen 3 — at opposite ends of the directness scale. The skill wasn't guessing where anyone was from; it was reading *how* each delivers feedback and responding to the substance:
- **Blunt isn't rude** — separate the *what* from the *how*.
- **Soft isn't "no problem"** — a specific question surfaces the real ask.
- **When a style differs from yours, flex toward it** — confirm the work, rather than matching tone or taking it personally.

You never needed anyone's nationality — only their behavior. *Next time feedback lands wrong, ask: is this style, or substance? Usually it's both.*

---

## 5. Assessment & pass criterion

- The three decisions are the assessment (decision-based, aligned to the objective).
- **Pass criterion:** the learner reaches the aligned response on all three decisions. Misses are not penalized; the learner gets corrective feedback and re-chooses. "Complete" = aligned choice selected on each decision (after feedback if needed). The self-explanation step is completion-only, not graded.

---

## 6. Metadata block (populate at build, per standard §1.0)

```json
{
  "standard": "microlearning-standards@v1.2.0",
  "id": "cross-cultural-feedback",
  "title": "Reading Feedback Across Styles on a Global Team",
  "objective": "Given a global-team exchange where blunt or vague feedback causes friction, determine whether the cause is a direct/indirect communication-style difference rather than intent, and choose a response that addresses the work issue without escalating.",
  "bloomLevel": "Apply",
  "estimatedMinutes": 5,
  "interactionTypes": ["branching-scenario", "self-explanation"],
  "practiceItemCount": 3,
  "passCriterion": "Aligned response selected on all 3 decisions (corrective feedback and retry on misses).",
  "version": "1.0.0"
}
```

*(Confirm the `standard` tag matches your latest release.)*

---

## 7. Scope boundaries & optional v2

**In scope (v1):** one objective; one scenario; three decisions; one self-explanation (Constructive) step; debrief. Branching + self-explanation = ICAP Active + Constructive, meeting the standard.

**Explicitly out of scope (v1):**
- **AI-adaptive dialogue.** Would lift engagement to ICAP *Interactive* and is feasible (the build can call the Claude API), but adds dependency and scope. Flagged as the highest-value v2 enhancement.
- **A non-stylistic branch.** The KB notes not all friction is cultural. v1 handles this in the diagnosis framing and debrief; a dedicated branch where the friction is a genuine problem (not style) is a good v2 addition for depth.
- Anything touching the other Culture Map scales.

---

## 8. Left to the build (plan mode decides the *how*)

- File/project structure, component breakdown, state management.
- How the metadata block, persistence (if any), and accessibility requirements (WCAG 2.2 AA, per the standard's Part 2) are implemented.
- Visual and interaction styling, within the standard's build rules.
- The build must conform to the standard in this repo and pass its Part 3 checklist before it is "done."

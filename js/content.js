/*
 * content.js — Practice / interaction data (the single source for the interactive layer).
 *
 * Separation of content from logic (B-23): the engine in app.js holds no instructional
 * copy; everything the learner reads in the practice lives here as structured data.
 *
 * Provenance:
 *   - `prompt`, `choices[].text`/`.sent`, and `feedback` are lifted VERBATIM from the
 *     design spec (docs/plan-direct-indirect-feedback.md §4). The learning content is
 *     not redesigned.
 *   - `reactions` and `selfExplanation.modelRationale` are presentation copy authored for
 *     the build: the reactions deliver each choice's already-specified consequence
 *     in-character; the model rationale sharpens the self-comparison the spec calls for.
 *
 * The expository material (objective, scene, both original messages, debrief takeaways)
 * lives once in index.html so it is readable with no JavaScript (B-32) and is NOT
 * duplicated here (B-25).
 */
(function () {
  "use strict";

  window.MODULE_CONTENT = {
    /* Each decision: id, mode, the teammate it concerns, a meaningful step title (D-30),
       the prompt, the choices (with an `aligned` flag — the objective's success path),
       and explanatory feedback for every choice (D-23). Reply decisions also carry the
       `sent` bubble text and the in-thread `reactions`. */
    decisions: [
      {
        id: "d1",
        mode: "interpret",
        person: "Sam",
        title: "Read Sam's message",
        prompt: "How do you read Sam's message?",
        selfExplanation: {
          prompt:
            "Before you see any feedback: in one sentence, what in the message makes you read it that way?",
          modelRationale:
            "The tell isn't the sharp tone — it's that Sam names the exact failure: which control is ambiguous (Report vs. Cancel) and that the timeline wording is vague. A problem that specific and nameable is a sign it's about the work, delivered directly — not a verdict on you. Blunt delivery and a valid point can both be true at once."
        },
        choices: [
          {
            key: "A",
            text: "Sam's being harsh and dismissive of your work.",
            aligned: false
          },
          {
            key: "B",
            text:
              "Sam communicates directly — the bluntness isn't personal, and the screen-3 points look worth taking seriously.",
            aligned: true
          },
          {
            key: "C",
            text: "Sam's just venting; there's nothing here you can act on.",
            aligned: false
          }
        ],
        feedback: {
          A: "Understandable reaction, but answering the tone risks missing a valid point. The feedback is specific, not personal — a sign it's about the work, delivered directly.",
          B: "Direct feedback can sting, but blunt ≠ rude — and the screen-3 concern is specific and real. You've separated what Sam said from how they said it.",
          C: "Look again: Sam named exactly what's confusing (Report vs. Cancel, the timeline wording). Blunt, but concrete and actionable."
        }
      },

      {
        id: "d2",
        mode: "reply",
        person: "Sam",
        title: "Reply to Sam",
        prompt: "You've got a few hours before the review. How do you reply?",
        choices: [
          {
            key: "A",
            text: "Screen 3 is fine — I think you're misreading the flow.",
            sent: "Screen 3 is fine — I think you're misreading the flow.",
            aligned: false
          },
          {
            key: "B",
            text:
              "Thanks, that's useful. Quick check — is the bigger risk the Report/Cancel labels or the timeline wording? Want to fix the right thing before tomorrow.",
            sent:
              "Thanks, that's useful. Quick check — is the bigger risk the Report/Cancel labels or the timeline wording? Want to fix the right thing before tomorrow.",
            aligned: true
          },
          {
            key: "C",
            text: "Oh no, you're totally right — I'll redo the whole thing tonight.",
            sent: "Oh no, you're totally right — I'll redo the whole thing tonight.",
            aligned: false
          }
        ],
        reactions: {
          A: "I'm not misreading it. Open screen 3 and tell me, in one line, which button reports a charge. If you can't, a customer can't either.",
          B: "Timeline wording, mostly. Report vs. Cancel is borderline, but the timeline is the real trap. Fix that and you're good.",
          C: "Whoa — don't redo the whole flow. It's screen 3, not the rest. Don't burn your night on the parts that already work."
        },
        feedback: {
          A: "Defending the work shuts down a valid, specific point and turns a work issue into a standoff.",
          B: "You acted on the substance, asked a focused question, and matched Sam's direct register without escalating. That's flexing toward their style.",
          C: "Over-correcting treats blunt delivery as a verdict on everything. You don't need to redo it all — just fix what was specifically flagged."
        }
      },

      {
        id: "d3",
        mode: "reply",
        person: "Alex",
        title: "Reply to Alex",
        prompt: "Alex's note is warm and easy to wave off. How do you handle it?",
        choices: [
          {
            key: "A",
            text: "Say “Thanks, glad you like it!” and move on — it sounds basically fine.",
            sent: "Thanks, glad you like it!",
            aligned: false
          },
          {
            key: "B",
            text:
              "Thanks! You mentioned screen 3 — what's tripping you up there? I'd rather catch it now than in the review.",
            sent:
              "Thanks! You mentioned screen 3 — what's tripping you up there? I'd rather catch it now than in the review.",
            aligned: true
          },
          {
            key: "C",
            text: "Is it good or not? I can't tell what you want me to change.",
            sent: "Is it good or not? I can't tell what you want me to change.",
            aligned: false
          }
        ],
        reactions: {
          A: "Yay, so glad! 😊 See you at the review!",
          B: "Oh, thanks for asking! 😅 Honestly, on screen 3 I wasn't sure whether to tap Report or Cancel — and I couldn't tell how long a dispute takes. Probably just me, but it threw me for a second.",
          C: "Oh — sorry! It's good, really, forget I said anything. Didn't mean to hold you up 😬"
        },
        feedback: {
          A: "“Maybe a tiny bit clearer” is often a real concern in soft packaging. Take it at face value and you may walk into the review with a known gap.",
          B: "You heard the real concern under the politeness. Soft delivery doesn't mean “no problem” — and notice Alex flagged the same screen 3 Sam did. Same issue, opposite wrapping.",
          C: "Wanting clarity is right, but this puts the work back on Alex and reads as irritated. A specific, friendly question gets you further."
        }
      }
    ]
  };
})();

/*
 * content.js — Practice / interaction data (the single source for the interactive layer).
 *
 * v2 model: two sequential phases (Sam, then Alex). In each phase the learner annotates
 * marked cue-phrases in the message, then replies. The cue PHRASES themselves live in
 * index.html as <mark data-cue="…"> spans (so they're readable with no JavaScript — B-32,
 * and not duplicated here — B-25). This file holds, per cue id: what the cue signals and a
 * static fallback feedback string used when the AI coach is unavailable (B-35).
 *
 * Provenance:
 *   - reply `prompt`/`choices[].text`/`.sent`/`feedback` are verbatim from the design spec.
 *   - cue `signal`/`staticFeedback` and `reactions` are authored from the knowledge base
 *     (KB §2 observable cues) for this build.
 */
(function () {
  "use strict";

  window.MODULE_CONTENT = {
    /* Sent to the AI coach as grounding context (never as a secret). */
    objective:
      "Read whether a teammate's feedback is delivered in a direct or indirect style (vs. a difference in intent), using observable cues, and respond to the substance without escalating.",

    phases: [
      {
        id: "sam",
        person: "Sam",
        style: "direct",
        title: "Read Sam's message",
        annotatePrompt:
          "Pick a highlighted phrase, then say in a sentence what it tells you about how Sam is giving feedback.",
        cues: [
          {
            id: "sam-1",
            signal: "A blunt verdict stated outright, with no cushioning.",
            staticFeedback:
              "That's a blunt, uncushioned verdict — the problem stated plainly. Direct delivery isn't the same as rudeness.",
            key: false
          },
          {
            id: "sam-2",
            signal: "Names a specific, actionable failure — which control is ambiguous.",
            staticFeedback:
              "Good eye. Sam names the exact failure — which button a customer can't choose between. A specific, nameable problem is a sign it's about the work, not a verdict on you.",
            key: true
          },
          {
            id: "sam-3",
            signal: "An upgrader (“far too”) that strengthens the criticism over a concrete issue.",
            staticFeedback:
              "“Far too” is an upgrader — it intensifies the criticism rather than softening it, which is typical of direct delivery. The underlying point (a vague timeline) is specific and real.",
            key: false
          },
          {
            id: "sam-4",
            signal: "The requested change is spelled out directly, not implied.",
            staticFeedback:
              "The ask is spelled out, not left for you to infer — a hallmark of direct feedback. You don't have to guess what Sam wants changed.",
            key: false
          }
        ],
        reply: {
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
        }
      },

      {
        id: "alex",
        person: "Alex",
        style: "indirect",
        title: "Read Alex's message",
        annotatePrompt:
          "Pick a highlighted phrase, then say in a sentence what it tells you about how Alex is giving feedback.",
        cues: [
          {
            id: "alex-1",
            signal: "Cushioning — warm, positive framing wrapped around the real message.",
            staticFeedback:
              "That's cushioning: warm framing around the real message. Soft delivery, but it doesn't mean there's no concern coming.",
            key: false
          },
          {
            id: "alex-2",
            signal: "Downgraders (“maybe”, “a tiny bit”) that shrink a real concern.",
            staticFeedback:
              "Good catch. “Maybe” and “a tiny bit” are downgraders — they shrink the concern. But “a little clearer” is often a real problem in soft packaging, not “no problem.”",
            key: true
          },
          {
            id: "alex-3",
            signal: "Downplays the request and hands you the decision — the ask is left for you to infer.",
            staticFeedback:
              "This downplays the request and hands you the call — typical of indirect delivery. The ask is signalled, not spelled out, so it's easy to wave off.",
            key: false
          },
          {
            id: "alex-4",
            signal: "The real concern — the same screen 3 Sam flagged, just softened.",
            staticFeedback:
              "Notice it's the same screen 3 Sam flagged — the same real issue, opposite wrapping. The concern is there; it's just softened.",
            key: false
          }
        ],
        reply: {
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
      }
    ]
  };
})();

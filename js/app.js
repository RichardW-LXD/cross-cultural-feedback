/*
 * app.js — The branching/step engine. Holds NO instructional copy (B-23): it reads the
 * practice data from content.js and enhances the readable DOM in index.html.
 *
 * Progressive enhancement (B-32): if this script fails, the expository material in
 * index.html stays fully readable. The engine only hides/reveals and injects the
 * interactive layer; on any internal error it restores the readable view (revealAll()).
 *
 * Accessibility (Part 2): native controls (button/fieldset/radio/textarea); focus is
 * moved to each step heading and to outcomes; a visually-hidden polite live region
 * carries succinct status; nothing relies on colour alone; no drag interactions.
 */
(function () {
  "use strict";

  var CONTENT = window.MODULE_CONTENT;
  var Storage = window.MLStorage || {
    saveProgress: function () { return false; },
    loadProgress: function () { return null; },
    clearProgress: function () {}
  };

  var STEP_ORDER = ["intro", "d1", "d2", "d3", "debrief"];
  var NEXT = { d1: "d2", d2: "d3", d3: "debrief" };

  /* ---- DOM references (filled in init) ---- */
  var dom = {};

  /* ---- Session state. selfExplanation is in-memory only and never persisted (B-22). ---- */
  var state = {
    step: "intro",
    completed: { d1: false, d2: false, d3: false },
    finalChoice: {},
    selfExplanation: ""
  };

  var decisionsById = {};
  var originalThreadCount = 0;

  /* =========================================================================
   * Small DOM helpers
   * =======================================================================*/
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === false || v === null || v === undefined) return;
        if (k === "hidden") { if (v) node.hidden = true; return; }
        if (k === "class") { node.className = v; return; }
        if (k === "text") { node.textContent = v; return; }
        node.setAttribute(k, v);
      });
    }
    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children === null || children === undefined) return;
    if (Array.isArray(children)) {
      children.forEach(function (c) { append(node, c); });
    } else if (typeof children === "string") {
      node.appendChild(document.createTextNode(children));
    } else {
      node.appendChild(children);
    }
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function show(node, visible) {
    if (node) node.hidden = !visible;
  }

  function focusEl(node) {
    if (node && typeof node.focus === "function") {
      try { node.focus(); } catch (e) { /* non-fatal */ }
    }
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* Succinct status for screen readers (the detailed text is read when focus lands on it). */
  function announce(msg) {
    if (!dom.srLive) return;
    dom.srLive.textContent = "";
    window.setTimeout(function () { dom.srLive.textContent = msg; }, 30);
  }

  /* =========================================================================
   * Persistence (only non-sensitive markers — B-21/B-22)
   * =======================================================================*/
  function save() {
    Storage.saveProgress({
      step: state.step,
      completed: state.completed,
      finalChoice: state.finalChoice
    });
  }

  function markComplete(id, key) {
    state.completed[id] = true;
    state.finalChoice[id] = key;
    save();
  }

  /* =========================================================================
   * Step navigation
   * =======================================================================*/
  function goToStep(step, opts) {
    opts = opts || {};
    state.step = step;
    save();

    var inDecision = step === "d1" || step === "d2" || step === "d3";
    show(dom.intro, step === "intro");
    show(dom.channel, inDecision);
    show(dom.practice, inDecision);
    show(dom.debrief, step === "debrief");

    if (step === "intro") {
      renderIntroActions();
    } else if (inDecision) {
      renderDecision(step);
    } else if (step === "debrief") {
      renderDebrief();
    }

    if (opts.focus !== false) {
      var heading =
        step === "intro" ? null :
        step === "debrief" ? dom.debrief.querySelector("#debrief-title") :
        dom.practice.querySelector("#step-heading");
      focusEl(heading);
    }
  }

  /* =========================================================================
   * Intro (with resume affordance)
   * =======================================================================*/
  function renderIntroActions() {
    clear(dom.introActions);
    var start = el("button", { type: "button", "class": "btn btn--primary" }, "Start the scenario →");
    start.addEventListener("click", function () { goToStep("d1"); });
    dom.introActions.appendChild(start);
  }

  function renderResumeBanner(saved) {
    clear(dom.introActions);
    var note = el("p", { "class": "resume__note" }, "Welcome back — you have a session in progress.");
    var resume = el("button", { type: "button", "class": "btn btn--primary" }, "Resume where I left off");
    resume.addEventListener("click", function () {
      state.completed = saved.completed || { d1: false, d2: false, d3: false };
      state.finalChoice = saved.finalChoice || {};
      reconstructThread();
      goToStep(saved.step);
    });
    var over = el("button", { type: "button", "class": "btn btn--ghost" }, "Start over");
    over.addEventListener("click", function () {
      Storage.clearProgress();
      resetSession();
      renderIntroActions();
      focusEl(dom.introActions.querySelector("button"));
    });
    append(dom.introActions, [note, resume, over]);
  }

  /* Rebuild the thread for already-completed reply decisions so a resumed thread reads
     continuously (aligned reply + reaction only; no coaching/typing). */
  function reconstructThread() {
    ["d2", "d3"].forEach(function (id) {
      if (!state.completed[id]) return;
      var d = decisionsById[id];
      var key = state.finalChoice[id];
      if (!d || !key) return;
      var choice = findChoice(d, key);
      if (choice) appendLearnerBubble(choice.sent || choice.text);
      appendReaction(d.person, d.reactions[key]);
    });
  }

  function resetSession() {
    state.completed = { d1: false, d2: false, d3: false };
    state.finalChoice = {};
    state.selfExplanation = "";
    state.step = "intro";
    // Remove any appended replies, leaving the two original messages.
    while (dom.thread.children.length > originalThreadCount) {
      dom.thread.removeChild(dom.thread.lastChild);
    }
  }

  /* =========================================================================
   * Decisions
   * =======================================================================*/
  function findChoice(d, key) {
    for (var i = 0; i < d.choices.length; i++) {
      if (d.choices[i].key === key) return d.choices[i];
    }
    return null;
  }

  function decisionNumber(id) {
    for (var i = 0; i < CONTENT.decisions.length; i++) {
      if (CONTENT.decisions[i].id === id) return i + 1;
    }
    return 1;
  }

  function renderDecision(id) {
    var d = decisionsById[id];
    clear(dom.practice);
    dom.practice.setAttribute("aria-labelledby", "step-heading");

    var kicker = el("p", { "class": "kicker" }, "Decision " + decisionNumber(id) + " of 3");
    var heading = el("h2", { id: "step-heading", "class": "step-title", tabindex: "-1" }, d.title);
    append(dom.practice, [kicker, heading]);

    if (d.mode === "interpret") {
      renderInterpret(d);
    } else {
      renderReply(d);
    }
  }

  /* ---- Decision 1: interpret + required self-explanation (Constructive — D-35) ---- */
  function renderInterpret(d) {
    var selfExplained = false;
    var selectedKey = null;

    var fieldset = el("fieldset", { "class": "choices" });
    fieldset.appendChild(el("legend", null, d.prompt));
    var choiceError = el("p", { "class": "field-error", id: "d1-choice-error", hidden: true },
      "Pick one reading to continue.");
    fieldset.setAttribute("aria-describedby", "d1-choice-error");

    d.choices.forEach(function (c) {
      var inputId = "d1-" + c.key;
      var input = el("input", { type: "radio", name: "d1-choice", id: inputId, value: c.key });
      var label = el("label", { "class": "opt", "for": inputId }, [
        input,
        el("span", { "class": "opt__text" }, c.key + ". " + c.text)
      ]);
      fieldset.appendChild(label);
    });

    var checkBtn = el("button", { type: "button", "class": "btn" }, "Check my read");

    /* Self-explanation block (hidden until a reading is chosen). */
    var explainInput = el("textarea", {
      id: "d1-explain-input", "class": "explain__input", rows: "3", "aria-describedby": "d1-explain-error"
    });
    var explainError = el("p", { "class": "field-error", id: "d1-explain-error", hidden: true },
      "Jot down a sentence to continue — it's just for you, and it isn't graded.");
    var explainBtn = el("button", { type: "button", "class": "btn" }, "See the feedback");
    var explainBlock = el("div", { "class": "explain", hidden: true }, [
      el("label", { "class": "explain__label", "for": "d1-explain-input" }, d.selfExplanation.prompt),
      explainInput, explainError, explainBtn
    ]);

    var feedbackBlock = el("div", { "class": "feedback", tabindex: "-1", hidden: true });

    append(dom.practice, [fieldset, choiceError, checkBtn, explainBlock, feedbackBlock]);

    function onCheck() {
      var sel = fieldset.querySelector("input:checked");
      if (!sel) {
        show(choiceError, true);
        announce("Pick one reading to continue.");
        focusEl(fieldset.querySelector("input"));
        return;
      }
      show(choiceError, false);
      selectedKey = sel.value;
      if (!selfExplained) {
        checkBtn.hidden = true;
        show(explainBlock, true);
        focusEl(explainInput);
      } else {
        revealFeedback();
      }
    }

    function onExplain() {
      if (!explainInput.value.trim()) {
        show(explainError, true);
        explainInput.setAttribute("aria-invalid", "true");
        announce("Add a sentence to continue.");
        focusEl(explainInput);
        return;
      }
      show(explainError, false);
      explainInput.removeAttribute("aria-invalid");
      state.selfExplanation = explainInput.value.trim();
      selfExplained = true;
      show(explainBlock, false);
      revealFeedback();
    }

    function revealFeedback() {
      var c = findChoice(d, selectedKey);
      var aligned = !!c.aligned;
      clear(feedbackBlock);

      var result = el("p", { "class": "result " + (aligned ? "result--good" : "result--review") }, [
        el("span", { "class": "result__icon", "aria-hidden": "true" }, aligned ? "✓" : "↻"),
        el("span", null, aligned ? " Good read." : " Worth another look.")
      ]);

      var yourNote = el("blockquote", { "class": "feedback__note" });
      yourNote.appendChild(textP(state.selfExplanation));

      append(feedbackBlock, [
        el("h3", { "class": "sr-only" }, "Feedback"),
        result,
        el("p", { "class": "feedback__text" }, d.feedback[selectedKey]),
        el("p", { "class": "feedback__label" }, "Your note"),
        yourNote,
        el("p", { "class": "feedback__label" }, "A sharper read"),
        el("p", { "class": "feedback__model" }, d.selfExplanation.modelRationale)
      ]);

      if (aligned) {
        disableRadios();
        checkBtn.hidden = true;
        var cont = el("button", { type: "button", "class": "btn btn--primary" }, "Continue →");
        cont.addEventListener("click", function () {
          markComplete("d1", selectedKey);
          goToStep("d2");
        });
        feedbackBlock.appendChild(cont);
      } else {
        feedbackBlock.appendChild(el("p", { "class": "feedback__retry" },
          "Choose the reading that separates what Sam said from how they said it, then check again."));
        checkBtn.hidden = false;
        checkBtn.textContent = "Check again";
      }

      show(feedbackBlock, true);
      announce(aligned ? "Good read." : "Worth another look.");
      focusEl(feedbackBlock);
    }

    function disableRadios() {
      var inputs = fieldset.querySelectorAll("input");
      for (var i = 0; i < inputs.length; i++) inputs[i].disabled = true;
    }

    checkBtn.addEventListener("click", onCheck);
    explainBtn.addEventListener("click", onExplain);
  }

  /* ---- Decisions 2 & 3: conversational, in-thread (change 1) ---- */
  function renderReply(d) {
    var promptId = "reply-prompt-" + d.id;
    var chips = el("ul", { "class": "chips" });
    var group = el("div", { "class": "reply", role: "group", "aria-labelledby": promptId }, [
      el("p", { "class": "prompt", id: promptId }, d.prompt),
      chips
    ]);
    var actions = el("div", { "class": "step-actions" });
    append(dom.practice, [group, actions]);

    d.choices.forEach(function (c) {
      var btn = el("button", { type: "button", "class": "chip", "data-key": c.key }, c.text);
      btn.addEventListener("click", function () { handleReply(c); });
      chips.appendChild(el("li", null, btn));
    });

    function setChipsDisabled(disabled) {
      var btns = chips.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) btns[i].disabled = disabled;
    }

    function handleReply(c) {
      appendLearnerBubble(c.sent || c.text);
      setChipsDisabled(true);

      if (reducedMotion()) {
        finish();
      } else {
        var typing = appendTyping(d.person);
        window.setTimeout(function () {
          removeNode(typing);
          finish();
        }, 700);
      }

      function finish() {
        var bubble = appendReaction(d.person, d.reactions[c.key]);
        appendCoach(d.feedback[c.key]);
        announce(d.person + " replied.");
        focusEl(bubble);

        if (c.aligned) {
          markComplete(d.id, c.key);
          show(group, false);
          clear(actions);
          var cont = el("button", { type: "button", "class": "btn btn--primary" }, "Continue →");
          cont.addEventListener("click", function () { goToStep(NEXT[d.id]); });
          actions.appendChild(cont);
        } else {
          setChipsDisabled(false);
        }
      }
    }
  }

  /* =========================================================================
   * Thread bubbles
   * =======================================================================*/
  function textP(text) {
    var p = el("p", { "class": "msg__text" });
    p.textContent = text; // escape any free/marked-up text (B-33)
    return p;
  }

  function avatarFor(person) {
    return el("span", { "class": "avatar avatar--" + person.toLowerCase(), "aria-hidden": "true" },
      person.charAt(0));
  }

  function appendLearnerBubble(text) {
    var li = el("li", { "class": "msg msg--me" }, [
      el("div", { "class": "bubble" }, [el("p", { "class": "msg__name" }, "You"), textP(text)])
    ]);
    dom.thread.appendChild(li);
    return li;
  }

  function appendReaction(person, text) {
    var bubble = el("div", { "class": "bubble", tabindex: "-1" }, [
      el("p", { "class": "msg__name" }, person), textP(text)
    ]);
    var li = el("li", { "class": "msg msg--them", "data-from": person }, [avatarFor(person), bubble]);
    dom.thread.appendChild(li);
    return bubble;
  }

  /* Typing indicator: visual flourish only (change 4). aria-hidden so it never reaches the
     live region; space is reserved in CSS to avoid layout shift (B-30). Skipped entirely
     under reduced motion (handled by the caller). */
  function appendTyping(person) {
    var dots = el("span", { "class": "dots", "aria-hidden": "true" }, [
      el("span", { "class": "dot" }), el("span", { "class": "dot" }), el("span", { "class": "dot" })
    ]);
    var li = el("li", { "class": "msg msg--them typing", "aria-hidden": "true" }, [
      avatarFor(person),
      el("div", { "class": "bubble" }, [
        el("span", { "class": "typing__label" }, person + " is typing"), dots
      ])
    ]);
    dom.thread.appendChild(li);
    return li;
  }

  function appendCoach(text) {
    var p = el("p", { "class": "coach__text" });
    p.textContent = text;
    var li = el("li", { "class": "coach" }, [el("p", { "class": "coach__tag" }, "Coach"), p]);
    dom.thread.appendChild(li);
    return li;
  }

  function removeNode(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  /* =========================================================================
   * Debrief + personalised recap (change 3) — built from session memory only
   * =======================================================================*/
  function renderDebrief() {
    clear(dom.recap);
    clear(dom.debriefActions);

    var items = [];
    var d1 = decisionsById.d1, d2 = decisionsById.d2, d3 = decisionsById.d3;

    if (state.completed.d1 && state.finalChoice.d1) {
      var read = findChoice(d1, state.finalChoice.d1);
      if (read) items.push(recapItem("How you read Sam", read.text));
    }
    if (state.selfExplanation) {
      items.push(recapItem("Your note, in your own words", state.selfExplanation, true));
    }
    if (state.completed.d2 && state.finalChoice.d2) {
      var r2 = findChoice(d2, state.finalChoice.d2);
      if (r2) items.push(recapItem("Your reply to Sam", r2.sent || r2.text, true));
    }
    if (state.completed.d3 && state.finalChoice.d3) {
      var r3 = findChoice(d3, state.finalChoice.d3);
      if (r3) items.push(recapItem("Your reply to Alex", r3.sent || r3.text, true));
    }

    if (items.length) {
      var list = el("ul", { "class": "recap__list" }, items);
      append(dom.recap, [
        el("h3", { "class": "recap__title" }, "How you read the room"),
        list
      ]);
    }

    var restart = el("button", { type: "button", "class": "btn btn--ghost" }, "Run it again");
    restart.addEventListener("click", function () {
      Storage.clearProgress();
      resetSession();
      goToStep("intro");
    });
    dom.debriefActions.appendChild(restart);
  }

  function recapItem(label, value, quote) {
    var valueNode = quote ? el("blockquote", { "class": "recap__quote" }) : el("span", { "class": "recap__value" });
    valueNode.textContent = value; // escape learner text (B-33)
    return el("li", { "class": "recap__item" }, [
      el("span", { "class": "recap__label" }, label),
      valueNode
    ]);
  }

  /* =========================================================================
   * Init
   * =======================================================================*/
  function revealAll() {
    // Fallback if the engine can't run: keep the readable material visible (B-32).
    show(dom.intro, true);
    show(dom.channel, true);
    show(dom.debrief, true);
  }

  function init() {
    dom.srLive = document.getElementById("sr-live");
    dom.intro = document.getElementById("intro");
    dom.introActions = document.getElementById("intro-actions");
    dom.channel = document.getElementById("channel");
    dom.thread = document.getElementById("thread");
    dom.practice = document.getElementById("practice");
    dom.debrief = document.getElementById("debrief");
    dom.recap = document.getElementById("recap");
    dom.debriefActions = document.getElementById("debrief-actions");

    if (!CONTENT || !CONTENT.decisions || !dom.practice || !dom.thread) {
      revealAll();
      return;
    }

    CONTENT.decisions.forEach(function (d) { decisionsById[d.id] = d; });
    originalThreadCount = dom.thread.children.length;

    // Enhanced view: hide what isn't the current step (without JS, all stayed visible).
    show(dom.channel, false);
    show(dom.debrief, false);

    var saved = Storage.loadProgress();
    if (saved && (saved.step === "d2" || saved.step === "d3" || saved.step === "debrief")) {
      goToStep("intro", { focus: false });
      renderResumeBanner(saved);
    } else {
      goToStep("intro", { focus: false });
    }
  }

  try {
    init();
  } catch (e) {
    // Never leave a broken interactive shell: restore the readable content (B-32/B-33).
    if (window.console && console.error) console.error("Module init failed:", e);
    try { revealAll(); } catch (e2) { /* ignore */ }
  }
})();

/*
 * app.js — The phase engine. Holds NO instructional copy (B-23): it reads the practice data
 * from content.js, enhances the readable DOM in index.html, and calls coach.js for AI feedback
 * (falling back to each cue's static feedback when the coach is unavailable — B-35/B-33).
 *
 * Flow: intro → Sam phase → Alex phase → debrief. One teammate at a time. Each phase:
 *   1) annotate marked cue-phrases (constructive — the learner writes their reasoning, D-35),
 *   2) reply (quick-reply chips → learner bubble → teammate reaction → coaching).
 *
 * Accessibility (Part 2): native controls; focus moved to each step heading and to outcomes;
 * a polite live region carries succinct status; nothing relies on colour alone; no drag (B-9).
 * Progressive enhancement (B-32): if this script fails, the readable material stays visible.
 */
(function () {
  "use strict";

  var CONTENT = window.MODULE_CONTENT;
  var Storage = window.MLStorage || {
    saveProgress: function () { return false; },
    loadProgress: function () { return null; },
    clearProgress: function () {}
  };
  var Coach = window.MLCoach || { isEnabled: function () { return false; }, getFeedback: function () { return Promise.resolve(null); } };

  var STEP_ORDER = ["intro", "sam", "alex", "debrief"];
  var NEXT = { sam: "alex", alex: "debrief" };

  var dom = {};
  var phasesById = {};
  var cuesById = {};
  var originalThreadCount = 0;

  /* Session state. annotations (free text) is in-memory only — never persisted (B-22). */
  var state = {
    step: "intro",
    completed: { sam: false, alex: false },
    finalReply: {},            // phaseId -> aligned choice key
    annotations: {}            // cueId -> { comment, phrase }
  };

  /* =========================================================================
   * DOM helpers
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
    if (Array.isArray(children)) { children.forEach(function (c) { append(node, c); }); }
    else if (typeof children === "string") { node.appendChild(document.createTextNode(children)); }
    else { node.appendChild(children); }
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function show(node, visible) { if (node) node.hidden = !visible; }
  function focusEl(node) { if (node && node.focus) { try { node.focus(); } catch (e) {} } }
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function announce(msg) {
    if (!dom.srLive) return;
    dom.srLive.textContent = "";
    window.setTimeout(function () { dom.srLive.textContent = msg; }, 30);
  }
  function textP(text, cls) {
    var p = el("p", cls ? { "class": cls } : null);
    p.textContent = text; // escape any free/marked-up text (B-33)
    return p;
  }
  function phaseOf(cueId) { return cueId.split("-")[0]; }

  /* =========================================================================
   * Persistence (markers only — B-21/B-22)
   * =======================================================================*/
  function save() {
    Storage.saveProgress({ step: state.step, completed: state.completed, finalReply: state.finalReply });
  }

  /* =========================================================================
   * Step navigation
   * =======================================================================*/
  function goToStep(step, opts) {
    opts = opts || {};
    state.step = step;
    save();

    var inPhase = step === "sam" || step === "alex";
    show(dom.intro, step === "intro");
    show(dom.phaseIntro, inPhase);
    show(dom.channel, inPhase);
    show(dom.debrief, step === "debrief");
    if (!inPhase) { show(dom.practice, false); show(dom.replyCard, false); } // shown by renderPhase/revealReply
    if (inPhase) updateChannelVisibility(step);

    if (step === "intro") renderIntroActions();
    else if (inPhase) renderPhase(step);
    else if (step === "debrief") renderDebrief();

    if (opts.focus !== false) {
      var heading =
        step === "intro" ? null :
        step === "debrief" ? dom.debrief.querySelector("#debrief-title") :
        dom.phaseIntro.querySelector("#step-heading");
      focusEl(heading);
    }
  }

  /* Show only the current teammate's message + that phase's appended bubbles. */
  function updateChannelVisibility(phaseId) {
    show(dom.msgSam, phaseId === "sam");
    show(dom.msgAlex, phaseId === "alex");
    var appended = dom.thread.querySelectorAll(".appended");
    for (var i = 0; i < appended.length; i++) {
      appended[i].hidden = appended[i].getAttribute("data-phase") !== phaseId;
    }
  }

  /* =========================================================================
   * Intro
   * =======================================================================*/
  function renderIntroActions() {
    clear(dom.introActions);
    var start = el("button", { type: "button", "class": "btn btn--primary" }, "Start with Sam →");
    start.addEventListener("click", function () { goToStep("sam"); });
    dom.introActions.appendChild(start);
  }

  function renderResumeBanner(saved) {
    clear(dom.introActions);
    var note = el("p", { "class": "resume__note" }, "Welcome back — you have a session in progress.");
    var resume = el("button", { type: "button", "class": "btn btn--primary" }, "Resume where I left off");
    resume.addEventListener("click", function () {
      state.completed = saved.completed || { sam: false, alex: false };
      state.finalReply = saved.finalReply || {};
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

  /* =========================================================================
   * Phase: annotate + reply
   * =======================================================================*/
  function renderPhase(phaseId) {
    var phase = phasesById[phaseId];

    // Step 1 of 2 (read) — instructions FIRST, in their own card above the message.
    clear(dom.phaseIntro);
    append(dom.phaseIntro, [
      el("p", { "class": "kicker kicker--step" }, "Step 1 of 2 · Reading " + phase.person),
      el("h2", { id: "step-heading", "class": "step-title", tabindex: "-1" }, phase.title),
      el("p", { "class": "annotate__prompt" }, phase.annotatePrompt),
      el("p", { "class": "annotate__hint" },
        phase.person + "'s message is below. Its highlighted phrases are clickable — pick one to comment on, and annotate at least one to continue.")
    ]);

    // Step 1 work (comment box + feedback) below the message; hidden until a cue is picked.
    clear(dom.practice);
    dom.practice.removeAttribute("aria-labelledby");
    dom.practice.setAttribute("aria-label", "Your notes for " + phase.person);
    var annotateWork = el("div", { id: "annotate-work" });
    append(dom.practice, [annotateWork]);
    show(dom.practice, false);

    // Step 2 (reply) lives in its own card — cleared and hidden until step 1 is done.
    clear(dom.replyCard);
    show(dom.replyCard, false);

    // Reset cue buttons for this phase and bind clicks.
    var msg = phaseId === "sam" ? dom.msgSam : dom.msgAlex;
    var buttons = msg.querySelectorAll("button.cue");
    var ctx = { phase: phase, annotateWork: annotateWork, replyArea: dom.replyCard, replyRendered: false };
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.setAttribute("aria-pressed", "false");
      btn.classList.toggle("is-annotated", !!state.annotations[btn.getAttribute("data-cue")]);
      btn.onclick = function () { selectCue(btn, ctx); };
    });

    // Resume within a session: if a cue was already annotated, show the work area + reply.
    if (anyAnnotated(phaseId)) { show(dom.practice, true); revealReply(ctx); }
  }

  function anyAnnotated(phaseId) {
    return Object.keys(state.annotations).some(function (id) { return phaseOf(id) === phaseId; });
  }

  function selectCue(btn, ctx) {
    var cueId = btn.getAttribute("data-cue");
    if (phaseOf(cueId) !== state.step) return;
    show(dom.practice, true); // reveal the work card now that there's something in it
    var phrase = btn.textContent.replace(/\s+/g, " ").trim();

    // Single-select within the phase.
    var siblings = (ctx.phase.id === "sam" ? dom.msgSam : dom.msgAlex).querySelectorAll("button.cue");
    Array.prototype.forEach.call(siblings, function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });

    var cue = cuesById[cueId] || {};
    clear(ctx.annotateWork);

    var selected = el("div", { "class": "annotate__selected" }, [el("span", { "class": "label" }, "Commenting on")]);
    selected.appendChild(textP("“" + phrase + "”"));

    var inputId = "cue-comment";
    var errId = "cue-comment-error";
    var input = el("textarea", {
      id: inputId, "class": "explain__input", rows: "3", "aria-describedby": errId
    });
    if (state.annotations[cueId]) input.value = state.annotations[cueId].comment;
    var error = el("p", { "class": "field-error", id: errId, hidden: true },
      "Add a sentence about what this phrase tells you, then get feedback.");
    var submit = el("button", { type: "button", "class": "btn btn--primary" }, "Get feedback");

    var explain = el("div", { "class": "explain" }, [
      el("label", { "class": "explain__label", "for": inputId },
        "What does this phrase tell you about how " + ctx.phase.person + " is giving feedback?"),
      input, error, submit
    ]);

    var feedbackHost = el("div", { id: "cue-feedback" });

    append(ctx.annotateWork, [selected, explain, feedbackHost]);

    submit.addEventListener("click", function () {
      var val = input.value.trim();
      if (!val) {
        show(error, true);
        input.setAttribute("aria-invalid", "true");
        announce("Add a sentence to get feedback.");
        focusEl(input);
        return;
      }
      show(error, false);
      input.removeAttribute("aria-invalid");
      state.annotations[cueId] = { comment: val, phrase: phrase };
      btn.classList.add("is-annotated");
      requestFeedback(ctx, cue, phrase, val, feedbackHost, submit);
    });

    announce("Commenting on: " + phrase);
    focusEl(input);
  }

  function requestFeedback(ctx, cue, phrase, comment, host, submitBtn) {
    clear(host);
    submitBtn.disabled = true;

    var pending = el("p", { "class": "coach-status" }, [
      el("span", null, ctx.phase.person + "'s coach is reading your note"),
      el("span", { "class": "dots", "aria-hidden": "true" }, [
        el("span", { "class": "dot" }), el("span", { "class": "dot" }), el("span", { "class": "dot" })
      ])
    ]);
    host.appendChild(pending);
    announce("Getting feedback on your note.");

    var payload = {
      person: ctx.phase.person, style: ctx.phase.style,
      cuePhrase: phrase, cueSignal: cue.signal || "", objective: CONTENT.objective || "",
      comment: comment
    };

    Coach.getFeedback(payload).then(function (result) {
      submitBtn.disabled = false;
      clear(host);
      if (result) renderAiFeedback(host, result);
      else renderStaticFeedback(host, cue);
      revealReply(ctx);
      focusEl(host.querySelector(".feedback"));
    });
  }

  function renderAiFeedback(host, result) {
    var map = {
      on_track: { cls: "result--good", icon: "✓", label: "On track" },
      partial: { cls: "result--review", icon: "◑", label: "Partly there" },
      reconsider: { cls: "result--review", icon: "↻", label: "Worth another look" }
    };
    var m = map[result.assessment] || map.partial;
    var panel = el("div", { "class": "feedback", tabindex: "-1" }, [
      el("h3", { "class": "sr-only" }, "Feedback on your note"),
      el("p", { "class": "result " + m.cls }, [
        el("span", { "class": "result__icon", "aria-hidden": "true" }, m.icon),
        el("span", null, " " + m.label)
      ]),
      textP(result.feedback, "feedback__text"),
      el("span", { "class": "coach__source" }, "AI coach")
    ]);
    host.appendChild(panel);
    announce(m.label + ". " + result.feedback);
  }

  function renderStaticFeedback(host, cue) {
    var panel = el("div", { "class": "feedback", tabindex: "-1" }, [
      el("h3", { "class": "sr-only" }, "Feedback on your note"),
      el("p", { "class": "result result--good" }, [
        el("span", { "class": "result__icon", "aria-hidden": "true" }, "💬"),
        el("span", null, " Coach")
      ]),
      textP(cue.staticFeedback || "Good — you flagged a real cue in how this feedback is delivered.", "feedback__text"),
      el("span", { "class": "coach__source" }, "Offline tip")
    ]);
    host.appendChild(panel);
    announce("Coach: " + (cue.staticFeedback || ""));
  }

  /* ---- Reply step (kept mechanic: chips → bubble → reaction → coaching) ---- */
  function revealReply(ctx) {
    if (ctx.replyRendered) { show(ctx.replyArea, true); return; }
    ctx.replyRendered = true;
    var d = ctx.phase.reply;
    var promptId = "reply-prompt-" + ctx.phase.id;
    var chips = el("ul", { "class": "chips" });
    var group = el("div", { "class": "reply", role: "group", "aria-labelledby": promptId }, [
      el("p", { "class": "prompt", id: promptId }, d.prompt), chips
    ]);
    var actions = el("div", { "class": "step-actions" });
    append(ctx.replyArea, [
      el("p", { "class": "kicker kicker--step" }, "Step 2 of 2 · Replying to " + ctx.phase.person),
      el("h3", { "class": "step-title" }, "Reply to " + ctx.phase.person),
      group, actions
    ]);
    show(ctx.replyArea, true);

    d.choices.forEach(function (c) {
      var btn = el("button", { type: "button", "class": "chip", "data-key": c.key }, c.text);
      btn.addEventListener("click", function () { handleReply(ctx, c, chips, actions, group); });
      chips.appendChild(el("li", null, btn));
    });
  }

  function handleReply(ctx, c, chips, actions, group) {
    var phaseId = ctx.phase.id;
    appendLearnerBubble(c.sent || c.text, phaseId);
    setChipsDisabled(chips, true);

    if (reducedMotion()) finish();
    else {
      var typing = appendTyping(ctx.phase.person, phaseId);
      window.setTimeout(function () { removeNode(typing); finish(); }, 700);
    }

    function finish() {
      var bubble = appendReaction(ctx.phase.person, ctx.phase.reply.reactions[c.key], phaseId);
      appendCoach(ctx.phase.reply.feedback[c.key], phaseId);
      announce(ctx.phase.person + " replied.");
      focusEl(bubble);
      if (c.aligned) {
        state.completed[phaseId] = true;
        state.finalReply[phaseId] = c.key;
        save();
        show(group, false);
        clear(actions);
        var cont = el("button", { type: "button", "class": "btn btn--primary" },
          NEXT[phaseId] === "debrief" ? "See your debrief →" : "Next: Alex →");
        cont.addEventListener("click", function () { goToStep(NEXT[phaseId]); });
        actions.appendChild(cont);
      } else {
        setChipsDisabled(chips, false);
      }
    }
  }

  function setChipsDisabled(chips, disabled) {
    var btns = chips.querySelectorAll("button");
    for (var i = 0; i < btns.length; i++) btns[i].disabled = disabled;
  }

  /* =========================================================================
   * Thread bubbles (tagged with the phase so the other phase can be hidden)
   * =======================================================================*/
  function tag(node, phaseId) { node.classList.add("appended"); node.setAttribute("data-phase", phaseId); return node; }
  function avatarFor(person) {
    return el("span", { "class": "avatar avatar--" + person.toLowerCase(), "aria-hidden": "true" }, person.charAt(0));
  }
  function appendLearnerBubble(text, phaseId) {
    var li = el("li", { "class": "msg msg--me" }, [
      el("div", { "class": "bubble" }, [el("p", { "class": "msg__name" }, "You"), textP(text, "msg__text")])
    ]);
    dom.thread.appendChild(tag(li, phaseId));
    return li;
  }
  function appendReaction(person, text, phaseId) {
    var bubble = el("div", { "class": "bubble", tabindex: "-1" }, [
      el("p", { "class": "msg__name" }, person), textP(text, "msg__text")
    ]);
    var li = el("li", { "class": "msg msg--them", "data-from": person }, [avatarFor(person), bubble]);
    dom.thread.appendChild(tag(li, phaseId));
    return bubble;
  }
  function appendTyping(person, phaseId) {
    var dots = el("span", { "class": "dots", "aria-hidden": "true" }, [
      el("span", { "class": "dot" }), el("span", { "class": "dot" }), el("span", { "class": "dot" })
    ]);
    var li = el("li", { "class": "msg msg--them typing", "aria-hidden": "true" }, [
      avatarFor(person),
      el("div", { "class": "bubble" }, [el("span", { "class": "typing__label" }, person + " is typing"), dots])
    ]);
    dom.thread.appendChild(tag(li, phaseId));
    return li;
  }
  function appendCoach(text, phaseId) {
    var li = el("li", { "class": "coach" }, [el("p", { "class": "coach__tag" }, "Coach"), textP(text, "coach__text")]);
    dom.thread.appendChild(tag(li, phaseId));
    return li;
  }
  function removeNode(node) { if (node && node.parentNode) node.parentNode.removeChild(node); }

  /* =========================================================================
   * Debrief + personalised recap (session memory only — change 3)
   * =======================================================================*/
  function renderDebrief() {
    clear(dom.recap);
    clear(dom.debriefActions);

    var items = [];
    CONTENT.phases.forEach(function (phase) {
      var notes = phase.cues
        .filter(function (cue) { return state.annotations[cue.id]; })
        .map(function (cue) { return state.annotations[cue.id]; });
      notes.forEach(function (note) {
        items.push(recapItem("Your read of " + phase.person + " — “" + note.phrase + "”", note.comment, true));
      });
      var key = state.finalReply[phase.id];
      if (state.completed[phase.id] && key) {
        var choice = findChoice(phase, key);
        if (choice) items.push(recapItem("Your reply to " + phase.person, choice.sent || choice.text, true));
      }
    });

    if (items.length) {
      append(dom.recap, [
        el("h3", { "class": "recap__title" }, "How you read the room"),
        el("ul", { "class": "recap__list" }, items)
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

  function findChoice(phase, key) {
    for (var i = 0; i < phase.reply.choices.length; i++) if (phase.reply.choices[i].key === key) return phase.reply.choices[i];
    return null;
  }
  function recapItem(label, value, quote) {
    var valueNode = quote ? el("blockquote", { "class": "recap__quote" }) : el("span", { "class": "recap__value" });
    valueNode.textContent = value; // escape learner text (B-33)
    return el("li", { "class": "recap__item" }, [el("span", { "class": "recap__label" }, label), valueNode]);
  }

  /* =========================================================================
   * Reset (used by the debrief "Run it again"; the header "Start over" reloads)
   * =======================================================================*/
  function resetSession() {
    state.completed = { sam: false, alex: false };
    state.finalReply = {};
    state.annotations = {};
    state.step = "intro";
    // Remove appended reply bubbles; reset cue buttons.
    var appended = dom.thread.querySelectorAll(".appended");
    Array.prototype.forEach.call(appended, removeNode);
    var cues = document.querySelectorAll("button.cue");
    Array.prototype.forEach.call(cues, function (b) {
      b.setAttribute("aria-pressed", "false");
      b.classList.remove("is-annotated");
    });
  }

  /* =========================================================================
   * Init — upgrade cue marks to buttons, set up the enhanced view
   * =======================================================================*/
  function revealAll() {
    show(dom.intro, true); show(dom.channel, true); show(dom.debrief, true);
    show(dom.msgSam, true); show(dom.msgAlex, true);
  }

  function upgradeCues() {
    var marks = document.querySelectorAll("mark.cue");
    Array.prototype.forEach.call(marks, function (mark) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cue";
      btn.setAttribute("data-cue", mark.getAttribute("data-cue"));
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = mark.textContent;
      mark.parentNode.replaceChild(btn, mark);
    });
  }

  function init() {
    dom.srLive = document.getElementById("sr-live");
    dom.intro = document.getElementById("intro");
    dom.introActions = document.getElementById("intro-actions");
    dom.phaseIntro = document.getElementById("phase-intro");
    dom.channel = document.getElementById("channel");
    dom.thread = document.getElementById("thread");
    dom.msgSam = document.getElementById("msg-sam");
    dom.msgAlex = document.getElementById("msg-alex");
    dom.practice = document.getElementById("practice");
    dom.replyCard = document.getElementById("reply-card");
    dom.debrief = document.getElementById("debrief");
    dom.recap = document.getElementById("recap");
    dom.debriefActions = document.getElementById("debrief-actions");

    if (!CONTENT || !CONTENT.phases || !dom.practice || !dom.thread) { revealAll(); return; }

    CONTENT.phases.forEach(function (p) {
      phasesById[p.id] = p;
      p.cues.forEach(function (c) { cuesById[c.id] = c; });
    });
    originalThreadCount = dom.thread.children.length;

    upgradeCues();

    // Enhanced view: hide channel/debrief until needed (without JS, all stayed visible — B-32).
    show(dom.channel, false);
    show(dom.debrief, false);

    var saved = Storage.loadProgress();
    if (saved && (saved.step === "alex" || saved.step === "debrief")) {
      goToStep("intro", { focus: false });
      renderResumeBanner(saved);
    } else {
      goToStep("intro", { focus: false });
    }
  }

  try {
    init();
  } catch (e) {
    if (window.console && console.error) console.error("Module init failed:", e);
    try { revealAll(); } catch (e2) {}
  }
})();

/*
 * coach.js — AI feedback client, behind a small swappable interface (like storage.js).
 *
 * This is the ONLY place the page talks to the feedback endpoint. The endpoint is the
 * author's serverless proxy (api/feedback) which holds the Anthropic key — the key is never
 * in the page (B-38). The learner's comment is sent in the POST body over HTTPS, never in a
 * URL/query string (B-38).
 *
 * The AI is a progressive enhancement (B-35): getFeedback() resolves to null on ANY problem —
 * no endpoint configured, offline, opened from file://, timeout, non-200, or a malformed
 * response — so the caller (app.js) falls back to the cue's static feedback and never dead-ends
 * (B-33). It throws nothing.
 */
(function () {
  "use strict";

  var TIMEOUT_MS = 15000;
  var MAX_COMMENT = 500;

  function endpoint() {
    var cfg = window.MODULE_CONFIG || {};
    return typeof cfg.feedbackEndpoint === "string" ? cfg.feedbackEndpoint.trim() : "";
  }

  function isEnabled() {
    return endpoint() !== "" && typeof window.fetch === "function";
  }

  /* payload: { person, style, cuePhrase, cueSignal, objective, comment } */
  function getFeedback(payload) {
    if (!isEnabled()) return Promise.resolve(null);

    var url = endpoint();
    var body;
    try {
      body = JSON.stringify({
        person: String(payload.person || ""),
        style: String(payload.style || ""),
        cuePhrase: String(payload.cuePhrase || ""),
        cueSignal: String(payload.cueSignal || ""),
        objective: String(payload.objective || ""),
        comment: String(payload.comment || "").slice(0, MAX_COMMENT)
      });
    } catch (e) {
      return Promise.resolve(null);
    }

    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;

    return window
      .fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        signal: controller ? controller.signal : undefined
      })
      .then(function (res) {
        if (!res || !res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data.feedback !== "string" || !data.feedback.trim()) return null;
        var assessment = data.assessment;
        if (assessment !== "on_track" && assessment !== "partial" && assessment !== "reconsider") {
          assessment = "partial";
        }
        return { assessment: assessment, feedback: data.feedback.trim() };
      })
      .catch(function () {
        return null; // network error, abort/timeout, bad JSON — fall back to static feedback
      })
      .then(function (result) {
        if (timer) window.clearTimeout(timer);
        return result;
      });
  }

  window.MLCoach = {
    isEnabled: isEnabled,
    getFeedback: getFeedback
  };
})();

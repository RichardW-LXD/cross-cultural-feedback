/*
 * storage.js — Progress persistence behind a small, swappable interface (B-21).
 *
 * This is the ONLY place that touches a concrete storage mechanism. The learning logic
 * in app.js calls saveProgress / loadProgress / clearProgress and never references
 * localStorage directly, so the mechanism can be replaced (an LMS, a back-end) without
 * touching learning logic.
 *
 * Degrades gracefully (B-20): if storage is unavailable, blocked (private mode, sandboxed
 * iframe), full, or corrupt, every call returns a safe value and the module runs as a
 * fresh, completable session — no thrown errors, no dead end.
 *
 * Privacy (B-22, B-36): only non-sensitive progress markers are persisted — the current
 * step, which decisions are complete, and the chosen-choice keys. The learner's free-text
 * self-explanation is deliberately NOT persisted; it lives in memory for the session only.
 */
(function () {
  "use strict";

  var KEY = "ccf-progress-v1";

  /* Feature-detect writable storage without throwing. Some browsers expose
     localStorage but throw on setItem (Safari private mode, sandboxed iframes). */
  function available() {
    try {
      var t = "__ccf_probe__";
      window.localStorage.setItem(t, "1");
      window.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveProgress(state) {
    if (!available()) return false;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false; // e.g. quota exceeded — non-fatal
    }
  }

  function loadProgress() {
    if (!available()) return null;
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null; // corrupt value — treat as no saved progress
    }
  }

  function clearProgress() {
    if (!available()) return;
    try {
      window.localStorage.removeItem(KEY);
    } catch (e) {
      /* ignore */
    }
  }

  window.MLStorage = {
    saveProgress: saveProgress,
    loadProgress: loadProgress,
    clearProgress: clearProgress
  };
})();

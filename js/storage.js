/*
 * storage.js — Persistence behind a small, swappable interface (B-21).
 *
 * This is the ONLY place that touches a concrete storage mechanism at runtime. The
 * learning logic in app.js (and the theme toggle in theme.js) call these helpers and
 * never reference localStorage directly, so the mechanism can be replaced (an LMS, a
 * back-end) without touching feature logic.
 *
 * Degrades gracefully (B-20): if storage is unavailable, blocked (private mode, sandboxed
 * iframe), full, or corrupt, every call returns a safe value and the module runs as a
 * fresh, completable session — no thrown errors, no dead end.
 *
 * Privacy (B-22, B-36): only non-sensitive markers are persisted — progress (current step,
 * which decisions are complete, chosen-choice keys) and the theme preference. The learner's
 * free-text self-explanation is deliberately NOT persisted; it lives in memory only.
 *
 * NOTE: the theme key below ("ccf-theme") is also read by a tiny inline <head> script in
 * index.html for first-paint theming (the one place that must run before this file loads).
 * Keep the two in sync.
 */
(function () {
  "use strict";

  var KEY = "ccf-progress-v1";
  var THEME_KEY = "ccf-theme";

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

  /* Theme preference (a non-sensitive UI setting). */
  function saveTheme(theme) {
    if (theme !== "light" && theme !== "dark") return false;
    if (!available()) return false;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadTheme() {
    if (!available()) return null;
    try {
      var v = window.localStorage.getItem(THEME_KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;
    }
  }

  window.MLStorage = {
    saveProgress: saveProgress,
    loadProgress: loadProgress,
    clearProgress: clearProgress,
    saveTheme: saveTheme,
    loadTheme: loadTheme
  };
})();

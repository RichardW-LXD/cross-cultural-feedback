/*
 * theme.js — Light/dark theme toggle (an enhancement over the no-JS light default).
 *
 * Initial theme is set on <html data-theme> by a tiny inline <head> script in index.html
 * (saved preference, else OS preference) so there is no flash of the wrong theme (FOUC).
 * This module injects the visible switch, reflects the current state, persists the choice
 * via the storage interface (B-21), and announces the change.
 *
 * Accessibility: a real <button role="switch"> with an accessible name ("Dark mode") and
 * aria-checked; fully keyboard-operable with a visible focus ring (B-1, B-2, B-3); state is
 * shown by knob position + a sun/moon glyph, never colour alone (B-5); target ≥ 44px (B-8).
 * Without JS the page stays on the readable light default (B-32).
 */
(function () {
  "use strict";

  var Storage = window.MLStorage || { saveTheme: function () { return false; } };
  var root = document.documentElement;
  var sw = null, knobIcon = null;

  function current() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function reflect(theme) {
    if (!sw) return;
    sw.setAttribute("aria-checked", theme === "dark" ? "true" : "false");
    if (knobIcon) knobIcon.textContent = theme === "dark" ? "☾" : "☀";
  }

  function setTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    reflect(theme);
    if (persist) Storage.saveTheme(theme);
  }

  function announce(msg) {
    var live = document.getElementById("sr-live");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = msg; }, 30);
  }

  function buildSwitch() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    sw = document.createElement("button");
    sw.type = "button";
    sw.className = "theme-switch";
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-checked", current() === "dark" ? "true" : "false");

    var label = document.createElement("span");
    label.className = "theme-switch__label";
    label.textContent = "Dark mode";

    var track = document.createElement("span");
    track.className = "theme-switch__track";
    track.setAttribute("aria-hidden", "true"); // decorative; meaning is in the name + state

    var knob = document.createElement("span");
    knob.className = "theme-switch__knob";
    knobIcon = document.createElement("span");
    knobIcon.className = "theme-switch__icon";
    knobIcon.textContent = current() === "dark" ? "☾" : "☀";
    knob.appendChild(knobIcon);
    track.appendChild(knob);

    sw.appendChild(label);
    sw.appendChild(track);

    sw.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      setTheme(next, true);
      announce(next === "dark" ? "Dark mode on" : "Dark mode off");
    });

    header.appendChild(sw);
  }

  try {
    buildSwitch();
  } catch (e) {
    if (window.console && console.error) console.error("Theme toggle failed:", e);
  }
})();

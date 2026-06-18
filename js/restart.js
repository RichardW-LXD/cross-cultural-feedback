/*
 * restart.js — a persistent "Start over" control in the header, present on every step.
 *
 * Clears saved progress through the storage interface (B-21) and reloads to the beginning;
 * a reload guarantees a clean reset of the engine's state and the thread DOM without reaching
 * into app.js internals. The theme preference is kept (it lives under a separate key and the
 * inline <head> script re-applies it before paint).
 *
 * It's an enhancement: injected by JS, so there's no dead control without scripting (B-32).
 * A real <button> with a text label — keyboard-operable, visible focus, ≥44px target (B-1/2/3/8).
 */
(function () {
  "use strict";

  var Storage = window.MLStorage || { clearProgress: function () {} };

  function buildButton() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "restart-btn";

    var icon = document.createElement("span");
    icon.className = "restart-btn__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "↺"; // ↺

    var label = document.createElement("span");
    label.textContent = "Start over";

    btn.appendChild(icon);
    btn.appendChild(label);

    btn.addEventListener("click", function () {
      try { Storage.clearProgress(); } catch (e) { /* non-fatal */ }
      try { window.location.reload(); } catch (e) { /* non-fatal */ }
    });

    header.appendChild(btn);
  }

  try {
    buildButton();
  } catch (e) {
    if (window.console && console.error) console.error("Restart control failed:", e);
  }
})();

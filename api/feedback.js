/*
 * api/feedback.js — serverless proxy that turns a learner's highlighted-cue comment into short
 * coaching feedback via Claude Sonnet 4.6. This is the ONLY place the Anthropic API key is used;
 * it lives in the server environment (ANTHROPIC_API_KEY), never in the page (B-38).
 *
 * Reference implementation: Vercel / Next.js API route style — `export default (req, res)`.
 * (Netlify Functions and Cloudflare Workers adaptations are noted at the bottom.)
 *
 * Contract (matches js/coach.js):
 *   POST JSON { person, style, cuePhrase, cueSignal, objective, comment }
 *   200  -> { assessment: "on_track"|"partial"|"reconsider", feedback: string }
 *   4xx/5xx -> the client ignores the body and falls back to the cue's static feedback (B-35/B-33)
 *
 * Privacy: the comment is processed in-request and NOT logged or persisted (B-36).
 */
const Anthropic = require("@anthropic-ai/sdk");

const MODEL = "claude-sonnet-4-6";
const MAX_COMMENT = 500;

// Lock CORS to your site's origin in production (set ALLOWED_ORIGIN). "*" is the permissive default.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const SYSTEM_PROMPT = [
  "You are a brief, encouraging coach inside a micro-learning module that teaches people to read",
  "DIRECT vs INDIRECT feedback styles on global teams — to separate how feedback is DELIVERED",
  "(style) from the INTENT behind it, and to respond to the substance without escalating.",
  "",
  "A learner has highlighted one phrase from a teammate's message and written their reasoning about",
  "what that phrase tells them. Evaluate THE LEARNER'S REASONING about that phrase.",
  "",
  "Reply in 2-3 short sentences, second person, specific to what they wrote and to this phrase:",
  "- If they're on track, affirm and sharpen it by naming the concrete cue (an upgrader or",
  "  downgrader, cushioning, how specific/actionable the point is, whether the ask is spelled out).",
  "- If they're partly right or off, gently redirect toward the observable cue and the",
  "  style-vs-intent distinction.",
  "",
  "Hard rules: Stay strictly on reading feedback style/cues and responding to substance. NEVER infer",
  "or mention anyone's nationality, culture, or origin — read behaviour, not background. Be concrete,",
  "not generic or flattering. No preamble; no headings.",
  "",
  "Return ONLY the JSON object the schema defines: an `assessment` of on_track | partial | reconsider,",
  "and `feedback` (your 2-3 sentences)."
].join("\n");

const SCHEMA = {
  type: "object",
  properties: {
    assessment: { type: "string", enum: ["on_track", "partial", "reconsider"] },
    feedback: { type: "string" }
  },
  required: ["assessment", "feedback"],
  additionalProperties: false
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch (e) {
    return res.status(400).json({ error: "invalid_json" });
  }

  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, MAX_COMMENT) : "";
  if (!comment) return res.status(400).json({ error: "missing_comment" });

  if (!process.env.ANTHROPIC_API_KEY) {
    // Misconfigured server — the client will fall back to static feedback.
    return res.status(503).json({ error: "coach_unconfigured" });
  }

  const userMessage =
    "Teammate: " + (body.person || "a teammate") + " (a " + (body.style || "—") + " communicator).\n" +
    'Highlighted phrase: "' + (body.cuePhrase || "") + '".\n' +
    "What that phrase signals: " + (body.cueSignal || "") + "\n" +
    "Module objective: " + (body.objective || "") + "\n\n" +
    "The learner's reasoning about this phrase:\n" +
    '"' + comment + '"\n\n' +
    "Evaluate the learner's reasoning per your rules.";

  try {
    const client = new Anthropic({ timeout: 14000, maxRetries: 1 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      thinking: { type: "disabled" },        // short, snappy coaching — no thinking needed
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }]
    });

    if (response.stop_reason === "refusal") {
      return res.status(502).json({ error: "refused" });
    }

    const textBlock = (response.content || []).find(function (b) { return b.type === "text"; });
    if (!textBlock) return res.status(502).json({ error: "empty_response" });

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch (e) {
      return res.status(502).json({ error: "unparseable_response" });
    }
    if (!parsed || typeof parsed.feedback !== "string") {
      return res.status(502).json({ error: "bad_shape" });
    }

    return res.status(200).json({
      assessment: parsed.assessment === "on_track" || parsed.assessment === "reconsider"
        ? parsed.assessment
        : "partial",
      feedback: parsed.feedback.trim()
    });
  } catch (err) {
    // Rate limit, overload, timeout, network — return non-200 so the client uses static feedback.
    // Do not log the learner's comment (B-36); log only the error type.
    if (typeof console !== "undefined" && console.error) {
      console.error("feedback proxy error:", (err && err.name) || "unknown");
    }
    return res.status(502).json({ error: "coach_unavailable" });
  }
};

/*
 * ── Adapting to other platforms ─────────────────────────────────────────────────────────────
 *
 * Netlify Functions (CommonJS): export `exports.handler = async (event) => ({ statusCode, body })`.
 *   Read `JSON.parse(event.body)`, return `{ statusCode: 200, headers, body: JSON.stringify(...) }`.
 *
 * Cloudflare Workers (module syntax): `export default { async fetch(request, env) {...} }`.
 *   Use the global `fetch` against https://api.anthropic.com/v1/messages with headers
 *   `x-api-key: env.ANTHROPIC_API_KEY`, `anthropic-version: 2023-06-01`, the same JSON body, and
 *   return a `Response`. (The SDK also runs on Workers, but raw fetch keeps the bundle tiny.)
 *
 * The browser client (js/coach.js) is endpoint-agnostic — only the request/response contract above
 * matters, so any of these work without touching the page.
 */

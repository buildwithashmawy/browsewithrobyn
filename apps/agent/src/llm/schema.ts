import { z } from "zod";
import type OpenAI from "openai";

type Tool = OpenAI.Chat.Completions.ChatCompletionTool;

// ── Zod validators (every LLM tool response is validated before use) ─────────
const ActionShape = z.object({
  kind: z.enum(["navigate", "type", "click", "extract", "wait", "verify", "ask", "done", "fail"]),
  target_description: z.string(),
  selector_strategy: z
    .object({
      method: z.enum(["role", "label", "text", "placeholder", "testid", "css", "url"]),
      role: z.string().optional(),
      name: z.string().optional(),
      value: z.string().optional(),
    })
    .optional(),
  value: z.string().optional(),
  submit: z.boolean().optional(),
  reasoning: z.string(),
  expected_outcome: z.string(),
  extracted: z.record(z.string(), z.unknown()).nullable().optional(),
});

// Be lenient about common model quirks so one odd response can't kill a run:
// coerce a string selector_strategy into an object, and fill missing optionals.
export const ActionSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const r = { ...(raw as Record<string, unknown>) };
  if (typeof r.selector_strategy === "string") {
    const s = r.selector_strategy.trim();
    r.selector_strategy = /^https?:\/\//i.test(s)
      ? { method: "url", value: s }
      : { method: "css", value: s };
  }
  if (r.target_description == null) r.target_description = String(r.kind ?? "step");
  if (r.reasoning == null) r.reasoning = "";
  if (r.expected_outcome == null) r.expected_outcome = "";
  return r;
}, ActionShape);

export type AgentAction = z.infer<typeof ActionShape>;

export const SelfCheckSchema = z.object({
  achieved: z.boolean(),
  evidence: z.string(),
  next_hint: z.string().optional(),
});
export type SelfCheckResult = z.infer<typeof SelfCheckSchema>;

export const StartPlanSchema = z.object({
  intro: z.string(),
  plan: z.array(z.string()),
});
export type StartPlan = z.infer<typeof StartPlanSchema>;

export const ResultRowSchema = z.object({
  icon: z.string(),
  k: z.string(),
  v: z.string(),
  note: z.string().optional(),
  mono: z.boolean().optional(),
});
export const FinalReportSchema = z.object({
  summary: z.string(),
  result: z.object({
    title: z.string(),
    sub: z.string(),
    rows: z.array(ResultRowSchema).max(6),
  }),
});
export type FinalReport = z.infer<typeof FinalReportSchema>;

// ── OpenRouter tool definitions (OpenAI function-calling format) ──────────────
export const browserActionTool: Tool = {
  type: "function",
  function: {
    name: "browser_action",
    description: "Emit exactly ONE next browser action toward the goal.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["kind", "target_description", "reasoning", "expected_outcome"],
      properties: {
        kind: {
          type: "string",
          enum: ["navigate", "type", "click", "extract", "wait", "verify", "ask", "done", "fail"],
        },
        target_description: {
          type: "string",
          description: "Short action label for the UI (e.g. 'Opening the first result').",
        },
        selector_strategy: {
          type: "object",
          additionalProperties: false,
          properties: {
            method: {
              type: "string",
              enum: ["role", "label", "text", "placeholder", "testid", "css", "url"],
            },
            role: { type: "string", description: "ARIA role, e.g. button, link, textbox" },
            name: { type: "string", description: "Accessible name / visible text" },
            value: { type: "string", description: "CSS selector, testid, or URL when method needs it" },
          },
        },
        value: { type: "string", description: "Text to type, or full URL for navigate" },
        submit: { type: "boolean", description: "For type: press Enter after typing" },
        reasoning: { type: "string" },
        expected_outcome: { type: "string", description: "What should be true after this action" },
        extracted: {
          type: ["object", "null"],
          description: "Data read from the page (for extract/done)",
        },
      },
    },
  },
};

export const selfCheckTool: Tool = {
  type: "function",
  function: {
    name: "self_check",
    description: "Report whether the last action achieved its expected outcome.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["achieved", "evidence"],
      properties: {
        achieved: { type: "boolean" },
        evidence: { type: "string", description: "Brief, concrete evidence from the page" },
        next_hint: { type: "string", description: "If not achieved, what to try next" },
      },
    },
  },
};

export const startPlanTool: Tool = {
  type: "function",
  function: {
    name: "start_plan",
    description: "Introduce the task to the user and outline a short plan.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["intro", "plan"],
      properties: {
        intro: { type: "string", description: "One friendly first-person sentence; may include <b>…</b>" },
        plan: { type: "array", items: { type: "string" }, description: "3–6 short high-level steps" },
      },
    },
  },
};

export const finalReportTool: Tool = {
  type: "function",
  function: {
    name: "final_report",
    description: "Summarize the completed task and build the result card.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "result"],
      properties: {
        summary: { type: "string", description: "1–2 sentences, first person; may include <b>…</b>" },
        result: {
          type: "object",
          additionalProperties: false,
          required: ["title", "sub", "rows"],
          properties: {
            title: { type: "string" },
            sub: { type: "string" },
            rows: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["icon", "k", "v"],
                properties: {
                  icon: { type: "string" },
                  k: { type: "string" },
                  v: { type: "string" },
                  note: { type: "string" },
                  mono: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
  },
};

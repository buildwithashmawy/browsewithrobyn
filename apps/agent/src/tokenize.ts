import type { AgentAction } from "./llm/schema";

// Escape text before it goes into the `thought` HTML (rendered via
// dangerouslySetInnerHTML). Only our own <span class="tk*"> wrappers are HTML;
// every interpolated value is escaped first.
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trim(s: string, n: number): string {
  s = (s ?? "").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function buildLabel(action: AgentAction): string {
  return trim(action.target_description || action.kind, 80);
}

function selectorString(action: AgentAction): string {
  const ss = action.selector_strategy;
  if (!ss) return action.target_description;
  switch (ss.method) {
    case "role":
      return `role=${ss.role ?? "?"}${ss.name ? `[name="${ss.name}"]` : ""}`;
    case "label":
      return `label="${ss.name ?? ss.value ?? ""}"`;
    case "text":
      return `text="${ss.name ?? ss.value ?? ""}"`;
    case "placeholder":
      return `placeholder="${ss.value ?? ss.name ?? ""}"`;
    case "testid":
      return `[data-testid="${ss.value ?? ss.name ?? ""}"]`;
    case "css":
      return ss.value ?? "";
    case "url":
      return ss.value ?? action.value ?? "";
    default:
      return action.target_description;
  }
}

const tk = (cls: string, s: string) => `<span class="${cls}">${esc(s)}</span>`;

// Build the mono "thought" detail (1–2 lines) with colored token spans,
// matching the design's tk / tk-accent / tk-amber / tk-ok classes.
export function buildThought(action: AgentAction): string {
  const sel = selectorString(action);
  let head: string;
  switch (action.kind) {
    case "navigate":
      head = `${tk("tk-accent", "GET")} ${esc(action.value ?? sel)}`;
      break;
    case "type":
      head = `type → "${tk("tk-accent", action.value ?? "")}"\ninto ${tk("tk", sel)}${
        action.submit ? `\n${tk("tk-accent", "Enter")} ↵` : ""
      }`;
      break;
    case "click":
      head = `click ${tk("tk", sel)}`;
      break;
    case "wait":
      head = `await ${tk("tk", "networkidle")} · ${tk("tk", sel)}`;
      break;
    case "extract": {
      const data = action.extracted ? trim(JSON.stringify(action.extracted), 120) : "(reading page)";
      head = `extract → ${tk("tk-ok", data)}`;
      break;
    }
    case "verify":
      head = `verify → ${tk("tk-ok", trim(action.expected_outcome, 80))}`;
      break;
    default:
      head = esc(sel);
  }
  const reason = trim(action.reasoning, 96);
  return reason ? `${head}\n${esc(reason)}` : head;
}

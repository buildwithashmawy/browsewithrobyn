import type { Locator, Page } from "playwright";
import type { AgentAction } from "./llm/schema";

function normalizeUrl(u: string): string {
  if (!u) return "about:blank";
  if (/^https?:\/\//i.test(u)) return u;
  return "https://" + u.replace(/^\/+/, "");
}

type Role = Parameters<Page["getByRole"]>[0];

// Accessibility-first selector ladder: role → label → text → placeholder → testid → css.
export function resolveLocator(page: Page, action: AgentAction): Locator | null {
  const ss = action.selector_strategy;
  const desc = action.target_description;
  if (!ss || ss.method === "url") {
    return action.kind === "navigate" ? null : page.getByText(desc, { exact: false }).first();
  }
  switch (ss.method) {
    case "role": {
      const role = (ss.role || "button") as Role;
      return ss.name
        ? page.getByRole(role, { name: ss.name }).first()
        : page.getByRole(role).first();
    }
    case "label":
      return page.getByLabel(ss.name ?? ss.value ?? desc).first();
    case "text":
      return page.getByText(ss.name ?? ss.value ?? desc, { exact: false }).first();
    case "placeholder":
      return page.getByPlaceholder(ss.value ?? ss.name ?? desc).first();
    case "testid":
      return page.getByTestId(ss.value ?? ss.name ?? "").first();
    case "css":
      return ss.value ? page.locator(ss.value).first() : null;
    default:
      return null;
  }
}

export async function act(page: Page, action: AgentAction, loc: Locator | null) {
  switch (action.kind) {
    case "navigate": {
      const url = normalizeUrl(action.value ?? action.selector_strategy?.value ?? "");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      break;
    }
    case "type": {
      if (!loc) throw new Error("no element resolved to type into");
      await loc.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
      await loc.fill(action.value ?? "", { timeout: 8000 });
      if (action.submit) await loc.press("Enter");
      break;
    }
    case "click": {
      if (!loc) throw new Error("no element resolved to click");
      await loc.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {});
      await loc.click({ timeout: 8000 });
      break;
    }
    case "wait": {
      await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
      if (loc) await loc.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
      break;
    }
    case "extract":
    case "verify":
      // observation-only — the loop re-observes and self-checks
      break;
  }
}

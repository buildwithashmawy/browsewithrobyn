// Key-less smoke test: drives a REAL browser through Convex without the LLM, to
// verify the screenshot → Convex storage → live UI → highlight-overlay path and
// the deviceScaleFactor=1 coordinate assumption against a real screenshot.
//
//   HEADLESS=1 pnpm --filter agent exec tsx src/smoke.ts
//
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import type { Id } from "../../../convex/_generated/dataModel";
import { config } from "./config";

const api = anyApi;
import { ConvexWriter } from "./convex";
import { BrowserController } from "./browser/controller";

async function main() {
  const client = new ConvexHttpClient(config.convexUrl);
  const writer = new ConvexWriter();

  const sessionId = (await client.mutation(api.sessions.create, {
    prompt: "Smoke: open example.com",
    model: "smoke/none",
  })) as Id<"sessions">;
  console.log("SESSION_ID=" + sessionId);

  await writer.patchSession(sessionId, {
    status: "thinking",
    intro:
      "Smoke test — opening <b>example.com</b> to verify the live screenshot and highlight overlay.",
  });

  const browser = new BrowserController();
  await browser.launch(sessionId, 0.95); // simulate a desktop panel aspect

  // step 0: navigate (frame, no highlight)
  const s0 = await writer.appendStep({
    sessionId,
    index: 0,
    kind: "navigate",
    label: "Navigating to example.com",
    thought: '<span class="tk-accent">GET</span> https://example.com\n<span class="tk-ok">200 OK</span>',
    status: "running",
  });
  await browser.page.goto("https://example.com", { waitUntil: "domcontentloaded" });
  await browser.settle();
  await writer.addFrame({
    sessionId,
    stepIndex: 0,
    screenshot: await browser.screenshot(),
    url: browser.urlParts(),
    viewportW: browser.vw,
    viewportH: browser.vh,
  });
  await writer.setStep(s0, "success");

  // step 1: highlight the "More information" link (frame WITH highlightRect)
  await writer.patchSession(sessionId, { status: "acting" });
  await writer.appendStep({
    sessionId,
    index: 1,
    kind: "click",
    label: "Highlighting the link",
    thought: 'click <span class="tk">role=link[name="More information..."]</span>',
    status: "running",
  });
  const link = browser.page.getByRole("link").first();
  await link.scrollIntoViewIfNeeded().catch(() => {});
  const r = await link.boundingBox();
  console.log("LINK_RECT=" + JSON.stringify(r));
  await writer.addFrame({
    sessionId,
    stepIndex: 1,
    screenshot: await browser.screenshot(),
    url: browser.urlParts(),
    highlightRect: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : undefined,
    viewportW: browser.vw,
    viewportH: browser.vh,
  });

  await browser.close();
  console.log("VIEW=http://localhost:3000/?s=" + sessionId);
  console.log("OK");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

import { chromium, type BrowserContext, type Page } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rm } from "node:fs/promises";
import { config } from "../config";

const USER_DATA_BASE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".pw-user-data",
);

const CONSENT =
  /^(accept all|accept|i agree|agree|got it|allow all|continue|ok|reject all)$/i;

// Owns a single headed, persistent Chromium context for one run.
export class BrowserController {
  private ctx?: BrowserContext;
  private dir?: string;
  page!: Page;
  vw = config.viewportW;
  vh = config.viewportH;

  async launch(sessionId: string, aspect?: number) {
    // unique profile per run → concurrent runs don't fight over one locked dir
    this.dir = join(USER_DATA_BASE, sessionId.replace(/[^a-z0-9]/gi, ""));
    // match the on-screen panel's aspect ratio (keeping a desktop width) so the feed
    // fills the browser window with no letterbox and no overflow
    this.vw = config.viewportW;
    this.vh =
      aspect && aspect > 0.4 && aspect < 3
        ? Math.max(700, Math.min(1700, Math.round(config.viewportW / aspect)))
        : config.viewportH;
    this.ctx = await chromium.launchPersistentContext(this.dir, {
      headless: config.headless,
      channel: config.pwChannel,
      viewport: { width: this.vw, height: this.vh },
      deviceScaleFactor: 1, // keep screenshot px == CSS px == boundingBox coords
      locale: "en-US",
      timezoneId: "America/Los_Angeles",
      userAgent: config.userAgent,
      extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });
    this.page = this.ctx.pages()[0] ?? (await this.ctx.newPage());
    this.page.setDefaultTimeout(12000);
    console.log(
      `[agent] viewport ${this.vw}×${this.vh}${aspect ? ` (aspect ${aspect.toFixed(2)})` : ""}`,
    );
  }

  async close() {
    try {
      await this.ctx?.close();
    } catch {
      /* ignore */
    }
    if (this.dir) await rm(this.dir, { recursive: true, force: true }).catch(() => {});
  }

  urlParts(): { host: string; path: string } {
    try {
      const u = new URL(this.page.url());
      if (u.protocol === "about:" || !u.host) return { host: "about:blank", path: "" };
      return { host: u.host, path: (u.pathname || "") + (u.search || "") };
    } catch {
      return { host: "about:blank", path: "" };
    }
  }

  async screenshot(): Promise<Buffer> {
    return this.page.screenshot({ type: "jpeg", quality: 72 }).catch(() => Buffer.alloc(0));
  }

  async settle() {
    await this.page.waitForLoadState("domcontentloaded").catch(() => {});
    await this.page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
  }

  async ariaSnapshot(): Promise<string> {
    try {
      const snap = await this.page.locator("body").ariaSnapshot();
      return snap.length > 6000 ? snap.slice(0, 6000) + "\n… (truncated)" : snap;
    } catch {
      return "(accessibility snapshot unavailable)";
    }
  }

  // Dismiss cookie/consent banners and obvious modals before acting.
  async dismissBanners() {
    for (const role of ["button", "link"] as const) {
      try {
        const b = this.page.getByRole(role, { name: CONSENT }).first();
        if (await b.count()) await b.click({ timeout: 1200 });
      } catch {
        /* ignore */
      }
    }
    try {
      const x = this.page
        .locator(
          '[aria-modal="true"] [aria-label*="close" i], [role="dialog"] [aria-label*="close" i]',
        )
        .first();
      if (await x.count()) await x.click({ timeout: 1000 });
    } catch {
      /* ignore */
    }
  }

  // Detect CAPTCHA / bot-walls so the loop can stop cleanly. Deliberately strict
  // (challenge iframes + page title only) to avoid false-positives on normal pages.
  async detectBotWall(): Promise<boolean> {
    try {
      const challenge = await this.page
        .locator(
          'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[title*="challenge" i], #challenge-running, #cf-challenge-running',
        )
        .count();
      if (challenge > 0) return true;
      const title = (await this.page.title().catch(() => "")).toLowerCase();
      return /just a moment|attention required|access denied|unusual traffic|are you a (human|robot)|verify you are human/.test(
        title,
      );
    } catch {
      return false;
    }
  }
}

import type { BrowserController } from "./controller";
import { hashObservation } from "../scratchpad";

export interface Observation {
  url: { host: string; path: string };
  aria: string;
  imageDataUrl: string;
  screenshot: Buffer;
  hash: string;
}

// Capture one observation: URL + accessibility tree + screenshot (for vision).
export async function observe(browser: BrowserController): Promise<Observation> {
  const url = browser.urlParts();
  const aria = await browser.ariaSnapshot();
  const screenshot = await browser.screenshot();
  const imageDataUrl = `data:image/jpeg;base64,${screenshot.toString("base64")}`;
  return {
    url,
    aria,
    imageDataUrl,
    screenshot,
    hash: hashObservation(url.host + url.path, aria),
  };
}

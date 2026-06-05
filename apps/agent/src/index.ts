import { config } from "./config";
import { startServer } from "./server";
import { runSession, stopRun, isRunning } from "./loop";

// Each run gets its own browser context (unique profile dir), so runs execute
// concurrently — start a new task while another is still working.
startServer({
  start: (id, aspect) => {
    if (isRunning(id)) {
      console.log(`[agent] ${id} already running — follow-up will be picked up by the loop`);
      return;
    }
    console.log(`[agent] start session ${id}`);
    runSession(id, aspect).catch((e) => console.error("[agent] run error:", e));
  },
  stop: (id) => {
    console.log(`[agent] stop session ${id}`);
    stopRun(id).catch((e) => console.error("[agent] stop error:", e));
  },
});

console.log(
  `[agent] Robyn ready · default model ${config.openrouterModel} · ` +
    (config.openrouterApiKey
      ? "OpenRouter key loaded"
      : "WARNING: OPENROUTER_API_KEY missing — runs will fail until you set it"),
);

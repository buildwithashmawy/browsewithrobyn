import { config, errMsg } from "./config";
import { ConvexWriter, type StepStatus } from "./convex";
import { BrowserController } from "./browser/controller";
import { observe } from "./browser/observer";
import { resolveLocator, act } from "./executor";
import { llm } from "./llm/client";
import { buildLabel, buildThought } from "./tokenize";
import { Scratchpad } from "./scratchpad";
import type { AgentAction } from "./llm/schema";

const THINKING_KINDS = new Set(["navigate", "wait", "extract", "verify"]);
// Only interaction steps get an explicit LLM self-check (keeps the loop fast);
// other steps are verified implicitly by the next turn's observation.
const SELF_CHECK_KINDS = new Set(["click", "type", "extract"]);

interface RunHandle {
  stopped: boolean;
}
const RUNS = new Map<string, RunHandle>();

export function stopRun(sessionId: string) {
  const h = RUNS.get(sessionId);
  if (h) h.stopped = true;
}
export function isRunning(sessionId: string): boolean {
  return RUNS.has(sessionId);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runSession(sessionId: string) {
  const writer = new ConvexWriter();
  const handle: RunHandle = { stopped: false };
  RUNS.set(sessionId, handle);

  const session = await writer.getSession(sessionId).catch(() => null);
  if (!session) {
    RUNS.delete(sessionId);
    return;
  }
  const goal = session.prompt;
  const model = session.model || config.openrouterModel;

  if (!config.openrouterApiKey) {
    const note =
      "No <b>OPENROUTER_API_KEY</b> set on the agent. Add it to apps/agent/.env and restart the agent.";
    await writer.patchSession(sessionId, { status: "failed", summary: note });
    await writer.addMessage(sessionId, "agent", note);
    RUNS.delete(sessionId);
    return;
  }

  const browser = new BrowserController();
  const scratch = new Scratchpad();
  const extracted: unknown[] = [];

  // conversation context: the initial prompt + any follow-up messages so far
  let messages = await writer.getMessages(sessionId).catch(() => []);
  let lastSeenTs = messages.length ? Math.max(...messages.map((m) => m.ts)) : 0;
  const convo: string[] = [`user: ${goal}`, ...messages.map((m) => `${m.role}: ${m.text}`)];
  const convoText = () => convo.slice(-12).join("\n");

  // pull any newly-arrived user follow-ups into the conversation
  const drainMessages = async (): Promise<boolean> => {
    const all = await writer.getMessages(sessionId).catch(() => messages);
    let gotUser = false;
    for (const m of all) {
      if (m.ts > lastSeenTs) {
        convo.push(`${m.role}: ${m.text}`);
        lastSeenTs = m.ts;
        if (m.role === "user") gotUser = true;
      }
    }
    messages = all;
    return gotUser;
  };

  // continuation: keep appending steps after any that already exist
  const existing = await writer.listSteps(sessionId).catch(() => []);
  let stepNo = existing.length;
  const isContinuation = stepNo > 0;

  // Terminal failure: record it on the session AND as a visible agent message.
  const failWith = async (summary: string) => {
    await writer.patchSession(sessionId, { status: "failed", summary });
    await writer.addMessage(sessionId, "agent", summary);
  };

  try {
    await writer.patchSession(sessionId, { status: "thinking" });
    await browser.launch(sessionId);

    let plan: string[] = [];
    if (!isContinuation) {
      const sp = await llm
        .startPlan(goal, model)
        .catch(() => ({ intro: `On it — working on: <b>${goal}</b>.`, plan: [] as string[] }));
      await writer.patchSession(sessionId, { intro: sp.intro });
      plan = sp.plan;
    } else if (session.summary) {
      convo.push(`(earlier you reported: ${session.summary})`);
    }

    for (let i = 0; i < config.globalStepCap; i++) {
      if (handle.stopped) {
        await failWith("Stopped by you.");
        break;
      }

      await drainMessages();
      await browser.dismissBanners();
      const obs = await observe(browser);

      if (await browser.detectBotWall()) {
        await failWith(
          "This site is showing a CAPTCHA / bot-wall, so I stopped cleanly rather than fight it.",
        );
        break;
      }

      let action: AgentAction;
      try {
        action = await llm.plan({
          goal,
          plan,
          scratch: scratch.toText(),
          conversation: convoText(),
          obs,
          model,
        });
      } catch (e) {
        await failWith(`I couldn't get a valid next step from the model: ${errMsg(e)}`);
        break;
      }

      // ── ask: pause, surface the question, and poll for the user's reply ──
      if (action.kind === "ask") {
        const question = (action.value || action.reasoning || "Could you give me a bit more detail?").trim();
        await writer.addMessage(sessionId, "agent", question);
        await writer.patchSession(sessionId, { status: "waiting", summary: question });
        const deadline = Date.now() + 4 * 60 * 1000;
        let replied = false;
        while (Date.now() < deadline && !handle.stopped) {
          await sleep(2500);
          if (await drainMessages()) {
            replied = true;
            break;
          }
        }
        if (handle.stopped) {
          await failWith("Stopped by you.");
          break;
        }
        if (!replied) {
          await failWith(
            "I didn't hear back, so I paused this task — send a message to pick it up.",
          );
          break;
        }
        await writer.patchSession(sessionId, { status: "thinking" });
        continue; // re-plan with the reply now in the conversation
      }

      if (action.kind === "done") {
        if (action.extracted) extracted.push(action.extracted);
        await browser.settle();
        await writer.addFrame({
          sessionId,
          stepIndex: stepNo,
          screenshot: await browser.screenshot(),
          url: browser.urlParts(),
        });
        const report = await llm
          .finalReport({ goal: `${goal}\n${convoText()}`, extracted, model })
          .catch(() => null);
        const summary = report?.summary ?? "Done.";
        await writer.patchSession(sessionId, { status: "done", summary, result: report?.result });
        await writer.addMessage(sessionId, "agent", summary, report?.result);
        break;
      }
      if (action.kind === "fail") {
        await failWith(action.reasoning || "I couldn't complete this task.");
        break;
      }

      await writer.patchSession(sessionId, {
        status: THINKING_KINDS.has(action.kind) ? "thinking" : "acting",
      });
      const idx = stepNo++;
      const stepId = await writer.appendStep({
        sessionId,
        index: idx,
        kind: action.kind, // narrowed: ask/done/fail handled above
        label: buildLabel(action),
        thought: buildThought(action),
        status: "running",
      });

      // ── act, capturing a frame at the right moment ──
      let acted = false;
      let lastErr = "";

      if (action.kind === "navigate") {
        for (let a = 0; a <= config.perStepRetry && !acted; a++) {
          try {
            await act(browser.page, action, null);
            acted = true;
          } catch (e) {
            lastErr = errMsg(e);
          }
        }
        await browser.settle();
        await writer.addFrame({
          sessionId,
          stepIndex: idx,
          screenshot: await browser.screenshot(),
          url: browser.urlParts(),
        });
      } else {
        let loc = resolveLocator(browser.page, action);
        let rect: { x: number; y: number; width: number; height: number } | null = null;
        try {
          if (loc) {
            await loc.scrollIntoViewIfNeeded({ timeout: 4000 });
            await loc.waitFor({ state: "visible", timeout: 6000 });
            rect = await loc.boundingBox();
          }
        } catch {
          rect = null;
        }
        await writer.addFrame({
          sessionId,
          stepIndex: idx,
          screenshot: await browser.screenshot(),
          url: obs.url,
          highlightRect: rect
            ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
            : undefined,
        });
        for (let a = 0; a <= config.perStepRetry && !acted; a++) {
          try {
            await act(browser.page, action, loc);
            acted = true;
          } catch (e) {
            lastErr = errMsg(e);
            await browser.dismissBanners();
            await browser.settle();
            loc = resolveLocator(browser.page, action);
          }
        }
        await browser.settle();
      }

      if (action.extracted) extracted.push(action.extracted);

      // ── verify (explicit self-check only for interaction steps) ──
      let achieved: boolean;
      let evidence = "";
      let nextHint: string | undefined;
      if (acted && SELF_CHECK_KINDS.has(action.kind)) {
        const obs2 = await observe(browser);
        try {
          const c = await llm.selfCheck({ expected: action.expected_outcome, obs: obs2, model });
          achieved = c.achieved;
          evidence = c.evidence;
          nextHint = c.next_hint;
        } catch {
          achieved = true;
          evidence = "action completed";
        }
      } else {
        achieved = acted;
        evidence = acted ? "action completed" : lastErr;
      }

      const key = `${obs.hash}|${action.kind}|${action.target_description}`;
      const looping = scratch.looping(key);
      scratch.push({
        key,
        kind: action.kind,
        target: action.target_description,
        ok: achieved && acted,
        note: nextHint,
      });

      let status: StepStatus;
      let note: string | undefined;
      if (acted && achieved) {
        status = "success";
      } else if (!acted) {
        if (/closed/i.test(lastErr)) {
          await writer.setStep(stepId, "failed", "Browser closed unexpectedly.");
          await failWith("The browser closed unexpectedly mid-run. Please try again.");
          break;
        }
        if (await browser.detectBotWall()) {
          await writer.setStep(stepId, "failed", "Blocked by the site.");
          await failWith("The site blocked automated access (bot-wall).");
          break;
        }
        status = "recover";
        note = `Couldn't complete this step (${lastErr || "element not found"}). Re-planning.`;
      } else {
        status = "recover";
        note = looping
          ? "Repeating the same action — trying a different approach."
          : nextHint || evidence;
      }
      await writer.setStep(stepId, status, note);
    }

    // ran out of steps without concluding
    const cur = await writer.getSession(sessionId).catch(() => null);
    if (cur && (cur.status === "thinking" || cur.status === "acting" || cur.status === "waiting")) {
      await failWith(
        "I hit the step limit before finishing — the task may be too involved or the site too dynamic.",
      );
    }
  } catch (e) {
    await failWith(`Agent error: ${errMsg(e)}`).catch(() => {});
  } finally {
    RUNS.delete(sessionId);
    await browser.close();
  }
}

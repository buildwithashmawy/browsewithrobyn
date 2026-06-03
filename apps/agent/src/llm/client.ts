import OpenAI from "openai";
import type { z } from "zod";
import { config } from "../config";
import type { Observation } from "../browser/observer";
import {
  SYSTEM,
  planUserBlocks,
  selfCheckUserBlocks,
  startPlanUser,
  finalReportUser,
} from "./prompts";
import {
  ActionSchema,
  SelfCheckSchema,
  StartPlanSchema,
  FinalReportSchema,
  browserActionTool,
  selfCheckTool,
  startPlanTool,
  finalReportTool,
  type AgentAction,
  type SelfCheckResult,
  type StartPlan,
  type FinalReport,
} from "./schema";

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type Tool = OpenAI.Chat.Completions.ChatCompletionTool;
type UserContent = OpenAI.Chat.Completions.ChatCompletionUserMessageParam["content"];

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: config.openrouterApiKey,
  defaultHeaders: { "HTTP-Referer": config.referer, "X-Title": config.title },
});

// Force a specific tool, validate the JSON args, and re-prompt on malformed output.
async function callTool<T>(
  model: string,
  userContent: UserContent,
  tool: Tool,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> {
  const messages: Msg[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: userContent },
  ];
  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await client.chat.completions.create({
      model,
      messages,
      tools: [tool],
      tool_choice: { type: "function", function: { name: tool.function.name } },
      temperature: 0.2,
      max_tokens: config.maxTokens,
    });
    const msg = res.choices[0]?.message;
    const call = msg?.tool_calls?.[0];
    if (!call || call.type !== "function") {
      messages.push({ role: "user", content: `You must call the ${tool.function.name} tool.` });
      continue;
    }
    try {
      return schema.parse(JSON.parse(call.function.arguments));
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      messages.push(msg as Msg);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: `Invalid arguments: ${lastErr}. Re-emit valid JSON for ${tool.function.name}.`,
      });
    }
  }
  throw new Error(`LLM did not return valid ${tool.function.name} args: ${lastErr}`);
}

export const llm = {
  startPlan(goal: string, model: string): Promise<StartPlan> {
    return callTool(model, startPlanUser(goal), startPlanTool, StartPlanSchema);
  },

  plan(args: {
    goal: string;
    plan: string[];
    scratch: string;
    conversation: string;
    obs: Observation;
    model: string;
  }): Promise<AgentAction> {
    const content = planUserBlocks({
      goal: args.goal,
      plan: args.plan,
      scratch: args.scratch,
      conversation: args.conversation,
      url: args.obs.url,
      aria: args.obs.aria,
      imageDataUrl: args.obs.imageDataUrl,
    });
    return callTool(args.model, content, browserActionTool, ActionSchema);
  },

  selfCheck(args: {
    expected: string;
    obs: Observation;
    model: string;
  }): Promise<SelfCheckResult> {
    const content = selfCheckUserBlocks({
      expected: args.expected,
      url: args.obs.url,
      aria: args.obs.aria,
      imageDataUrl: args.obs.imageDataUrl,
    });
    return callTool(args.model, content, selfCheckTool, SelfCheckSchema);
  },

  finalReport(args: {
    goal: string;
    extracted: unknown[];
    model: string;
  }): Promise<FinalReport> {
    return callTool(
      args.model,
      finalReportUser(args.goal, args.extracted),
      finalReportTool,
      FinalReportSchema,
    );
  },
};

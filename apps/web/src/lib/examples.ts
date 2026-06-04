import type { IconName } from "@/components/Icon";

export interface Example {
  icon: IconName;
  text: string;
}

// The brief's three login-free demo tasks, shown as empty-state chips.
export const EXAMPLES: Example[] = [
  { icon: "sun", text: "Summarize this weekend's weather in San Francisco" },
  { icon: "navigate", text: "Find a one-way SFO→JFK flight under $300" },
  { icon: "search", text: "Find a Park Slope 1BR rental under $3,500" },
];

// Rotating placeholder prompts for the composer.
export const ROTATE: string[] = [
  "Summarize this weekend's weather in San Francisco",
  "Find a one-way SFO→JFK flight under $300",
  "Find a Park Slope 1BR rental under $3,500",
  "What's the top story on Hacker News right now?",
];

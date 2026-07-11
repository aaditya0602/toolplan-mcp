import { appendFileSync } from "node:fs";
import type { KbEntry } from "./types.js";
import { matchEntries, type MatchResult } from "./match.js";
import { buildPrompt } from "./template.js";

export interface PlanProjectArgs {
  idea: string;
  grade: "industry" | "personal";
  tags?: string[];
}

export interface PlanProjectResult {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
}

interface UsageLogLine {
  ts: string;
  idea: string;
  grade: string;
  tags: string[];
  matched: {
    stacks: string[];
    recommendations: string[];
    directives: string[];
  };
}

function logUsage(logPath: string, args: PlanProjectArgs, matchResult: MatchResult): void {
  try {
    const line: UsageLogLine = {
      ts: new Date().toISOString(),
      idea: args.idea,
      grade: args.grade,
      tags: args.tags ?? [],
      matched: {
        stacks: matchResult.stacks.map((e) => e.name),
        recommendations: matchResult.recommendations.map((e) => e.name),
        directives: matchResult.directives.map((e) => e.name),
      },
    };
    appendFileSync(logPath, `${JSON.stringify(line)}\n`, "utf8");
  } catch {
    // Usage logging is best-effort groundwork (Phase 4) — a logging failure
    // must never break the tool response.
  }
}

/**
 * Text for the MCP "plan" prompt: the enriched prompt plus an instruction to
 * present it for user review instead of building immediately. Hosts that
 * expose MCP prompts as slash commands inject this as the user message.
 */
export function buildPlanPromptText(entries: KbEntry[], args: PlanProjectArgs, logPath?: string): string {
  const prompt = handlePlanProject(entries, args, logPath).content[0].text;
  return [
    "Below is a refined project prompt produced by ToolPlan from my raw idea.",
    "Show it to me verbatim (in a markdown block) so I can review or edit it.",
    "Do NOT start building yet — wait until I confirm or paste back an edited version.",
    "",
    "---",
    "",
    prompt,
  ].join("\n");
}

/**
 * Core plan_project logic, factored out of the MCP tool registration so it
 * can be unit-tested (and so index.ts stays a thin server wrapper).
 */
export function handlePlanProject(
  entries: KbEntry[],
  args: PlanProjectArgs,
  logPath?: string
): PlanProjectResult {
  const matchResult = matchEntries(entries, args.idea, args.grade, args.tags ?? []);
  const prompt = buildPrompt(args.idea, args.grade, matchResult);

  if (logPath) {
    logUsage(logPath, args, matchResult);
  }

  return { content: [{ type: "text", text: prompt }] };
}

import { describe, it, expect } from "vitest";
import { buildPrompt } from "../src/template.js";
import type { KbEntry } from "../src/types.js";
import type { MatchResult } from "../src/match.js";

function entry(overrides: Partial<KbEntry>): KbEntry {
  return {
    name: "entry",
    category: "tool",
    summary: "summary text",
    use_case_tags: [],
    keywords: [],
    grade: "both",
    cost_profile: "cost profile text",
    source_url: "https://example.com/entry",
    last_verified: "2026-07-11",
    ...overrides,
  };
}

describe("buildPrompt", () => {
  it("includes idea verbatim, grade line, and all sections when matches exist", () => {
    const matchResult: MatchResult = {
      stacks: [entry({ name: "stack-a", category: "stack" })],
      recommendations: [entry({ name: "tool-a", category: "tool", why_models_miss_it: "niche reason" })],
      directives: [entry({ name: "directive-a", category: "directive", summary: "directive-a summary" })],
    };

    const idea = "A SaaS dashboard that scrapes competitor prices and shows trends";
    const prompt = buildPrompt(idea, "personal", matchResult);

    expect(prompt).toContain("# Project Brief");
    expect(prompt).toContain(idea);
    expect(prompt).toContain("Grade: personal");
    expect(prompt).toContain("## Recommended Stack");
    expect(prompt).toContain("stack-a");
    expect(prompt).toContain("## High-Leverage Tools You'd Likely Miss");
    expect(prompt).toContain("tool-a");
    expect(prompt).toContain("niche reason");
    expect(prompt).toContain("## Execution Directives (follow these to save tokens)");
    expect(prompt).toContain("directive-a summary");
    expect(prompt).toContain("## Constraints & Quality Bar");
    expect(prompt).toContain("Plan first");
    expect(prompt).toContain("## Sources");
    expect(prompt).toContain("https://example.com/entry");
    expect(prompt).toContain("2026-07-11");
  });

  it("omits empty sections but always keeps Project Brief and Constraints", () => {
    const matchResult: MatchResult = { stacks: [], recommendations: [], directives: [] };
    const prompt = buildPrompt("An idea with no KB matches at all", "industry", matchResult);

    expect(prompt).toContain("# Project Brief");
    expect(prompt).toContain("## Constraints & Quality Bar");
    expect(prompt).not.toContain("## Recommended Stack");
    expect(prompt).not.toContain("## High-Leverage Tools You'd Likely Miss");
    expect(prompt).not.toContain("## Execution Directives");
    expect(prompt).not.toContain("## Sources");
  });

  it("numbers execution directives in order", () => {
    const matchResult: MatchResult = {
      stacks: [],
      recommendations: [],
      directives: [
        entry({ name: "first", category: "directive", summary: "first directive" }),
        entry({ name: "second", category: "directive", summary: "second directive" }),
      ],
    };
    const prompt = buildPrompt("idea text here for testing", "personal", matchResult);
    expect(prompt).toContain("1. first directive");
    expect(prompt).toContain("2. second directive");
  });
});

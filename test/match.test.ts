import { describe, it, expect } from "vitest";
import { matchEntries } from "../src/match.js";
import type { KbEntry } from "../src/types.js";

function entry(overrides: Partial<KbEntry>): KbEntry {
  return {
    name: "entry",
    category: "tool",
    summary: "summary",
    use_case_tags: [],
    keywords: [],
    grade: "both",
    cost_profile: "cost profile",
    source_url: "https://example.com/entry",
    last_verified: "2026-07-11",
    ...overrides,
  };
}

describe("matchEntries", () => {
  it("filters entries by grade (both always included, mismatched grade excluded)", () => {
    const entries: KbEntry[] = [
      entry({ name: "industry-tool", category: "tool", grade: "industry", keywords: ["scrape"], why_models_miss_it: "x" }),
      entry({ name: "personal-tool", category: "tool", grade: "personal", keywords: ["scrape"], why_models_miss_it: "x" }),
      entry({ name: "both-tool", category: "tool", grade: "both", keywords: ["scrape"], why_models_miss_it: "x" }),
    ];

    const result = matchEntries(entries, "scrape prices", "industry");
    const names = result.recommendations.map((r) => r.name);
    expect(names).toContain("industry-tool");
    expect(names).toContain("both-tool");
    expect(names).not.toContain("personal-tool");
  });

  it("scores entries by tag + keyword overlap and ranks highest first", () => {
    const entries: KbEntry[] = [
      entry({
        name: "low-match",
        keywords: ["dashboard"],
        use_case_tags: [],
        why_models_miss_it: "x",
      }),
      entry({
        name: "high-match",
        keywords: ["scrape", "price"],
        use_case_tags: ["scraping"],
        why_models_miss_it: "x",
      }),
    ];

    const result = matchEntries(entries, "scrape competitor prices", "personal", ["scraping"]);
    expect(result.recommendations[0].name).toBe("high-match");
    expect(result.recommendations.map((r) => r.name)).not.toContain("low-match");
  });

  it("caps recommendations at 9 and stacks at top 2", () => {
    const tools: KbEntry[] = Array.from({ length: 11 }, (_, i) =>
      entry({ name: `tool-${i}`, category: "tool", keywords: ["scrape"], why_models_miss_it: "x" })
    );
    const stacks: KbEntry[] = Array.from({ length: 5 }, (_, i) =>
      entry({ name: `stack-${i}`, category: "stack", keywords: ["scrape"] })
    );

    const result = matchEntries([...tools, ...stacks], "scrape data", "personal");
    expect(result.recommendations).toHaveLength(9);
    expect(result.stacks).toHaveLength(2);
  });

  it("always includes universal-tagged tools/skills in recommendations", () => {
    const entries: KbEntry[] = [
      entry({ name: "universal-skill", category: "skill", use_case_tags: ["universal"], keywords: ["tokens"], why_models_miss_it: "x" }),
    ];

    const result = matchEntries(entries, "an app for tracking invoices", "personal");
    expect(result.recommendations.map((r) => r.name)).toContain("universal-skill");
  });

  it("matches keywords with plural/inflection tolerance but not substrings", () => {
    const entries: KbEntry[] = [
      entry({ name: "scraper-tool", category: "tool", keywords: ["scrape"], why_models_miss_it: "x" }),
      entry({ name: "ai-tool", category: "tool", keywords: ["ai"], why_models_miss_it: "x" }),
    ];

    const result = matchEntries(entries, "a dashboard that scrapes email inboxes", "personal");
    const names = result.recommendations.map((r) => r.name);
    expect(names).toContain("scraper-tool");
    expect(names).not.toContain("ai-tool");
  });

  it("always includes universal directives regardless of idea text, plus matching non-universal ones", () => {
    const entries: KbEntry[] = [
      entry({ name: "universal-directive", category: "directive", use_case_tags: ["universal"], keywords: ["universal"] }),
      entry({ name: "matching-directive", category: "directive", keywords: ["scrape"] }),
      entry({ name: "non-matching-directive", category: "directive", keywords: ["unrelated-keyword"] }),
    ];

    const result = matchEntries(entries, "scrape competitor prices", "personal");
    const names = result.directives.map((d) => d.name);
    expect(names).toContain("universal-directive");
    expect(names).toContain("matching-directive");
    expect(names).not.toContain("non-matching-directive");
  });

  it("excludes zero-score tool/mcp/skill entries from recommendations", () => {
    const entries: KbEntry[] = [
      entry({ name: "irrelevant-tool", category: "tool", keywords: ["unrelated"], why_models_miss_it: "x" }),
    ];

    const result = matchEntries(entries, "scrape competitor prices", "personal");
    expect(result.recommendations).toHaveLength(0);
  });
});

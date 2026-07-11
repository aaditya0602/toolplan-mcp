import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handlePlanProject } from "../src/handler.js";
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

describe("handlePlanProject usage logging", () => {
  let dir: string;
  let logPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "toolplan-log-test-"));
    logPath = join(dir, "usage.jsonl");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const entries: KbEntry[] = [
    entry({
      name: "crawl4ai",
      category: "tool",
      keywords: ["scrape"],
      why_models_miss_it: "x",
    }),
    entry({
      name: "walking-skeleton-first",
      category: "directive",
      use_case_tags: ["universal"],
      keywords: ["universal"],
    }),
  ];

  it("does not write a log file when TOOLPLAN_LOG is unset", () => {
    handlePlanProject(entries, { idea: "scrape competitor prices daily", grade: "personal" });
    expect(existsSync(logPath)).toBe(false);
  });

  it("appends one JSONL line with ts/idea/grade/tags/matched after a call", () => {
    const result = handlePlanProject(
      entries,
      { idea: "scrape competitor prices daily", grade: "personal", tags: ["scraping"] },
      logPath
    );

    // Logging must never affect the tool response itself.
    expect(result.content[0]?.type).toBe("text");

    const raw = readFileSync(logPath, "utf8").trim();
    const lines = raw.split("\n");
    expect(lines).toHaveLength(1);

    const parsed = JSON.parse(lines[0]);
    expect(typeof parsed.ts).toBe("string");
    expect(() => new Date(parsed.ts).toISOString()).not.toThrow();
    expect(parsed.idea).toBe("scrape competitor prices daily");
    expect(parsed.grade).toBe("personal");
    expect(parsed.tags).toEqual(["scraping"]);
    expect(parsed.matched.recommendations).toContain("crawl4ai");
    expect(parsed.matched.directives).toContain("walking-skeleton-first");
  });

  it("appends multiple calls as multiple JSONL lines", () => {
    handlePlanProject(entries, { idea: "scrape competitor prices", grade: "personal" }, logPath);
    handlePlanProject(entries, { idea: "scrape competitor prices again", grade: "personal" }, logPath);

    const lines = readFileSync(logPath, "utf8").trim().split("\n");
    expect(lines).toHaveLength(2);
  });

  it("never throws even if the log path is unwritable", () => {
    const badPath = join(dir, "does-not-exist", "usage.jsonl");
    expect(() =>
      handlePlanProject(entries, { idea: "scrape competitor prices", grade: "personal" }, badPath)
    ).not.toThrow();
  });
});

import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import { loadKb } from "../src/kb.js";

const GOOD_TOOL = `
name: good-tool
category: tool
summary: A valid tool entry.
use_case_tags: [testing]
keywords: [test]
grade: both
cost_profile: Saves time.
why_models_miss_it: Niche.
source_url: https://example.com/good-tool
last_verified: "2026-07-11"
`;

describe("loadKb", () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("loads and validates real fixture KB", () => {
    const entries = loadKb("kb");
    expect(entries.length).toBeGreaterThanOrEqual(3);
    expect(entries.some((e) => e.name === "subagent-delegation")).toBe(true);
  });

  it("loads a valid entry from a nested directory", () => {
    dir = mkdtempSync(join(tmpdir(), "kb-test-"));
    const sub = join(dir, "tools");
    mkdirSync(sub);
    writeFileSync(join(sub, "good-tool.yaml"), GOOD_TOOL);

    const entries = loadKb(dir);
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("good-tool");
  });

  it("rejects a tool entry missing why_models_miss_it, naming the bad file", () => {
    dir = mkdtempSync(join(tmpdir(), "kb-test-bad-"));
    const badFile = join(dir, "bad-tool.yaml");
    writeFileSync(
      badFile,
      `
name: bad-tool
category: tool
summary: Missing why_models_miss_it.
use_case_tags: [testing]
keywords: [test]
grade: both
cost_profile: Saves time.
source_url: https://example.com/bad-tool
last_verified: "2026-07-11"
`
    );

    expect(() => loadKb(dir)).toThrowError(/bad-tool\.yaml/);
    expect(() => loadKb(dir)).toThrowError(/why_models_miss_it/);
  });

  it("rejects an entry with an invalid grade enum value", () => {
    dir = mkdtempSync(join(tmpdir(), "kb-test-grade-"));
    writeFileSync(
      join(dir, "bad-grade.yaml"),
      `
name: bad-grade
category: stack
summary: Invalid grade.
use_case_tags: [testing]
keywords: [test]
grade: enterprise
cost_profile: Saves time.
source_url: https://example.com/bad-grade
last_verified: "2026-07-11"
`
    );

    expect(() => loadKb(dir)).toThrowError(/bad-grade\.yaml/);
  });

  it("rejects an entry with a non-ISO last_verified date", () => {
    dir = mkdtempSync(join(tmpdir(), "kb-test-date-"));
    writeFileSync(
      join(dir, "bad-date.yaml"),
      `
name: bad-date
category: stack
summary: Invalid date.
use_case_tags: [testing]
keywords: [test]
grade: both
cost_profile: Saves time.
source_url: https://example.com/bad-date
last_verified: "July 2026"
`
    );

    expect(() => loadKb(dir)).toThrowError(/bad-date\.yaml/);
  });
});

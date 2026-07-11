import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { loadKb } from "../src/kb.js";
import { matchEntries } from "../src/match.js";
import type { Grade } from "../src/types.js";

interface EvalCase {
  id: string;
  idea: string;
  grade: Grade;
  tags?: string[];
  must_include?: string[];
  must_not_include?: string[];
  notes?: string;
}

const KB_DIR = "kb";
const CASES_DIR = join("evals", "cases");

function loadCases(dir: string): { file: string; c: EvalCase }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort()
    .map((f) => ({ file: f, c: parse(readFileSync(join(dir, f), "utf8")) as EvalCase }));
}

function main() {
  const entries = loadKb(KB_DIR);
  const cases = loadCases(CASES_DIR);

  let passed = 0;
  const failures: string[] = [];

  for (const { file, c } of cases) {
    const result = matchEntries(entries, c.idea, c.grade, c.tags ?? []);
    const names = new Set(
      [...result.stacks, ...result.recommendations, ...result.directives].map((e) => e.name)
    );

    const mustInclude = c.must_include ?? [];
    const mustNot = c.must_not_include ?? [];

    const missing = mustInclude.filter((n) => !names.has(n));
    const unexpected = mustNot.filter((n) => names.has(n));

    if (c.id !== file.replace(/\.ya?ml$/, "")) {
      failures.push(`${file}: id "${c.id}" does not match filename`);
    }

    if (missing.length === 0 && unexpected.length === 0) {
      passed++;
      console.log(`PASS  ${c.id}`);
    } else {
      const parts: string[] = [];
      if (missing.length) parts.push(`missing: ${missing.join(", ")}`);
      if (unexpected.length) parts.push(`unexpected: ${unexpected.join(", ")}`);
      console.log(`FAIL  ${c.id}  (${parts.join(" | ")})`);
      failures.push(`${c.id}: ${parts.join(" | ")}`);
    }
  }

  const total = cases.length;
  const rate = total === 0 ? 0 : passed / total;
  const pct = Math.round(rate * 100);
  console.log("");
  console.log(`${passed}/${total} passed (${pct}%)`);

  process.exit(rate < 0.8 ? 1 : 0);
}

main();

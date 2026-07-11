import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";

interface UsageLogLine {
  ts: string;
  idea: string;
  grade: string;
  tags?: string[];
  matched: {
    stacks: string[];
    recommendations: string[];
    directives: string[];
  };
}

const CASES_DIR = join("evals", "cases");

function main() {
  const logfile = process.argv[2];
  if (!logfile) {
    console.error("Usage: tsx scripts/log-to-case.ts <logfile.jsonl>");
    process.exit(1);
  }

  const raw = readFileSync(logfile, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  mkdirSync(CASES_DIR, { recursive: true });

  const created: string[] = [];

  lines.forEach((line, idx) => {
    const n = idx + 1;
    const outPath = join(CASES_DIR, `from-log-${n}.yaml`);

    if (existsSync(outPath)) {
      console.log(`SKIP (exists) ${outPath}`);
      return;
    }

    let entry: UsageLogLine;
    try {
      entry = JSON.parse(line);
    } catch (err) {
      console.log(`SKIP (invalid JSON on line ${n}): ${(err as Error).message}`);
      return;
    }

    const skeleton = {
      id: `from-log-${n}`,
      idea: entry.idea,
      grade: entry.grade,
      tags: entry.tags ?? [],
      must_include: entry.matched?.recommendations ?? [],
      must_not_include: [],
      notes: "AUTO-GENERATED from usage log - review before trusting",
    };

    writeFileSync(outPath, stringify(skeleton), "utf8");
    created.push(outPath);
    console.log(`CREATED ${outPath}`);
  });

  console.log("");
  console.log(`${created.length} case(s) created`);

  process.exit(0);
}

main();

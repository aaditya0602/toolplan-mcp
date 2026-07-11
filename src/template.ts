import type { Grade, KbEntry } from "./types.js";
import type { MatchResult } from "./match.js";

const CONSTRAINTS = `- Plan first.
- Verify each task before moving to the next.
- Surface assumptions.
- Write the minimal code that works.`;

function dedupeByName(entries: KbEntry[]): KbEntry[] {
  const seen = new Set<string>();
  const out: KbEntry[] = [];
  for (const e of entries) {
    if (!seen.has(e.name)) {
      seen.add(e.name);
      out.push(e);
    }
  }
  return out;
}

export function buildPrompt(idea: string, grade: Grade, matchResult: MatchResult): string {
  const { stacks, recommendations, directives } = matchResult;
  const sections: string[] = [];

  sections.push(`# Project Brief\n\n${idea}\n\nGrade: ${grade}`);

  if (stacks.length > 0) {
    const lines = stacks.map((s) => `- **${s.name}**: ${s.summary.trim()}`);
    sections.push(`## Recommended Stack\n\n${lines.join("\n")}`);
  }

  if (recommendations.length > 0) {
    const lines = recommendations.map((r) => {
      const parts = [`- **${r.name}**: ${r.summary.trim()}`];
      if (r.why_models_miss_it) parts.push(`  Why models miss it: ${r.why_models_miss_it.trim()}`);
      parts.push(`  Source: ${r.source_url}`);
      return parts.join("\n");
    });
    sections.push(`## High-Leverage Tools You'd Likely Miss\n\n${lines.join("\n")}`);
  }

  if (directives.length > 0) {
    const lines = directives.map(
      (d, i) => `${i + 1}. ${d.summary.trim()}\n   Cost profile: ${d.cost_profile.trim()}`
    );
    sections.push(`## Execution Directives (follow these to save tokens)\n\n${lines.join("\n")}`);
  }

  sections.push(`## Constraints & Quality Bar\n\n${CONSTRAINTS}`);

  const allEntries = dedupeByName([...stacks, ...recommendations, ...directives]);
  if (allEntries.length > 0) {
    const seenUrls = new Set<string>();
    const lines: string[] = [];
    for (const e of allEntries) {
      if (seenUrls.has(e.source_url)) continue;
      seenUrls.add(e.source_url);
      lines.push(`- ${e.source_url} (last verified ${e.last_verified})`);
    }
    sections.push(`## Sources\n\n${lines.join("\n")}`);
  }

  return sections.join("\n\n");
}

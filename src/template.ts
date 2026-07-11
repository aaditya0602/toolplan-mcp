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

/**
 * The KB is curated but a snapshot; the calling agent usually has live web
 * search. Emit targeted queries so it crosschecks for anything newer/better
 * (new OSS tools, free-tier API deals) and merges findings marked unverified.
 */
function buildCrosscheckSection(matchResult: MatchResult): string {
  const tags = [
    ...new Set(
      [...matchResult.stacks, ...matchResult.recommendations]
        .flatMap((e) => e.use_case_tags)
        .filter((t) => t !== "universal")
    ),
  ].slice(0, 3);
  const domain = tags.length > 0 ? tags.join(" ") : "web app development";
  const year = new Date().getFullYear();
  return [
    "## Live Crosscheck (agent: run before finalizing)",
    "",
    "The recommendations above come from a curated, human-reviewed knowledge",
    "base — trustworthy but a snapshot. If you have web search, run these and",
    "compare against the picks above:",
    "",
    `1. \`${domain} open source tools ${year}\` — anything newer that clearly beats a pick above?`,
    `2. \`site:reddit.com OR site:news.ycombinator.com ${domain} tool recommendation ${year}\` — practitioner consensus shifts.`,
    "3. `free tier AI API access developers " + year + "` — free/cheap API programs (e.g. model providers, hosting credits) relevant to this project.",
    "",
    "Rules: additions from search are UNVERIFIED — label them so, include the",
    "source link, and prefer the curated pick when in doubt. Skip this section",
    "entirely if you have no web access.",
  ].join("\n");
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

  sections.push(buildCrosscheckSection(matchResult));

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

import type { Grade, KbEntry } from "./types.js";

export interface MatchResult {
  stacks: KbEntry[];
  recommendations: KbEntry[];
  directives: KbEntry[];
}

/**
 * Per-entry score = overlap of (provided tags ∪ keyword hits found in the
 * lowercased idea text) against (entry.use_case_tags ∪ entry.keywords).
 * See docs/KB_SCHEMA.md "Matching contract".
 */
function keywordInText(keyword: string, text: string): boolean {
  const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Word-boundary match with light plural/inflection tolerance so "scrape"
  // hits "scrapes"/"scraped", without substring false positives ("ai" in "email").
  return new RegExp(`(^|[^a-z0-9])${escaped}(s|es|d|ed|ing)?($|[^a-z0-9])`).test(text);
}

function scoreEntry(entry: KbEntry, ideaLower: string, tagsLower: string[]): number {
  const vocab = new Set([...entry.use_case_tags, ...entry.keywords].map((s) => s.toLowerCase()));
  const matchedTags = tagsLower.filter((t) => vocab.has(t));
  const matchedKeywordHits = entry.keywords.filter((k) => keywordInText(k, ideaLower));
  const query = new Set([...matchedTags, ...matchedKeywordHits.map((k) => k.toLowerCase())]);
  return query.size;
}

function isUniversal(entry: KbEntry): boolean {
  const vocab = [...entry.use_case_tags, ...entry.keywords].map((s) => s.toLowerCase());
  return vocab.includes("universal");
}

function gradeMatches(entry: KbEntry, grade: Grade): boolean {
  return entry.grade === "both" || entry.grade === grade;
}

export function matchEntries(
  entries: KbEntry[],
  idea: string,
  grade: Grade,
  tags: string[] = []
): MatchResult {
  const ideaLower = idea.toLowerCase();
  const tagsLower = tags.map((t) => t.toLowerCase());

  const gradeFiltered = entries.filter((e) => gradeMatches(e, grade));
  const scored = gradeFiltered.map((entry) => ({ entry, score: scoreEntry(entry, ideaLower, tagsLower) }));

  const byScoreDesc = (a: { score: number }, b: { score: number }) => b.score - a.score;

  const stacks = scored
    .filter((s) => s.entry.category === "stack" && s.score > 0)
    .sort(byScoreDesc)
    .slice(0, 2)
    .map((s) => s.entry);

  // Universal-tagged tools/mcps/skills (session-wide token savers like output
  // compression) always surface — that's the product's headline value.
  const recCategories = ["tool", "mcp", "skill"];
  const universalRecs = gradeFiltered.filter(
    (e) => recCategories.includes(e.category) && isUniversal(e)
  );
  const scoredRecs = scored
    .filter(
      (s) => recCategories.includes(s.entry.category) && !isUniversal(s.entry) && s.score > 0
    )
    .sort(byScoreDesc)
    .map((s) => s.entry);
  const recommendations = [...universalRecs, ...scoredRecs].slice(0, 9);

  const universalDirectives = gradeFiltered.filter((e) => e.category === "directive" && isUniversal(e));
  const matchingNonUniversalDirectives = scored
    .filter((s) => s.entry.category === "directive" && !isUniversal(s.entry) && s.score > 0)
    .sort(byScoreDesc)
    .map((s) => s.entry);

  const directives = [...universalDirectives, ...matchingNonUniversalDirectives];

  return { stacks, recommendations, directives };
}

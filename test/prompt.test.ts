import { describe, it, expect } from "vitest";
import { buildPlanPromptText } from "../src/handler.js";
import type { KbEntry } from "../src/types.js";

const entries: KbEntry[] = [
  {
    name: "universal-directive",
    category: "directive",
    summary: "always plan first",
    use_case_tags: ["universal"],
    keywords: ["universal"],
    grade: "both",
    cost_profile: "cheap corrections",
    source_url: "https://example.com/d",
    last_verified: "2026-07-11",
  },
];

describe("buildPlanPromptText", () => {
  it("wraps the enriched prompt with review-first instructions", () => {
    const text = buildPlanPromptText(entries, {
      idea: "an app that tracks freelance invoices",
      grade: "personal",
    });
    expect(text).toContain("Do NOT start building yet");
    expect(text).toContain("# Project Brief");
    expect(text).toContain("an app that tracks freelance invoices");
    expect(text).toContain("always plan first");
  });
});

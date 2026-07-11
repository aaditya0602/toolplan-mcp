// Matches docs/KB_SCHEMA.md field-for-field. Do not add fields not in the schema.

export type Category = "stack" | "tool" | "mcp" | "skill" | "directive";
export type Grade = "industry" | "personal" | "both";

export interface KbEntry {
  name: string;
  category: Category;
  summary: string;
  use_case_tags: string[];
  keywords: string[];
  grade: Grade;
  cost_profile: string;
  why_models_miss_it?: string;
  pairs_with?: string[];
  avoid_when?: string;
  source_url: string;
  last_verified: string;
}

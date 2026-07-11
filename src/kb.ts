import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import type { KbEntry } from "./types.js";

const entrySchema = z
  .object({
    name: z.string().min(1),
    category: z.enum(["stack", "tool", "mcp", "skill", "directive"]),
    summary: z.string().min(1),
    use_case_tags: z.array(z.string()),
    keywords: z.array(z.string()),
    grade: z.enum(["industry", "personal", "both"]),
    cost_profile: z.string().min(1),
    why_models_miss_it: z.string().min(1).optional(),
    pairs_with: z.array(z.string()).optional(),
    avoid_when: z.string().optional(),
    source_url: z.string().url(),
    last_verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO date string (YYYY-MM-DD)"),
  })
  .superRefine((entry, ctx) => {
    if (["tool", "mcp", "skill"].includes(entry.category) && !entry.why_models_miss_it) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["why_models_miss_it"],
        message: `why_models_miss_it is required for category "${entry.category}"`,
      });
    }
  });

function findYamlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...findYamlFiles(full));
    } else if (entry.endsWith(".yaml") || entry.endsWith(".yml")) {
      files.push(full);
    }
  }
  return files;
}

/** Recursively loads and validates all KB YAML entries under `dir`. */
export function loadKb(dir: string): KbEntry[] {
  const files = findYamlFiles(dir);
  const entries: KbEntry[] = [];

  for (const file of files) {
    let raw: unknown;
    try {
      raw = parse(readFileSync(file, "utf8"));
    } catch (err) {
      throw new Error(`Failed to parse YAML in ${file}: ${(err as Error).message}`);
    }

    const result = entrySchema.safeParse(raw);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Invalid KB entry in ${file}: ${issues}`);
    }

    entries.push(result.data as KbEntry);
  }

  return entries;
}

# Contributing to ToolPlan

## Dev setup

```sh
npm install
npm run build
npm test
npm run eval
npm run smoke   # end-to-end stdio call against the built server
```

All four must pass before you open a PR (`npm run build` also catches
TypeScript errors that `npm test` alone won't).

## How to add a KB entry

KB entries live under `kb/<category>/<name>.yaml` (`category` is one of
`stacks`, `tools`, `mcps`, `skills`, `directives`). Full field reference:
[docs/KB_SCHEMA.md](docs/KB_SCHEMA.md).

Worked example — a new tool entry at `kb/tools/example-tool.yaml`:

```yaml
name: example-tool
category: tool
summary: >
  One-line, factual description of what it does.
use_case_tags: [scraping, research]
keywords: [scrape, crawl, ingest]
grade: both
cost_profile: >
  Replaces a hand-rolled integration; agent installs it once instead of
  writing and debugging the equivalent code.
why_models_miss_it: >
  Niche OSS project; models default to suggesting a generic library or
  writing this from scratch instead.
pairs_with: [crawl4ai]
avoid_when: >
  Target site already has an official API in use.
source_url: https://github.com/example/example-tool
last_verified: "2026-07-12"
```

Add it, then run `npm test` and `npm run eval` — `loadKb` validates the
schema and will fail loudly on a malformed entry.

## Quality rules

- `why_models_miss_it` must be specific to the entry, not generic
  boilerplate — explain concretely why an LLM would default to something
  worse without this KB entry.
- `source_url` must point to a real, currently-reachable project page (repo,
  docs, or package page) — verify it loads before submitting.
- `last_verified` must be the date you actually checked the entry, not a
  copy-pasted date from another file.
- No hype adjectives in `summary` or `cost_profile` ("blazing fast",
  "revolutionary", "best-in-class"). State what it does and what it saves,
  plainly.
- `avoid_when` is encouraged wherever there's a real tradeoff — it makes
  recommendations more trustworthy than a tool with no caveats.

## PR requirements

- `npm test` and `npm run eval` must both pass. CI (`.github/workflows/ci.yml`)
  runs both on every push and PR.
- If your entry introduces novel `keywords` (not already covered by an
  existing eval case), add a matching eval case in `evals/cases/` that
  exercises it — a KB entry nobody's eval ever matches is unverified dead
  weight.
- Keep PRs scoped: one KB entry (or one focused group of related entries)
  per PR is easier to review than a mixed batch.

## How eval cases work

Each file in `evals/cases/` is one scenario: an idea prompt, a grade, and the
entries the matcher is expected (or forbidden) to surface. `npm run eval`
runs every case through `matchEntries` and fails if actual matches diverge
from `must_include` / `must_not_include`.

Example case (`evals/cases/scraper-price-tracker.yaml`):

```yaml
id: scraper-price-tracker
idea: >
  I want an app that watches my competitors' pricing pages, scrapes them once a
  day, and emails me whenever a price changes.
grade: personal
tags: []
must_include: [crawl4ai, react-email]
must_not_include: []
notes: scrapes hits crawl4ai/agent-reach/firecrawl; emails hits react-email.
```

Notes:
- `id` must match the filename (minus extension).
- `must_include` lists entry `name`s that must appear somewhere in the
  matched stacks/recommendations/directives.
- `must_not_include` lists entry `name`s that must *not* appear — use this to
  guard against false positives (e.g. an unrelated tool matching on a
  too-broad keyword).
- The overall suite must pass at ≥80% for `npm run eval` to exit 0; keep
  cases honest rather than tuned to always pass.

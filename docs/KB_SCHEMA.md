# Knowledge Base Entry Schema

One YAML file per entry, under `kb/<category>/<name>.yaml`.
Categories (= directory names): `stacks`, `tools`, `mcps`, `skills`, `directives`.

## Fields

```yaml
name: agent-reach              # kebab-case, unique, matches filename
category: tool                 # stack | tool | mcp | skill | directive
summary: >                     # one line, what it is
  CLI capability layer letting AI agents read/search 14+ platforms with
  automatic fallback routing.
use_case_tags: [scraping, research, content-ingestion]   # lowercase kebab
keywords: [scrape, crawl, twitter, reddit, youtube, rss]  # matched against idea text
grade: both                    # industry | personal | both
cost_profile: >                # how it saves tokens/time, one or two lines
  Replaces hand-rolled scrapers; agent installs it once instead of writing
  and debugging per-site scraping code.
why_models_miss_it: >          # REQUIRED for tools/mcps/skills — the value-prop field.
  Niche OSS project; models default to suggesting requests/BeautifulSoup or
  writing scrapers from scratch.
pairs_with: [exa-search]       # names of other entries, optional
avoid_when: >                  # optional, one line
  Target site has an official API the project already uses.
source_url: https://github.com/Panniantong/Agent-Reach
last_verified: "2026-07-11"    # quoted ISO date
```

## Rules
- `why_models_miss_it` required for categories tool/mcp/skill; optional for
  stack/directive.
- `directives` entries are execution techniques (subagent delegation,
  plan-first, walking skeleton...). They use the same schema;
  `keywords`/`use_case_tags` may be `[universal]` — matcher always includes
  universal directives.
- Every entry must have a real `source_url` and honest `last_verified`.
- No hype: `summary` and `cost_profile` state what it does, not adjectives.
- Scope v1: web applications (SaaS, CRUD, frontend+backend, auth, payments,
  scraping/ingestion for web apps).

## Matching contract (implemented in server)
- Tool call: `plan_project(idea: string, grade: "industry"|"personal", tags?: string[])`
- Score per entry = overlap(tags param ∪ keyword hits in idea text,
  entry.use_case_tags ∪ entry.keywords), filtered by grade
  (entry.grade == "both" or == requested grade).
- Output: top 1–2 stacks, top ~6 tools/mcps/skills, ALL universal directives
  + matching non-universal ones.

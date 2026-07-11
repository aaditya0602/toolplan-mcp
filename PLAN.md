# ToolPlan — Project Planning & Cost-Saving Advisor MCP

## What it is
Open-source MCP server + knowledge base. User runs an explicit command
(`/plan-project <idea>`) in any MCP host (Claude Code, Cursor, Windsurf...).
The tool returns an enriched prompt: recommended tech stack (industry vs
personal grade), current best tools/skills/MCPs, and cost-saving execution
directives (plan-first, subagent delegation, task structure).

## Value proposition (why this beats raw model output)
1. **Surface what models miss.** Models pick stacks fine but under-recommend
   niche open-source leverage: skills (caveman, karpathy-guidelines),
   scrapers (Agent-Reach), community tools from GitHub/Reddit. KB entries
   carry a `why_models_miss_it` field — this is the headline content.
2. **One-shotability.** A polished, structured first prompt gives direction
   so even non-frontier models produce good results in fewer turns.
3. **Inject techniques casual users never prompt.** Subagent delegation,
   plan-first, task-by-task structure — models don't do these unprompted;
   casual users burn millions of tokens without them. Directives section
   makes them explicit in every enriched prompt.

## Core design decisions (agreed 2026-07-11)
- **UX:** explicit command, no interception magic. Portable across hosts.
  (Optional Claude Code `UserPromptSubmit` hook adapter can come later.)
- **Audience:** public / open-source product.
- **v1 scope:** web apps only (SaaS, CRUD, frontend+backend). Expand later.
- **KB curation:** weekly scrape pipeline proposes a diff; human reviews and
  merges. No auto-merge.

## Architecture
```
OFFLINE (weekly)                        RUNTIME (per request)
┌─────────────────────────┐            ┌──────────────────────────┐
│ Scrape pipeline          │            │ MCP server               │
│  Agent-Reach + Exa       │            │  tool: plan_project(     │
│  sources: GitHub trending│            │    idea, grade,          │
│   MCP registries, HN,    │  KB diff   │    constraints)          │
│   Reddit                 │──review──▶ │  reads versioned KB      │
│ LLM distills → PR diff   │  (human)   │  returns enriched prompt │
└─────────────────────────┘            └──────────────────────────┘
```
- **No "training."** Accuracy = curated KB + eval harness. Every KB or
  prompt-template change is scored against evals before merge.
- **No live scraping at runtime.** KB read only; optional single Exa
  fallback call when KB has no match.

## Knowledge base format
One YAML/JSON record per stack/tool/MCP/skill:
- `name`, `category` (stack | tool | mcp | skill | directive)
- `use_case_tags`, `grade` (industry | personal | both)
- `cost_profile` (token/runtime cost notes)
- `pairs_with`, `avoid_when`
- `source_url`, `last_verified` (stale entries auto-flagged for review)

Evergreen cost directives (plan-first, subagent tiers, task structure) live
in static templates — they don't need scraping.

## Phases
### Phase 0 — Evals (before any code)
- 30–50 real idea-prompts, each with expert-judged expected output
  (stack, tools, directives).
- Baseline: raw Claude + plan mode on same prompts. Tool must beat baseline
  measurably or stop.

### Phase 1 — Static v1
- MCP server (TypeScript, official MCP SDK), one tool `plan_project`.
- Hand-curated KB, ~50 web-app entries.
- Prompt template producing the enriched prompt.
- Score vs evals; iterate template + KB until it wins.

### Phase 2 — Public release
- README, install one-liner, examples, license (MIT).
- CONTRIBUTING: KB entry format so community can PR entries (each PR runs
  eval regression).
- Optional Claude Code hook adapter + rules-file snippets for Cursor etc.

### Phase 3 — Refresh pipeline
- Weekly scheduled job: Agent-Reach + Exa scrape → LLM distill → open PR
  with KB diff → human review/merge.
- Every merge re-runs eval suite (regression gate).

### Phase 4 — Accuracy loop
- Grow evals from anonymized real usage (opt-in logging).
- LLM-judge scoring + human spot checks.
- User feedback signal (thumbs up/down on output) feeds eval set.

## Risks
- **Value vs baseline:** modern models already pick stacks decently. Evals
  in Phase 0 answer this before big investment.
- **Staleness:** `last_verified` dates + weekly pipeline + stale-flagging.
- **Hype pollution:** human-reviewed diffs keep scraped junk out of KB.
- **OSS scope creep:** web-apps-only scope enforced in v1; category field
  makes later expansion additive.

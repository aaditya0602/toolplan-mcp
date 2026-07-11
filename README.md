# ToolPlan MCP

Turn a raw project idea into a polished, cost-aware first prompt for any AI
coding agent.

## Why

Models pick tech stacks decently — but they:

1. **Under-recommend high-leverage open-source tools.** Niche skills, scrapers,
   and community tools from GitHub/Reddit (Agent-Reach, caveman,
   karpathy-guidelines, ...) save hours, and models rarely surface them
   unprompted. Programmers who don't track this ecosystem lose that time.
2. **Never apply cost-saving techniques on their own.** Subagent delegation,
   plan-first execution, task-by-task verification — models don't do these
   unless told, and casual users don't know to ask. Result: millions of
   wasted tokens.
3. **Do better with a structured first prompt.** A polished brief with stack,
   constraints, and done-criteria makes a project far more one-shotable —
   even on non-frontier models.

ToolPlan packages all three into one MCP tool call.

## How it works

```
your raw idea ──▶ plan_project(idea, grade) ──▶ enriched prompt
                        │
                  reads curated KB (kb/*.yaml):
                  stacks · tools · MCPs · skills · directives
                  each with why_models_miss_it + cost_profile
```

No live scraping at runtime — a weekly offline pipeline proposes KB updates
as human-reviewed diffs, so advice stays current without hype pollution.

## Usage

```jsonc
// MCP host config (e.g. Claude Code: claude mcp add)
{
  "toolplan": {
    "command": "node",
    "args": ["<path>/dist/index.js"]
  }
}
```

Then in your agent:

> Use plan_project with my idea: "an app that tracks freelance invoices",
> grade personal.

Paste the returned enriched prompt as your project's first prompt.

## Tool API

`plan_project(idea: string, grade: "industry" | "personal", tags?: string[])`
→ markdown enriched prompt: project brief, recommended stack, tools you'd
likely miss, execution directives, quality bar, sources.

## Knowledge base

One YAML file per entry under `kb/<category>/`. Format: [docs/KB_SCHEMA.md](docs/KB_SCHEMA.md).
Contributions welcome — PRs must pass the eval regression suite.

## Development

```sh
npm install
npm run build
npm test
npm run smoke   # end-to-end stdio call against the built server
```

## Status

v1: web-application scope only. See [PLAN.md](PLAN.md) for roadmap
(eval harness, refresh pipeline, host adapters).

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

## Quick start (Claude Code)

```sh
claude mcp add toolplan -- npx -y toolplan-mcp
```

Then either:

- **`/toolplan <your idea>`** — copy `commands/toolplan.md` (shipped in the
  npm package) to `~/.claude/commands/` first. The agent calls the tool,
  shows you the refined prompt verbatim, and waits for you to proceed, edit,
  or regenerate — it never starts building on its own.
- **`/mcp__toolplan__plan`** — zero-install; Claude Code auto-exposes the
  server's built-in `plan` prompt as a slash command.
- Or just ask in chat: *"Use plan_project with my idea: an app that tracks
  freelance invoices, grade personal."*

Other hosts (Cursor, Codex CLI, any stdio MCP host): see
[docs/HOST_SETUP.md](docs/HOST_SETUP.md).

## Tool API

`plan_project(idea: string, grade: "industry" | "personal", tags?: string[])`
→ markdown enriched prompt: project brief, recommended stack, tools you'd
likely miss, execution directives, quality bar, sources.

## Knowledge base

One YAML file per entry under `kb/<category>/`. Format: [docs/KB_SCHEMA.md](docs/KB_SCHEMA.md).
Contributions welcome — PRs must pass the eval regression suite.

**Privacy note:** running the tool never phones home. The KB is read-only at
runtime and bundled with the package; nobody's usage updates it. Optional
`TOOLPLAN_LOG` writes usage lines to a *local* file you control.

### Improving the KB

Three ways, smallest first:

1. **Add one entry by hand.** Copy an existing YAML in `kb/<category>/`,
   fill the fields honestly (especially `why_models_miss_it`), run
   `npm test && npm run eval`, open a PR.
2. **Mine your own usage.** Set `TOOLPLAN_LOG=toolplan.jsonl` in the server
   env, use the tool for a while, then `npm run log-to-case toolplan.jsonl`
   — real ideas become eval-case skeletons; weak matches show you exactly
   which keywords the KB is missing.
3. **Run the weekly refresh.** Point a Claude agent at
   [pipeline/REFRESH.md](pipeline/REFRESH.md); it researches new tools and
   writes proposals to `pipeline/proposals/<date>/` with evidence. You
   review `PROPOSAL.md`, move accepted files into `kb/`, run
   `npm test && npm run eval`, commit.

Staleness check anytime: `npm run stale`.

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

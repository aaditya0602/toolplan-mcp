# Weekly KB Refresh — Agent Prompt

You are running the weekly knowledge-base refresh for the ToolPlan MCP
project (this repo). Execute this file top to bottom. It is self-contained;
you need no other conversation context.

## Mission

ToolPlan's KB recommends under-the-radar OSS tools/skills/MCPs/stacks that
AI models rarely surface on their own, for **web-application projects only**
(SaaS, CRUD, frontend+backend, auth, payments, scraping/ingestion for web
apps). Your job: discover new candidates, re-verify stale entries, and
propose diffs. A human reviews everything — you never edit `kb/` and never
commit.

## Hard rules

- **Write only under `pipeline/proposals/<YYYY-MM-DD>/`** (today's date).
  Never modify `kb/`, `src/`, `evals/`, `docs/`, or config files. No git
  commits, no branches.
- Every proposed entry must follow `docs/KB_SCHEMA.md`. Essentials inlined:
  - Required fields: `name` (kebab-case, = filename stem), `category`
    (stack|tool|mcp|skill|directive), `summary`, `use_case_tags`,
    `keywords`, `grade` (industry|personal|both), `cost_profile`,
    `source_url` (real, you fetched it this run), `last_verified`
    (quoted "YYYY-MM-DD", today).
  - `why_models_miss_it` is **required** for tool/mcp/skill — it is the
    headline field. It must be specific ("models default to X because Y"),
    not generic ("it's niche").
  - No hype adjectives in `summary`/`cost_profile`; state what it does.
- **Token discipline:** cap discovery at ~15 candidates examined, ~5
  proposals written per run. Stop searching once you have a strong slate.

## Step 1 — Inventory (avoid duplicates)

List existing entries so you never propose a duplicate or near-duplicate:

```
Glob kb/**/*.yaml
```

Also treat *conceptual* duplicates as duplicates: if the KB has
`trigger-dev`, don't propose another background-job runner unless it clearly
beats it for a use case the KB doesn't cover (say which, in PROPOSAL.md).

## Step 2 — Discovery

Work through `pipeline/SOURCES.yaml`. For each source use the listed
`queries` with WebSearch/WebFetch.

**If the Agent-Reach CLI is installed** (check: `agent-reach --version`),
prefer it for Reddit/HN/Twitter:

```
agent-reach search reddit "<query>" --sub ClaudeCode
agent-reach search reddit "<query>" --sub ClaudeAI
agent-reach search hn "<query>"
agent-reach search twitter "<query>"
```

If the command is missing or errors, degrade silently to WebSearch
(`reddit r/ClaudeCode <query>`, `site:news.ycombinator.com Show HN <query>`)
— do not install anything.

**Candidate filter — all must hold:**

1. **Web-app scope** (v1): useful when building SaaS/CRUD/frontend+backend
   apps, or in the agent workflow around building them. Desktop tools,
   model runtimes, generic AI infra → reject.
2. **Genuinely active:** a release or substantive commit within ~90 days.
   Fetch the repo and check; don't trust the search snippet.
3. **OSS or generous free tier** (self-hostable counts; a source-available
   license like AGPL is fine — note it).
4. **Beats the model default:** you can name what a model recommends
   instead today (e.g. "raw Stripe", "hand-rolled scraper", "console.log
   debugging") and why this is better. If you can't, reject.
5. **Adoption signal:** stars/downloads/discussion beyond its own launch
   post. Reject launch-day/launch-week projects however shiny.

Record every candidate you *reject* and the one-line reason — it goes in
PROPOSAL.md so the human sees your filtering, and next week's run doesn't
re-litigate it.

## Step 3 — Re-verification of existing entries

Find stale entries (>60 days since verification):

```
npm run stale -- --days 60
```

**Note:** `stale` is declared in package.json but `scripts/stale.ts` may not
exist yet. If the command fails, do it manually:

```
grep -rh "^last_verified:" kb/ | sort | uniq -c
```

and flag any date older than 60 days from today. For each stale entry:

1. WebFetch its `source_url`.
2. If alive and still matches the entry's `summary`: propose an update that
   only bumps `last_verified` to today (full replacement YAML, Step 4
   naming).
3. If dead, renamed, archived, or pivoted away from the entry's use case:
   do **not** silently rewrite it — flag it in PROPOSAL.md under
   "Flagged dead/changed" with what you found, and propose a replacement
   entry only if you have a verified one.

If nothing is stale, say so in PROPOSAL.md and move on.

## Step 4 — Write proposals

Output directory: `pipeline/proposals/<YYYY-MM-DD>/` (create it).

- New entry → `<category-dir>--<name>.yaml` (e.g. `tools--polar.yaml`,
  `mcps--chrome-devtools-mcp.yaml`). Category dir names: `stacks`, `tools`,
  `mcps`, `skills`, `directives`.
- Update to an existing entry → same convention, full replacement YAML
  (not a diff), same `name` as the current kb entry.
- `PROPOSAL.md` in the same directory: summary table with three sections —
  **New**, **Updated**, **Flagged dead/changed** — one line of evidence per
  row (activity date, adoption signal) with source links, plus the
  **Rejected candidates** list with reasons.

Never write into `kb/` directly. Never commit.

## Step 5 — Validate proposals

Parse-check every proposal file against the real loader (build first if
`dist/kb.js` is missing: `npm run build`):

```
node -e "import('./dist/kb.js').then(m => { const e = m.loadKb('pipeline/proposals/<YYYY-MM-DD>'); console.log('OK', e.length, 'entries:', e.map(x=>x.name).join(', ')); })"
```

The loader throws on the first invalid file with the field-level reason.
Fix and re-run until it prints `OK <n> entries`. A run that ends with
invalid proposals is a failed run.

Notes: PROPOSAL.md living in the same directory is fine — the loader only
reads `*.yaml`/`*.yml`. The loader validates schema only, not the filename
convention: double-check each file is named `<category-dir>--<name>.yaml`
and that `name` matches the stem after `--`.

## Step 6 — Hand off to human

End your run by printing these instructions (do not perform them):

> Review `pipeline/proposals/<date>/PROPOSAL.md`. For each accepted file,
> move it to `kb/<category-dir>/<name>.yaml` (strip the `<category-dir>--`
> prefix). Then run `npm test && npm run eval` — both must pass before
> committing. Reject by deleting the proposal file.

---
description: Refine a raw project idea into a polished, cost-aware first prompt via the ToolPlan MCP server
---

Call the `plan_project` tool on the `toolplan` MCP server with:

- `idea`: $ARGUMENTS
- `grade`: infer from the idea — "industry" if it sounds like a production/business/revenue app, otherwise "personal". If genuinely ambiguous, ask me one short question first.

Then:

1. Run the searches listed in the result's "Live Crosscheck" section (use
   your web search tool). If a finding clearly beats or complements a
   curated pick — a newer tool, a free API/hosting program, a practitioner
   consensus shift — append it to the prompt under a "Fresh findings
   (unverified — from live search)" heading with source links. When in
   doubt, keep the curated pick. No web access? Skip silently.
2. Show me the final enriched prompt **verbatim** in a markdown block
   (crosscheck findings included).
3. Do NOT start building, planning, or scaffolding anything yet.
4. Ask whether I want to (a) proceed with it as-is, (b) edit it first, or (c) tweak the grade/tags and regenerate.

If the `toolplan` MCP server is not connected, tell me to run:
`claude mcp add toolplan -- npx -y toolplan-mcp`

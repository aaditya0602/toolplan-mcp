---
description: Refine a raw project idea into a polished, cost-aware first prompt via the ToolPlan MCP server
---

Call the `plan_project` tool on the `toolplan` MCP server with:

- `idea`: $ARGUMENTS
- `grade`: infer from the idea — "industry" if it sounds like a production/business/revenue app, otherwise "personal". If genuinely ambiguous, ask me one short question first.

Then:

1. Show me the returned enriched prompt **verbatim** in a markdown block.
2. Do NOT start building, planning, or scaffolding anything yet.
3. Ask whether I want to (a) proceed with it as-is, (b) edit it first, or (c) tweak the grade/tags and regenerate.

If the `toolplan` MCP server is not connected, tell me to run:
`claude mcp add toolplan -- npx -y toolplan-mcp`

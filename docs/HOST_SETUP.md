# Host setup

How to register the ToolPlan MCP server in different hosts, and how to get
an agent to actually call `plan_project` without you remembering to ask.

## Claude Code

From npm (once published):

```sh
claude mcp add toolplan -- npx -y toolplan-mcp
```

From a local clone / build (no publish needed):

```sh
npm install
npm run build
claude mcp add toolplan -- node "<absolute-path-to-repo>/dist/index.js"
```

Verify it's registered: `claude mcp list`.

## Cursor

Add to `.cursor/mcp.json` (project-level) or the global Cursor MCP config:

```jsonc
{
  "mcpServers": {
    "toolplan": {
      "command": "npx",
      "args": ["-y", "toolplan-mcp"]
    }
  }
}
```

Or pointing at a local build:

```jsonc
{
  "mcpServers": {
    "toolplan": {
      "command": "node",
      "args": ["<absolute-path-to-repo>/dist/index.js"]
    }
  }
}
```

## Generic stdio host

Any MCP host that speaks stdio takes the same shape — command + args, no
network config:

```jsonc
{
  "toolplan": {
    "command": "node",
    "args": ["<path>/dist/index.js"],
    "env": {
      "KB_DIR": "<optional: override bundled KB path>",
      "TOOLPLAN_LOG": "<optional: path to append JSONL usage logs>"
    }
  }
}
```

## Make it automatic

**Be honest with yourself here: MCP does not let a server intercept or
rewrite your prompts.** Registering the server only makes the `plan_project`
tool *available* — nothing calls it unless the agent (or you) decides to.
There are two practical ways to make that happen more often:

### (a) A CLAUDE.md / rules-file instruction

Add a line to your project or user `CLAUDE.md` (or the equivalent rules file
for your host) telling the agent to use the tool proactively:

```markdown
# Project planning
Before starting any new project or major feature from scratch, call the
`plan_project` MCP tool (idea, grade: "industry" | "personal") and use its
output as the basis for the plan. Don't skip this for "obviously simple"
ideas — the tool surfaces tools and directives you wouldn't otherwise think
to check.
```

This works because agents read CLAUDE.md-style files as standing
instructions each session — but it's still the *agent* deciding to comply,
not the MCP protocol forcing it.

### (b) Ask for it directly in chat

The simplest, most reliable trigger is just asking:

> Use plan_project on this idea: "an app that tracks freelance invoices and
> emails clients when payments are late", grade personal.

Paste the tool's output back as your project's first prompt (or let the
agent do so directly if it already has the tool result in context).

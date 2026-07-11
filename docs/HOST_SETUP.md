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

### `/toolplan` slash command

Two options, use either or both:

1. **Native MCP prompt (zero install):** once the server is registered,
   Claude Code auto-exposes the server's `plan` prompt as
   `/mcp__toolplan__plan`. Type it, pass your idea, done.
2. **Clean `/toolplan` name:** copy [commands/toolplan.md](../commands/toolplan.md)
   into `~/.claude/commands/` (all projects) or `<project>/.claude/commands/`
   (one project):

   ```sh
   # from a clone
   cp commands/toolplan.md ~/.claude/commands/toolplan.md
   # or from the installed npm package
   cp node_modules/toolplan-mcp/commands/toolplan.md ~/.claude/commands/toolplan.md
   ```

   Then: `/toolplan an app that tracks freelance invoices` → the agent calls
   `plan_project`, shows you the refined prompt verbatim, and waits for your
   go-ahead (proceed / edit / regenerate) before building anything.

## OpenAI Codex CLI

Register the server in `~/.codex/config.toml`:

```toml
[mcp_servers.toolplan]
command = "npx"
args = ["-y", "toolplan-mcp"]
```

For a `/toolplan` custom prompt, copy
[commands/codex-toolplan.md](../commands/codex-toolplan.md) to
`~/.codex/prompts/toolplan.md`.

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

Cursor has no per-command slash files; either invoke the tool in chat
("use plan_project on this idea: ...") or add the rules-file instruction
from "Make it automatic" below to `.cursor/rules`.

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

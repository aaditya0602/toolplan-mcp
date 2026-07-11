# /toolplan for OpenAI Codex CLI — copy this file to ~/.codex/prompts/toolplan.md

Call the `plan_project` tool on the `toolplan` MCP server with:

- `idea`: the text I passed after the command
- `grade`: "industry" for production/business apps, otherwise "personal"; ask me if ambiguous.

Run the searches in the result's "Live Crosscheck" section if you have web
access; append clearly-better findings under "Fresh findings (unverified)"
with source links. Then show the final enriched prompt verbatim in a
markdown block. Do not start building until I confirm or hand back an
edited version.

If the server is missing, tell me to add to ~/.codex/config.toml:

```toml
[mcp_servers.toolplan]
command = "npx"
args = ["-y", "toolplan-mcp"]
```

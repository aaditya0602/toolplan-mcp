#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadKb } from "./kb.js";
import { handlePlanProject } from "./handler.js";

// When installed from npm, cwd-relative "./kb" won't exist next to the
// process — resolve the bundled KB relative to this module file instead.
// KB_DIR still overrides for local dev / custom KB locations.
const defaultKbDir = join(dirname(fileURLToPath(import.meta.url)), "..", "kb");
const kbDir = process.env.KB_DIR ?? defaultKbDir;
const entries = loadKb(kbDir);

// Phase 4 groundwork: if set, append one JSONL usage line per plan_project
// call. See src/handler.ts for the log line shape.
const logPath = process.env.TOOLPLAN_LOG;

const server = new McpServer({ name: "toolplan-mcp", version: "0.1.0" });

server.registerTool(
  "plan_project",
  {
    title: "Plan Project",
    description:
      "Turns a raw project idea into an enriched, polished prompt using a curated knowledge base of stacks, tools, MCPs, skills, and execution directives.",
    inputSchema: {
      idea: z.string().min(10, "idea must be at least 10 characters"),
      grade: z.enum(["industry", "personal"]),
      tags: z.array(z.string()).optional(),
    },
  },
  async ({ idea, grade, tags }) => handlePlanProject(entries, { idea, grade, tags }, logPath)
);

const transport = new StdioServerTransport();
await server.connect(transport);

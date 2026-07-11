import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadKb } from "./kb.js";
import { matchEntries } from "./match.js";
import { buildPrompt } from "./template.js";

const kbDir = process.env.KB_DIR ?? "./kb";
const entries = loadKb(kbDir);

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
  async ({ idea, grade, tags }) => {
    const matchResult = matchEntries(entries, idea, grade, tags ?? []);
    const prompt = buildPrompt(idea, grade, matchResult);
    return { content: [{ type: "text", text: prompt }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

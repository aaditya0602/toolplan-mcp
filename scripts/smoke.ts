import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
    env: { ...process.env, KB_DIR: "kb" },
  });

  const client = new Client({ name: "toolplan-smoke", version: "0.1.0" });
  await client.connect(transport);

  const result = await client.callTool({
    name: "plan_project",
    arguments: {
      idea: "A SaaS dashboard that scrapes competitor prices and shows trends",
      grade: "personal",
    },
  });

  const content = result.content as Array<{ type: string; text?: string }>;
  const text = content.find((c) => c.type === "text")?.text;
  if (!text) {
    throw new Error("No text content returned from plan_project");
  }

  console.log(text);
  await client.close();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Smoke test failed:", err);
    process.exit(1);
  });

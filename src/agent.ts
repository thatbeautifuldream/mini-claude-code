import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { groq } from "@ai-sdk/groq";
import { ToolLoopAgent, stepCountIs, type ToolSet } from "ai";
import { createBashTool, type BashToolkit } from "bash-tool";
import { DANGEROUS_COMMANDS, INSTRUCTIONS, MODEL_ID } from "./cst/constants.js";
import type {
  TAfterBashCallInput,
  TAfterBashCallOutput,
  TAgentKit,
  TBeforeBashCallInput,
  TBeforeBashCallOutput,
} from "./cst/types.js";

function buildDirectoryListing(dir: string, maxLines = 150): string {
  const lines: string[] = [`# Workspace: ${dir}`, ""];
  let count = 0;

  function walk(current: string) {
    if (count >= maxLines) return;
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (count >= maxLines) break;
      if (
        ["node_modules", ".git", "dist", "build", ".next", "coverage"].includes(
          entry,
        )
      )
        continue;
      const full = join(current, entry);
      const rel = relative(dir, full);
      let stat: ReturnType<typeof statSync>;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        lines.push(`${rel}/`);
        walk(full);
      } else {
        lines.push(rel);
        count++;
      }
    }
  }

  walk(dir);
  if (count >= maxLines) lines.push(`... (truncated at ${maxLines} files)`);
  lines.push(
    "",
    "Use readFile or bash cat to read any file. Use bash ls/find to explore further.",
  );
  return lines.join("\n");
}

export async function createAgent(seedDir: string | null): Promise<TAgentKit> {
  const bashToolkit: BashToolkit = await createBashTool({
    destination: "/workspace",
    maxOutputLength: 4000,
    files: seedDir
      ? { "WORKSPACE_INFO.txt": buildDirectoryListing(seedDir) }
      : undefined,
    extraInstructions: `\
- Working directory is /workspace
- WORKSPACE_INFO.txt contains the file index; use it to navigate
- Commands have a maximum output of 4,000 characters; large outputs are truncated
- Use head -n 50 / tail -n 50 instead of cat for large files
- Use grep to search for specific content rather than reading whole files
- Use --color=never with grep for cleaner output
`,
    onBeforeBashCall: ({
      command,
    }: TBeforeBashCallInput): TBeforeBashCallOutput | undefined => {
      const trimmedCmd = command.trim();
      for (const dangerous of DANGEROUS_COMMANDS) {
        if (trimmedCmd.includes(dangerous)) {
          console.warn(`⚠️  Blocked dangerous command: ${command}`);
          return {
            command: `echo "Error: Potentially dangerous command blocked. Command: ${command}"`,
          };
        }
      }
    },
    onAfterBashCall: ({
      command,
      result,
    }: TAfterBashCallInput): TAfterBashCallOutput | undefined => {
      if (result.exitCode !== 0) {
        const errorMsg = result.stderr.trim() || result.stdout.trim();
        console.warn(
          `⚠️  Command failed (exit ${result.exitCode}): ${command}`,
        );
        if (errorMsg) {
          console.warn(
            `   Error output: ${errorMsg.slice(0, 200)}${errorMsg.length > 200 ? "..." : ""}`,
          );
        }
      }
      return undefined;
    },
  });

  const agent = new ToolLoopAgent<never, ToolSet>({
    model: groq(MODEL_ID),
    tools: bashToolkit.tools as unknown as ToolSet,
    instructions: INSTRUCTIONS,
    stopWhen: stepCountIs(50),
  });

  return { agent, modelId: MODEL_ID, messages: [] };
}

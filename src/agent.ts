import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { groq } from "@ai-sdk/groq";
import { ToolLoopAgent, stepCountIs, type ToolSet } from "ai";
import { createBashTool, type BashToolkit } from "bash-tool";
import {
  DANGEROUS_COMMANDS,
  INSTRUCTIONS,
  MODEL_ID,
  UPLOAD_INCLUDE_PATTERN,
  SKIP_DIRS,
} from "./cst/constants.js";
import type {
  TAfterBashCallInput,
  TAfterBashCallOutput,
  TAgentKit,
  TBeforeBashCallInput,
  TBeforeBashCallOutput,
} from "./cst/types.js";

function buildDirectoryListing(dir: string, maxLines = 300): string {
  const lines: string[] = [`# Workspace: ${dir}`, ""];
  let count = 0;

  function walk(current: string, depth = 0) {
    if (count >= maxLines || depth > 8) return;
    let entries: string[];
    try {
      entries = readdirSync(current).sort();
    } catch {
      return;
    }
    for (const entry of entries) {
      if (count >= maxLines) break;
      if (SKIP_DIRS.has(entry)) continue;
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
        walk(full, depth + 1);
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
    "All files above are available in /workspace/. Use readFile <path> to read any of them.",
  );
  return lines.join("\n");
}

export async function createAgent(seedDir: string | null): Promise<TAgentKit> {
  const bashToolkit: BashToolkit = await createBashTool({
    destination: "/workspace",
    maxOutputLength: 4000,
    // Upload actual source files so the agent can readFile them directly.
    // When no seedDir, only the WORKSPACE_INFO placeholder is written (via files below).
    ...(seedDir
      ? {
          uploadDirectory: {
            source: seedDir,
            include: UPLOAD_INCLUDE_PATTERN,
          },
          files: {
            "WORKSPACE_INFO.txt": buildDirectoryListing(seedDir),
          },
        }
      : {}),
    extraInstructions: `\
- All files are pre-loaded in /workspace/ — use readFile for direct access (faster than bash cat)
- WORKSPACE_INFO.txt at /workspace/WORKSPACE_INFO.txt is your file index
- Commands are capped at 4,000 chars output; use head/tail/grep to stay under the limit
- Use grep -rn --color=never for searching; use --include="*.ext" to narrow scope
`,
    onBeforeBashCall: ({
      command,
    }: TBeforeBashCallInput): TBeforeBashCallOutput | undefined => {
      const trimmedCmd = command.trim();
      for (const dangerous of DANGEROUS_COMMANDS) {
        if (trimmedCmd.includes(dangerous)) {
          console.warn(`⚠️  Blocked dangerous command: ${command}`);
          return {
            command: `echo "Error: Potentially dangerous command blocked: ${dangerous}"`,
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
            `   ${errorMsg.slice(0, 200)}${errorMsg.length > 200 ? "…" : ""}`,
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

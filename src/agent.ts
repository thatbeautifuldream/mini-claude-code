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

export async function createAgent(seedDir: string | null): Promise<TAgentKit> {
  const bashToolkit: BashToolkit = await createBashTool({
    destination: "/workspace",
    maxOutputLength: 50000,
    maxFiles: 500,
    uploadDirectory: seedDir ? { source: seedDir, include: "**/*" } : undefined,
    extraInstructions: `\
- Working directory is /workspace
- All file operations are relative to /workspace
- When searching, prefer grep -r or rg if available
- Commands have a maximum output length of 50,000 characters
- Large outputs will be truncated with a message
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

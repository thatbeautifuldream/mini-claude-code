import { openai } from "@ai-sdk/openai";
import { ToolLoopAgent, stepCountIs, type ToolSet } from "ai";
import { createBashTool, type BashToolkit } from "bash-tool";
import { Bash, defineCommand, type CommandContext, ReadWriteFs } from "just-bash";
import { DANGEROUS_COMMANDS, INSTRUCTIONS } from "./cst/constants.js";
import type {
  TBashCommand,
  TAfterBashCallInput,
  TAfterBashCallOutput,
  TAgentKit,
  TBeforeBashCallInput,
  TBeforeBashCallOutput,
} from "./cst/types.js";

const createExplainCommand: TBashCommand = async (args: string[], ctx: CommandContext) => {
  const path = args[0];
  if (!path) {
    return { stderr: "Usage: explain <file-path>", exitCode: 1, stdout: "" };
  }
  try {
    const content = await ctx.fs.readFile(path);
    return {
      stdout: `File: ${path}\n${"-".repeat(60)}\n\n${content}\n\nTo analyze this code, use AI tools or bash commands to understand its purpose.`,
      stderr: "",
      exitCode: 0,
    };
  } catch (e) {
    return {
      stderr: `Error reading file: ${(e as Error).message}`,
      exitCode: 1,
      stdout: "",
    };
  }
};

const createLintCommand: TBashCommand = async (args: string[], ctx: CommandContext) => {
  const path = args[0] || ".";
  try {
    const packageFile = await ctx.fs.readFile("package.json").catch(() => null);
    const pyProject = await ctx.fs.readFile("pyproject.toml").catch(() => null);

    const results: string[] = [
      `# Code quality analysis for: ${path}`,
      "",
    ];

    if (packageFile) {
      results.push(
        "## JavaScript/TypeScript Project Detected",
        "Run these commands for linting:",
        "  npm run lint    # Run linter",
        "  npm run typecheck  # Type check",
        "  npm test         # Run tests",
        "",
      );
    } else if (pyProject) {
      results.push(
        "## Python Project Detected",
        "Run these commands for linting:",
        "  ruff check .    # Run ruff linter",
        "  mypy .         # Type check with mypy",
        "  pytest         # Run tests",
        "",
      );
    } else {
      results.push(
        "## General linting suggestions",
        `  grep -rn 'TODO\\|FIXME' ${path}`,
        `  grep -rn 'console.log\\|print(' ${path}`,
        "",
      );
    }

    return { stdout: results.join("\n"), stderr: "", exitCode: 0 };
  } catch (e) {
    return {
      stderr: `Error: ${(e as Error).message}`,
      exitCode: 1,
      stdout: "",
    };
  }
};

const createDepsCommand: TBashCommand = async (_args: string[], ctx: CommandContext) => {
  try {
    const packageFile = await ctx.fs.readFile("package.json").catch(() => null);
    const pyProject = await ctx.fs.readFile("pyproject.toml").catch(() => null);

    if (packageFile) {
      return { stdout: packageFile, stderr: "", exitCode: 0 };
    } else if (pyProject) {
      return { stdout: pyProject, stderr: "", exitCode: 0 };
    } else {
      return {
        stdout:
          "No package file found (package.json, pyproject.toml, Cargo.toml)",
        stderr: "",
        exitCode: 0,
      };
    }
  } catch (e) {
    return {
      stderr: `Error: ${(e as Error).message}`,
      exitCode: 1,
      stdout: "",
    };
  }
};

const CUSTOM_COMMANDS = [
  defineCommand("explain", createExplainCommand),
  defineCommand("lint", createLintCommand),
  defineCommand("deps", createDepsCommand),
];

function createBashWithSafety(rootPath: string): Bash {
  return new Bash({
    cwd: "/",
    fs: new ReadWriteFs({ root: rootPath }),
    customCommands: CUSTOM_COMMANDS,
    executionLimits: {
      maxCallDepth: 50,
      maxCommandCount: 10000,
      maxLoopIterations: 10000,
      maxAwkIterations: 10000,
      maxSedIterations: 10000,
    },
    network: {
      allowedUrlPrefixes: [
        "https://registry.npmjs.org/",
        "https://pypi.org/",
        "https://raw.githubusercontent.com/",
        "https://api.github.com/",
      ],
      allowedMethods: ["GET", "HEAD"],
    },
  });
}

export async function createAgent(rootPath: string): Promise<TAgentKit> {
  const customBash = createBashWithSafety(rootPath);

  const bashToolkit: BashToolkit = await createBashTool({
    sandbox: customBash,
    destination: "/",
    maxOutputLength: 4000,
    extraInstructions: `\
- All files are on your filesystem — use readFile for direct access
- Commands are capped at 4,000 chars output; use head/tail/grep to stay under limit
- Use grep -rn --color=never for searching; use --include="*.ext" to narrow scope
- Network access: curl is available for specific domains (npm, PyPI, GitHub)
- Custom commands available: explain <file>, lint [path], deps
- All writes go directly to your filesystem (CAUTION: changes are permanent)
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
    model: openai("gpt-4o"),
    tools: bashToolkit.tools as unknown as ToolSet,
    instructions: INSTRUCTIONS,
    stopWhen: stepCountIs(50),
  });

  return { agent, modelId: "gpt-4o", messages: [] };
}

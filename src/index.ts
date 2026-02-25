#!/usr/bin/env bun
import { execSync } from "child_process";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  note,
  outro,
  spinner,
  text,
} from "@clack/prompts";
import type { ModelMessage, StepResult, ToolSet } from "ai";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import pc from "picocolors";
import { createAgent } from "./agent.js";
import { MAX_HISTORY_CHARS, MODEL_ID } from "./cst/constants.js";
import type { TAgentKit } from "./cst/types.js";
import { formatToolEvent } from "./ui.js";

marked.setOptions({
  renderer: new TerminalRenderer() as any,
});

// ── Slash commands ────────────────────────────────────────────────────────────

const HELP_TEXT = [
  `${pc.bold("Slash commands:")}`,
  `  ${pc.cyan("/help")}   Show this message`,
  `  ${pc.cyan("/clear")}  Clear conversation history (keeps sandbox files)`,
  `  ${pc.cyan("/git")}    Show git status + last 5 commits`,
  `  ${pc.cyan("/exit")}   Quit`,
  "",
  `${pc.bold("Tips:")}`,
  `  • The agent can read, write, and run any code in the sandbox`,
  `  • Use ${pc.cyan("/clear")} when the context gets stale`,
  `  • Files are uploaded to /workspace at startup`,
].join("\n");

function tryGitContext(cwd: string): string | null {
  try {
    const status = execSync("git status --short", {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const log = execSync("git log --oneline -5", {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return [
      `Branch: ${pc.cyan(branch)}`,
      status ? `\nChanged files:\n${status}` : "\nWorking tree clean",
      log ? `\nRecent commits:\n${log}` : "",
    ].join("");
  } catch {
    return null;
  }
}

// ── Message history ───────────────────────────────────────────────────────────

function trimMessages(messages: ModelMessage[]): ModelMessage[] {
  let total = 0;
  const kept: ModelMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const size = JSON.stringify(messages[i]).length;
    if (total + size > MAX_HISTORY_CHARS && kept.length > 0) break;
    kept.unshift(messages[i]);
    total += size;
  }
  // Drop leading orphaned tool messages
  while (kept.length > 0 && kept[0].role === "tool") kept.shift();
  return kept;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log();
  intro(pc.bgCyan(pc.black(" mini-claude-code ")) + pc.dim(`  ${MODEL_ID}`));

  const cwd = process.cwd();
  log.info(`Working directory: ${pc.cyan(cwd)}`);

  const gitCtx = tryGitContext(cwd);
  if (gitCtx) log.info(gitCtx);

  const shouldSeed = await confirm({
    message: "Upload workspace files to sandbox? (recommended — lets agent read files directly)",
    initialValue: true,
  });

  if (isCancel(shouldSeed)) {
    cancel("Cancelled.");
    process.exit(0);
  }

  const s = spinner();
  s.start("Initialising sandbox and uploading files…");

  let agentKit: TAgentKit;
  try {
    agentKit = await createAgent(shouldSeed ? cwd : null);
    s.stop("Sandbox ready ✓");
  } catch (err) {
    s.stop(pc.red("Failed to start sandbox"));
    log.error(String(err));
    process.exit(1);
  }

  note(
    [
      `${pc.bold("Tools:")}   bash · readFile · writeFile`,
      `${pc.bold("Model:")}   ${pc.cyan(agentKit.modelId)} ${pc.dim("(Groq)")}`,
      `${pc.bold("Commands:")} /help · /clear · /git · /exit`,
    ].join("\n"),
    "Ready",
  );

  // ── REPL ──────────────────────────────────────────────────────────────────

  while (true) {
    console.log();
    const input = await text({
      message: pc.green("You"),
      placeholder: "Ask me to do something with your code… (or /help)",
      validate(v) {
        if (!(v ?? "").trim()) return "Please enter a message.";
      },
    });

    if (isCancel(input)) {
      cancel("Session ended.");
      break;
    }

    const userMsg = String(input).trim();

    // Slash commands
    if (userMsg === "/exit" || userMsg === "exit" || userMsg === "quit") break;

    if (userMsg === "/help") {
      log.message(HELP_TEXT);
      continue;
    }

    if (userMsg === "/clear") {
      agentKit.messages = [];
      log.success("Conversation history cleared.");
      continue;
    }

    if (userMsg === "/git") {
      const ctx = tryGitContext(cwd);
      log.message(ctx ?? pc.dim("Not a git repository."));
      continue;
    }

    try {
      await runTurn(agentKit, userMsg);
    } catch (err) {
      log.error(`Agent error: ${String(err)}`);
    }
  }

  outro(pc.green("Goodbye!"));
}

// ── Run a single turn ─────────────────────────────────────────────────────────

async function runTurn(kit: TAgentKit, userMsg: string) {
  kit.messages.push({ role: "user", content: userMsg });
  const trimmed = trimMessages(kit.messages);

  const sp = spinner();
  sp.start(pc.dim("Thinking…"));

  const toolEvents: string[] = [];
  const textParts: string[] = [];
  let totalIn = 0,
    totalOut = 0;
  let stepCount = 0;

  const result = await kit.agent.stream({
    messages: trimmed,
    onStepFinish(stepResult: StepResult<ToolSet>) {
      stepCount++;
      if (stepResult.toolCalls.length > 0) {
        const toolName = stepResult.toolCalls[0].toolName;
        sp.message(pc.dim(`Step ${stepCount}: ${toolName}…`));
      }
      for (const tr of stepResult.toolResults) {
        toolEvents.push(formatToolEvent(tr));
      }
      totalIn += stepResult.usage?.inputTokens ?? 0;
      totalOut += stepResult.usage?.outputTokens ?? 0;
    },
  });

  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      textParts.push(part.text);
    } else if (part.type === "error") {
      throw part.error as Error;
    }
  }

  sp.stop(
    pc.dim(
      `Done  ${pc.gray(`[${stepCount} steps · ${totalIn}↑ ${totalOut}↓ tokens]`)}`,
    ),
  );

  const response = await result.response;
  for (const msg of response.messages as ModelMessage[]) {
    kit.messages.push(msg);
  }

  for (const ev of toolEvents) log.step(ev);

  const fullText = textParts.join("");
  if (fullText.trim()) {
    const renderedMarkdown = await Promise.resolve(marked(fullText));
    log.message(renderedMarkdown as string);
  }
}

main().catch((err) => {
  console.error(pc.red("Fatal error:"), err);
  process.exit(1);
});

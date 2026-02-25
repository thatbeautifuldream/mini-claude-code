#!/usr/bin/env bun
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
import { MODEL_ID } from "./cst/constants.js";
import type { TAgentKit } from "./cst/types.js";
import { formatToolEvent } from "./ui.js";

marked.setOptions({
  renderer: new TerminalRenderer() as any,
});

async function main() {
  console.log();
  intro(pc.bgCyan(pc.black(" mini-claude-code ")) + pc.dim(`  ${MODEL_ID}`));

  const cwd = process.cwd();
  log.info(`Working directory: ${pc.cyan(cwd)}`);

  const shouldSeed = await confirm({
    message: "Seed the sandbox with files from the current directory?",
    initialValue: true,
  });

  if (isCancel(shouldSeed)) {
    cancel("Cancelled.");
    process.exit(0);
  }

  const s = spinner();
  s.start("Initialising bash sandbox…");

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
      `${pc.bold("Tools:")}  bash · readFile · writeFile`,
      `${pc.bold("Model:")}  ${pc.cyan(agentKit.modelId)} ${pc.dim("(Groq)")}`,
      `${pc.bold("Type")} ${pc.cyan("exit")} to quit, ${pc.cyan("Ctrl+C")} to abort.`,
    ].join("\n"),
    "Ready",
  );

  while (true) {
    console.log();
    const input = await text({
      message: pc.green("You"),
      placeholder: "Ask me to do something with your code…",
      validate(v) {
        if (!(v ?? "").trim()) return "Please enter a message.";
      },
    });

    if (isCancel(input)) {
      cancel("Session ended.");
      break;
    }

    const userMsg = String(input).trim();
    if (userMsg === "exit" || userMsg === "quit") break;

    try {
      await runTurn(agentKit, userMsg);
    } catch (err) {
      log.error(`Agent error: ${String(err)}`);
    }
  }

  outro(pc.green("Goodbye!"));
}

async function runTurn(kit: TAgentKit, userMsg: string) {
  kit.messages.push({ role: "user", content: userMsg });

  const sp = spinner();
  sp.start(pc.dim("Thinking…"));

  const toolEvents: string[] = [];
  const textParts: string[] = [];

  const result = await kit.agent.stream({
    messages: kit.messages,
    onStepFinish(stepResult: StepResult<ToolSet>) {
      if (stepResult.toolCalls.length > 0) {
        sp.message(pc.dim(`Running ${stepResult.toolCalls[0].toolName}…`));
      }
      for (const tr of stepResult.toolResults) {
        toolEvents.push(formatToolEvent(tr));
      }
    },
  });

  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      textParts.push(part.text);
    } else if (part.type === "error") {
      throw part.error as Error;
    }
  }

  sp.stop(pc.dim("Done"));

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

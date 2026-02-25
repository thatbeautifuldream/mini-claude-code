# mini-claude-code

A coding agent that can run commands, read files, and write files.

## What It Does

You chat with an AI agent that can:

- Run bash commands (ls, grep, git, etc.)
- Read files from your project
- Create or edit files

The agent thinks step-by-step, calling tools until it has enough information to answer your question.

## How to Use

```bash
bun install
export GROQ_API_KEY=gsk_...
bun run dev
```

## Example

```
You: Add a function to sum two numbers in src/utils.ts

→ readFile src/utils.ts
→ writeFile src/utils.ts (45 bytes)

Done. I added a sum function that takes two numbers and returns their result.
```

## Tech Stack

- **[AI SDK](https://ai-sdk.dev)** - ToolLoopAgent handles the agent loop
- **[Groq](https://groq.com)** - Fast AI inference with `openai/gpt-oss-120b`
- **[bash-tool](https://www.npmjs.com/package/bash-tool)** - Provides bash, readFile, writeFile tools
- **[@clack/prompts](https://www.npmjs.com/package/@clack/prompts)** - Beautiful CLI interface
- **[Bun](https://bun.sh)** - Runtime

## How It Works

1. Agent receives your request
2. Agent decides which tools to use
3. Tools execute and return results
4. Agent sees results and decides next action
5. Repeat until agent responds to you

## Safety

- Dangerous commands are blocked (rm -rf /, etc.)
- Commands run in sandboxed environment
- Command output is limited to prevent memory issues

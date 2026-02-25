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
export OPENAI_API_KEY=gsk_...
bun run dev
```

## Example

```bash
mini-claude-code on  main [!] is 📦 v0.0.1 via 🥟 v1.2.18 took 8m35s
❯ bun run dev
$ bun run src/index.ts

┌   mini-claude-code
│
●  Working directory: /Users/milind/Downloads/mini-claude-code
│
●  Branch: main
│  Changed files:
│  M bun.lock
│   M package.json
│   M src/agent.ts
│   M src/cst/constants.ts
│   M src/index.ts
│  Recent commits:
│  295825e feat: enhance agent functionality with git context commands and improved help text
│  bc3d435 feat: optimisations for free tier
│  000e848 feat: enhance agent configuration with dynamic include pattern and constants
│  1296437 feat: update build and symlink script
│  14340e5 feat: init mini cc
│
◇  Upload workspace files to sandbox? (recommended — lets agent read files directly)
│  Yes
│
◇  Sandbox ready ✓
│
◇  Ready ───────────────────────────────────╮
│                                           │
│  Tools:   bash · readFile · writeFile     │
│  Model:   gpt-4o (OpenAI)                 │
│  Commands: /help · /clear · /git · /exit  │
│                                           │
├───────────────────────────────────────────╯

│
◇  You
│  What is this repository about?
│
◇  Done  [2 steps · 1428↑ 158↓ tokens]
│
◇  readFile README.md
│
│  This repository is about a coding agent called mini-claude-code. It provides functionality to:
│
│      * Run bash commands.
│      * Read and write files in the project.
│      * Perform tasks step-by-step using AI to interact with files and commands.
│
│  ### Tech Stack
│
│      * **AI SDK** for handling agent loops.
│      * **Groq** for AI inference.
│      * **bash-tool** for executing bash commands and file operations.
│      * **@clack/prompts** for a CLI interface.
│      * **Bun** as the runtime.
│
│  ### Usage
│
│  You can interact with the agent using bash commands, installing dependencies, and running a development server with Bun. It's designed to execute tasks based on user requests, making decisions on which tools to use as it goes through the task.
│
│

│
◇  Tokens: 1428 input, 158 output

│
◇  You
│  What are all the files in this repository?
│
◇  Done  [2 steps · 1726↑ 103↓ tokens]
│
◇  readFile WORKSPACE_INFO.txt
│
│  Here are the files in the repository:
│
│      * **.env.example**
│      * **.env.local**
│      * **.gitignore**
│      * **README.md**
│      * **bun.lock**
│      * **package.json**
│      * **tsconfig.json**
│
│  ### Source Files in src/:
│
│      * **agent.ts**
│      * **index.ts**
│      * **ui.ts**
│
│  ### CST Directory
│
│      * **cst/constants.ts**
│      * **cst/types.ts**
│
│  You can read any of these files for more details.
│
│

│
◇  Tokens: 1726 input, 103 output
```

## Tech Stack

- **[AI SDK](https://ai-sdk.dev)** - ToolLoopAgent handles the agent loop
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

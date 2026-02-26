# mini-claude-code

AI coding assistant with direct filesystem access. Learning project.

---

## Quick Start

```bash
bunx github:thatbeautifuldream/mini-claude-code
```

```bash
npx github:thatbeautifuldream/mini-claude-code
```

```bash
pnpm dlx github:thatbeautifuldream/mini-claude-code
```

```bash
yarn dlx github:thatbeautifuldream/mini-claude-code
```

```bash
export OPENAI_API_KEY=your-key-here
```

---

## Local Dev

```bash
bun install
```

```bash
bun run dev
```

---

https://github.com/user-attachments/assets/afc4d916-af63-481f-9efd-7bd1518c1ebe

---

## How It Works

Uses `ToolLoopAgent` from `ai` SDK:

```typescript
const agent = new ToolLoopAgent({
  model: openai("gpt-4o"),
  tools: bashToolkit.tools,
  instructions: INSTRUCTIONS,
  stopWhen: stepCountIs(50),
});
```

Each turn streams steps via `onStepFinish`:

```typescript
agent.stream({
  messages: trimmed,
  onStepFinish(stepResult) {
    // Captures tool calls, results, token usage
  },
});
```

Bash tool wraps `just-bash` with safety hooks:

```typescript
createBashTool({
  sandbox: customBash,
  onBeforeBashCall: blockDangerousCommands,
  onAfterBashCall: logFailures,
});
```

Direct filesystem via `ReadWriteFs`:

```typescript
new ReadWriteFs({ root: rootPath });
```

Custom commands:

```typescript
defineCommand("explain", readFile);
defineCommand("lint", suggestLinter);
defineCommand("deps", showDeps);
```

---

## Commands

| Command  | What                 |
| -------- | -------------------- |
| `/help`  | Show commands        |
| `/clear` | Clear history        |
| `/git`   | Git status + commits |
| `/exit`  | Quit                 |

---

## Safety

Blocks `DANGEROUS_COMMANDS` via `onBeforeBashCall`:

- `rm -rf /`, `rm -rf *`, `rm -rf .`
- `dd if=`, `mkfs`, `fdisk`
- `git push --force`, `git reset --hard`

---

## Author

[Milind Mishra](https://milindmishra.com)

---

## License

MIT

# mini-claude-code

An AI coding assistant that works directly with your files.

---

## What It Does

Imagine having a conversation with someone who can read your code, edit your files, and run commands. That's mini-claude-code.

You simply ask it to do something with your code, and it figures out what needs to be done. It reads the relevant files, makes the changes you want, and shows you the results.

It's like having an experienced developer who understands code, knows bash commands, and can help you with anything in your project.

---

## How It Works

1. **Start it** - Run one command in your project folder
2. **Ask questions** - Tell it what you want to do in plain English
3. **Watch it work** - See each step as it reads files and makes changes
4. **Done** - Your files are updated with the changes you requested

That's it. No setup, no configuration, no learning curve.

---

## What It Can Do

### Read Files
- Look at any file in your project
- Understand the code structure
- Find specific functions or patterns

### Edit Files
- Create new files
- Update existing files
- Make targeted changes

### Run Commands
- Execute bash commands like `ls`, `grep`, `git`
- Run tests and builds
- Install dependencies

### Smart Features
- **Custom commands** for common tasks:
  - `explain <file>` - Read and analyze a file
  - `lint [path]` - Get code quality suggestions
  - `deps` - Show project dependencies
- **Network access** - Can fetch documentation from npm, PyPI, GitHub
- **Git integration** - Shows your branch, changed files, recent commits
- **Safety** - Blocks dangerous commands automatically

---

## Getting Started

```bash
# Install dependencies
bun install

# Set your OpenAI API key
export OPENAI_API_KEY=your-key-here

# Start the agent
bun run dev
```

That's all you need. The agent starts in your current directory and is ready to help.

---

## Example Session

Here's what it looks like when you use it:

```
┌   mini-claude-code
│
●  Working directory: /Users/you/my-project
│
●  Branch: main
│  Recent commits:
│  abc1234 fix: update readme
│  def5678 feat: add new feature
│
◇  Agent ready ✓
│
◇  Ready ─────────────────────────────────────────────────╮
│                                                         │
│  Tools:   bash · readFile · writeFile                   │
│  Custom:  explain · lint · deps                         │
│  Network: curl (npm, PyPI, GitHub)                      │
│  Model:   gpt-4o (OpenAI)                               │
│  Commands: /help · /clear · /git · /exit                │
│                                                         │
├─────────────────────────────────────────────────────────╯

◇  You
│  Add a function to calculate the sum of an array in utils.ts

◑  Thinking…
◇  Done  [3 steps · 1243↑ 89↓ tokens]

◇  readFile utils.ts
◇  writeFile utils.ts (2341 bytes)

I've added a new function called `sumArray` to utils.ts that calculates the sum of all numbers in an array. Here's what it does:

```typescript
export function sumArray(arr: number[]): number {
  return arr.reduce((sum, num) => sum + num, 0);
}
```

You can use it like: `sumArray([1, 2, 3, 4, 5])` which returns `15`.

◇  Tokens: 1243 input, 89 output
```

See how simple it is? Just ask, and it does the work.

---

## Built-in Commands

While using the agent, you can type these special commands:

| Command | What It Does |
|---------|--------------|
| `/help` | Show all available commands |
| `/clear` | Clear conversation history |
| `/git` | Show git status and recent commits |
| `/exit` | Quit the agent |

### Custom Tools

These are commands the agent itself can use (you can ask it to use them):

| Command | Description |
|---------|-------------|
| `explain <file>` | Reads and displays a file with context |
| `lint [path]` | Suggests code quality commands for your project |
| `deps` | Shows your project's package dependencies |

---

## Philosophy

### Simplicity First
- No configuration files needed
- No complex setup steps
- Works out of the box
- Just run and ask

### Direct Access
- Reads and writes your actual files directly
- No sandboxing or abstraction layers
- What you see is what gets changed
- Changes are permanent (just like editing files yourself)

### Safety Built-In
- Automatically blocks dangerous commands
- Warns you when something fails
- Shows you what it's doing step by step
- You can stop it anytime

### Smart Assistance
- Understands code before changing it
- Plans its approach before acting
- Reads existing patterns to match your style
- Verifies changes after making them

---

## Under the Hood

**Why it's fast:**
- Uses your actual filesystem (no copying or uploading)
- Reads files directly when needed
- Runs commands on your real system
- No waiting for transfers or syncs

**How it thinks:**
1. Understands your request
2. Decides which tools to use
3. Executes tools and sees results
4. Uses results to decide next step
5. Repeats until your task is done

**What it protects:**
- Commands that delete your entire project (`rm -rf /`)
- Commands that could wipe your disk
- Forced git operations
- Any other dangerous actions

---

## What Makes It Different

**From traditional IDE assistants:**
- You talk to it like a person, not click through menus
- It can run commands and see real output
- It understands your whole project context
- Works with any project, any language

**From command-line tools:**
- You don't need to remember complex commands
- It figures out what to do automatically
- It reads and edits files for you
- You just describe what you want

**From other AI coding assistants:**
- Direct filesystem access (no sandbox)
- Works with your actual files
- No file upload/download steps
- Changes are immediate and permanent

---

## Safety

Your files are safe with these protections:

✅ **Dangerous commands blocked** - Can't delete your entire project or disk
✅ **Destructive git commands blocked** - No force pushes or hard resets
✅ **Transparent operations** - See every step it takes
✅ **Clear feedback** - Know what succeeded and what failed
✅ **Stop anytime** - Type `/exit` to quit safely

---

## Tips for Best Results

**Be specific:**
- Instead of "Fix the code", say "Add error handling to the login function"
- Instead of "Update documentation", say "Add an example to the API docs"

**Let it explore first:**
- It will read relevant files before making changes
- This ensures it understands the context
- Results in better, more accurate changes

**Use it for repetitive tasks:**
- Adding similar functions across multiple files
- Updating imports after refactoring
- Creating boilerplate code

**Ask for explanations:**
- "Explain how this function works"
- "What dependencies does this project need?"
- "How should I test this feature?"

---

## What It Uses

- **AI Model**: GPT-4o for understanding and generating code
- **Commands**: Runs bash commands directly on your system
- **Files**: Reads and writes your actual files
- **Network**: Can fetch docs from npm, PyPI, GitHub (when needed)

---

## Author

milind

---

## License

MIT
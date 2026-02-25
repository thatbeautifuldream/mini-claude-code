export const MODEL_ID = "openai/gpt-oss-120b";

export const MAX_HISTORY_CHARS = 12_000;

export const EXCLUDE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/.vercel/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/.cache/**",
  "**/.vscode/**",
  "**/.idea/**",
] as const;

export const MAX_FILE_SIZE_BYTES = 500_000;

export const DANGEROUS_COMMANDS = [
  "rm -rf /",
  "rm -rf /*",
  "dd if=/dev/",
  ":(){ :|:& };:",
  "mkfs",
  "chmod -R 777 /",
  "chown -R root /",
  "killall -9",
  "pkill -9",
] as const;

export const INSTRUCTIONS = `\
You are mini-claude-code, a coding agent with bash, readFile, and writeFile tools.

Rules:
- Read files before editing (use readFile or bash head/grep, not cat on large files)
- Make targeted, minimal edits; never rewrite entire files unless asked
- Verify changes after writing (readFile or cat)
- Ask if something is ambiguous or risky
- Never delete files unless explicitly asked

WORKSPACE_INFO.txt in /workspace lists all available files.
`;

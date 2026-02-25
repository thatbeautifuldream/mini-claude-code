import pc from "picocolors";
import type {
  TBashToolInput,
  TReadFileToolInput,
  TToolResult,
  TWriteFileToolInput,
} from "./cst/types.js";

export function formatToolEvent(tr: TToolResult): string {
  const { toolName, input } = tr;
  const args = input as Record<string, unknown>;

  switch (toolName) {
    case "bash": {
      const bashArgs = args as TBashToolInput;
      const cmd = String(bashArgs.command ?? "").slice(0, 80);
      const truncated = cmd.length === 80 ? cmd + "…" : cmd;
      return `${pc.magenta("bash")} ${pc.dim("$")} ${pc.white(truncated)}`;
    }

    case "readFile": {
      const readFileArgs = args as TReadFileToolInput;
      const path = String(readFileArgs.path ?? "");
      return `${pc.blue("readFile")} ${pc.cyan(path)}`;
    }

    case "writeFile": {
      const writeFileArgs = args as TWriteFileToolInput;
      const path = String(writeFileArgs.path ?? "");
      const contentLen = String(writeFileArgs.content ?? "").length;
      return `${pc.yellow("writeFile")} ${pc.cyan(path)} ${pc.dim(`(${contentLen} bytes)`)}`;
    }

    default:
      return `${pc.gray(toolName)} called`;
  }
}

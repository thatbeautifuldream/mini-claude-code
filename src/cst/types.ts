import type { CommandResult } from "bash-tool";
import type { ModelMessage, ToolLoopAgent, ToolSet, TypedToolResult } from "ai";
import type { CommandContext } from "just-bash";

export type TAgentKit = {
  agent: ToolLoopAgent<never, any>;
  modelId: string;
  messages: ModelMessage[];
};

export type TBashToolInput = {
  command: string;
};

export type TBashToolOutput = CommandResult;

export type TReadFileToolInput = {
  path: string;
};

export type TReadFileToolOutput = {
  content: string;
};

export type TWriteFileToolInput = {
  path: string;
  content: string;
};

export type TWriteFileToolOutput = {
  success: boolean;
};

export type TBeforeBashCallInput = {
  command: string;
};

export type TBeforeBashCallOutput = {
  command: string;
};

export type TAfterBashCallInput = {
  command: string;
  result: CommandResult;
};

export type TAfterBashCallOutput = {
  result: CommandResult;
};

export type TToolResult = TypedToolResult<ToolSet>;

export type TBashCommand = (args: string[], ctx: CommandContext) => Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}>;

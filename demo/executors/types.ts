import type { JsonObject } from "../../src/protocol/types.ts";

export interface DemoState {
  files: Record<string, string>;
}

export interface ExecutionResult {
  state: DemoState;
  executionState: "EXECUTED" | "NOT_EXECUTED";
  actualActionManifest: JsonObject;
}

export function cloneState(state: DemoState): DemoState {
  return { files: { ...state.files } };
}

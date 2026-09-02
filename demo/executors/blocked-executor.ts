import { noMutationManifest } from "../cases/compare-action.ts";
import { cloneState, type DemoState, type ExecutionResult } from "./types.ts";

export function executeBlocked(state: DemoState): ExecutionResult {
  return {
    state: cloneState(state),
    executionState: "NOT_EXECUTED",
    actualActionManifest: noMutationManifest(),
  };
}

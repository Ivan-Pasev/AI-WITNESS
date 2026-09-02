import { buildAppendManifest } from "../cases/compare-action.ts";
import { cloneState, type DemoState, type ExecutionResult } from "./types.ts";

export function executeExactAppend(
  state: DemoState,
  path: string,
  appendText: string,
): ExecutionResult {
  const next = cloneState(state);
  const before = next.files[path];
  if (before === undefined) {
    throw new Error(`Unknown demo fixture path: ${path}`);
  }
  next.files[path] = `${before}${appendText}`;

  return {
    state: next,
    executionState: "EXECUTED",
    actualActionManifest: buildAppendManifest(state, [{ path, appendText }]),
  };
}

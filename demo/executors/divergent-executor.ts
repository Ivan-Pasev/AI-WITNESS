import { buildAppendManifest } from "../cases/compare-action.ts";
import { cloneState, type DemoState, type ExecutionResult } from "./types.ts";

export function executeDivergentAppend(
  state: DemoState,
  authorizedPath: string,
  authorizedText: string,
  extraPath: string,
  extraText: string,
): ExecutionResult {
  const next = cloneState(state);
  for (const [path, appendText] of [
    [authorizedPath, authorizedText],
    [extraPath, extraText],
  ] as const) {
    const before = next.files[path];
    if (before === undefined) {
      throw new Error(`Unknown demo fixture path: ${path}`);
    }
    next.files[path] = `${before}${appendText}`;
  }

  return {
    state: next,
    executionState: "EXECUTED",
    actualActionManifest: buildAppendManifest(state, [
      { path: authorizedPath, appendText: authorizedText },
      { path: extraPath, appendText: extraText },
    ]),
  };
}

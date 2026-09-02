import { createHash } from "node:crypto";

import { canonicalize } from "../../src/protocol/canonicalize.ts";
import type { JsonObject, JsonValue } from "../../src/protocol/types.ts";
import type { DemoState } from "../executors/types.ts";

export function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function stateHash(state: DemoState): string {
  const manifest = Object.keys(state.files)
    .sort()
    .map((path) => ({ path, sha256: sha256Text(state.files[path]!) }));
  return sha256Text(canonicalize(manifest));
}

function changeDigest(
  changes: readonly {
    path: string;
    beforeHash: string;
    afterHash: string;
    appendTextHash: string;
  }[],
): string {
  return sha256Text(
    canonicalize({
      operation: "APPEND_TEXT",
      changes: changes.map((entry) => ({ ...entry })),
    }),
  );
}

export function buildAppendManifest(
  state: DemoState,
  changes: readonly { path: string; appendText: string }[],
): JsonObject {
  const normalized = changes.map(({ path, appendText }) => {
    const before = state.files[path];
    if (before === undefined) {
      throw new Error(`Unknown demo fixture path: ${path}`);
    }
    const after = `${before}${appendText}`;
    return {
      path,
      beforeHash: sha256Text(before),
      afterHash: sha256Text(after),
      appendTextHash: sha256Text(appendText),
    };
  });

  return {
    operation: "APPEND_TEXT",
    targetPaths: normalized.map((entry) => entry.path),
    changeCount: normalized.length,
    changeDigest: changeDigest(normalized),
    fileManifest: normalized.map(({ path, beforeHash, afterHash }) => ({
      path,
      beforeHash,
      afterHash,
    })),
  };
}

export function noMutationManifest(): JsonObject {
  return {
    operation: "NONE",
    targetPaths: [],
    changeCount: 0,
    changeDigest: sha256Text(
      canonicalize({ operation: "NONE", changes: [] }),
    ),
    fileManifest: [],
  };
}

function canonicalField(manifest: JsonObject, key: string): string {
  const value = manifest[key];
  return canonicalize((value ?? null) as JsonValue);
}

export function compareActionManifests(
  authorized: JsonObject,
  actual: JsonObject,
  executionState: "EXECUTED" | "NOT_EXECUTED",
): "MATCH" | "DIVERGED" | "NOT_EXECUTED" {
  if (executionState === "NOT_EXECUTED") {
    return "NOT_EXECUTED";
  }

  const fields = [
    "operation",
    "targetPaths",
    "changeCount",
    "changeDigest",
    "fileManifest",
  ] as const;

  return fields.every(
    (field) => canonicalField(authorized, field) === canonicalField(actual, field),
  )
    ? "MATCH"
    : "DIVERGED";
}

import { assertAcceptedJson } from "./canonicalize.ts";
import {
  type JsonObject,
  type JsonValue,
  ProtocolError,
} from "./types.ts";

function cloneAccepted(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneAccepted(entry));
  }
  if (value !== null && typeof value === "object") {
    const output: JsonObject = {};
    for (const key of Object.keys(value)) {
      output[key] = cloneAccepted(value[key]!);
    }
    return output;
  }
  return value;
}

/**
 * Constructs a disclosure-minimized object from an explicit allow-list.
 *
 * The caller must make the disclosure decision by naming every public field.
 * This helper never hashes hidden values, never logs them, and performs no
 * network/Hedera operation. Hashing a secret is not anonymization.
 */
export function selectPublicFields(
  source: JsonObject,
  allowedFields: readonly string[],
): JsonObject {
  assertAcceptedJson(source);

  if (allowedFields.length === 0) {
    throw new ProtocolError(
      "INVALID_SCHEMA",
      "Public-field selection requires an explicit non-empty allow-list.",
    );
  }

  const output: JsonObject = {};
  for (const field of allowedFields) {
    if (!Object.prototype.hasOwnProperty.call(source, field)) {
      throw new ProtocolError(
        "INVALID_SCHEMA",
        `Explicitly allowed field is missing: ${field}.`,
        field,
      );
    }
    output[field] = cloneAccepted(source[field]!);
  }
  return output;
}

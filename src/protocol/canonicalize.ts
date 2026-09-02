import {
  type JsonObject,
  type JsonValue,
  ProtocolError,
} from "./types.ts";

function assertValidUnicode(value: string, path: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new ProtocolError(
          "UNSUPPORTED_VALUE",
          "String contains an unpaired high surrogate.",
          path,
        );
      }
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new ProtocolError(
        "UNSUPPORTED_VALUE",
        "String contains an unpaired low surrogate.",
        path,
      );
    }
  }
}

function assertArrayShape(value: unknown[], path: string): void {
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) {
      throw new ProtocolError(
        "UNSUPPORTED_VALUE",
        "Sparse arrays are not accepted by the IRP-1 value profile.",
        `${path}[${index}]`,
      );
    }
  }

  for (const key of Reflect.ownKeys(value)) {
    if (key === "length") {
      continue;
    }
    if (typeof key === "symbol") {
      throw new ProtocolError(
        "UNSUPPORTED_VALUE",
        "Symbol-keyed array properties are not accepted.",
        path,
      );
    }
    const numeric = Number(key);
    if (
      !Number.isInteger(numeric) ||
      numeric < 0 ||
      numeric >= value.length ||
      String(numeric) !== key
    ) {
      throw new ProtocolError(
        "UNSUPPORTED_VALUE",
        "Arrays with custom own properties are not accepted.",
        `${path}.${key}`,
      );
    }
  }
}

function assertObjectShape(value: object, path: string): asserts value is JsonObject {
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new ProtocolError(
      "UNSUPPORTED_VALUE",
      "Class instances and non-plain objects require explicit normalization.",
      path,
    );
  }

  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol") {
      throw new ProtocolError(
        "UNSUPPORTED_VALUE",
        "Symbol-keyed object members are not accepted.",
        path,
      );
    }
    assertValidUnicode(key, `${path}.{member-name}`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !("value" in descriptor)
    ) {
      throw new ProtocolError(
        "UNSUPPORTED_VALUE",
        "Only enumerable data properties are accepted.",
        `${path}.${key}`,
      );
    }
  }
}

function visitAcceptedValue(
  value: unknown,
  path: string,
  ancestors: WeakSet<object>,
): asserts value is JsonValue {
  if (value === null || typeof value === "boolean") {
    return;
  }

  if (typeof value === "string") {
    assertValidUnicode(value, path);
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new ProtocolError(
        "UNSUPPORTED_VALUE",
        "IRP-1 accepts only finite JSON numbers.",
        path,
      );
    }
    return;
  }

  if (
    typeof value === "undefined" ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    throw new ProtocolError(
      "UNSUPPORTED_VALUE",
      `Unsupported runtime value type: ${typeof value}.`,
      path,
    );
  }

  if (typeof value !== "object") {
    throw new ProtocolError(
      "UNSUPPORTED_VALUE",
      "Value is outside the IRP-1 accepted JSON profile.",
      path,
    );
  }

  if (ancestors.has(value)) {
    throw new ProtocolError(
      "UNSUPPORTED_VALUE",
      "Cyclic structures are not accepted.",
      path,
    );
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      assertArrayShape(value, path);
      for (let index = 0; index < value.length; index += 1) {
        visitAcceptedValue(value[index], `${path}[${index}]`, ancestors);
      }
      return;
    }

    assertObjectShape(value, path);
    for (const key of Object.keys(value)) {
      visitAcceptedValue(value[key], `${path}.${key}`, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
}

export function assertAcceptedJson(value: unknown): asserts value is JsonValue {
  visitAcceptedValue(value, "$", new WeakSet<object>());
}

function canonicalSort(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalSort(entry));
  }

  if (value !== null && typeof value === "object") {
    const output: JsonObject = {};
    const keys = Object.keys(value).sort((left, right) =>
      left < right ? -1 : left > right ? 1 : 0,
    );
    for (const key of keys) {
      output[key] = canonicalSort(value[key]!);
    }
    return output;
  }

  return value;
}

export function canonicalize(value: unknown): string {
  try {
    assertAcceptedJson(value);
    return JSON.stringify(canonicalSort(value));
  } catch (error) {
    if (error instanceof ProtocolError) {
      throw error;
    }
    throw new ProtocolError(
      "CANONICALIZATION_FAILURE",
      "RFC 8785/JCS canonicalization failed.",
    );
  }
}

export function canonicalizeUtf8(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalize(value));
}

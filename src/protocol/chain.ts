import { validateReceiptIntegrity, validateReceiptSchema } from "./validate.ts";
import {
  RECEIPT_KINDS,
  type ChainValidationResult,
  type JsonObject,
  type ReceiptEnvelope,
  type ValidationIssue,
} from "./types.ts";

function issue(
  category: ValidationIssue["category"],
  message: string,
  path?: string,
): ValidationIssue {
  return { category, message, ...(path === undefined ? {} : { path }) };
}

function payload(receipt: ReceiptEnvelope): JsonObject {
  return receipt.payload;
}

function isExecution(receipt: ReceiptEnvelope): boolean {
  const state = payload(receipt).executionState;
  return state === "EXECUTED" || state === "PARTIALLY_EXECUTED";
}

export function validateReceiptSet(receipts: readonly ReceiptEnvelope[]): ChainValidationResult {
  const issues: ValidationIssue[] = [];
  const findings: ValidationIssue[] = [];
  const positions = new Map<string, Set<string>>();

  for (const receipt of receipts) {
    const schema = validateReceiptSchema(receipt);
    issues.push(...schema.issues);

    const key = `${receipt.sessionId}\u001f${receipt.receiptKind}\u001f${receipt.previousReceiptHash ?? "ROOT"}`;
    const hashes = positions.get(key) ?? new Set<string>();
    hashes.add(receipt.receiptHash);
    positions.set(key, hashes);
  }

  for (const hashes of positions.values()) {
    if (hashes.size > 1) {
      issues.push(
        issue(
          "FORK_DETECTED",
          "Multiple distinct receipts occupy the same canonical stage position.",
        ),
      );
    }
  }

  return { ok: issues.length === 0, issues, findings };
}

export function validateCompleteChain(
  receipts: readonly ReceiptEnvelope[],
): ChainValidationResult {
  const issues: ValidationIssue[] = [];
  const findings: ValidationIssue[] = [];

  if (receipts.length !== RECEIPT_KINDS.length) {
    issues.push(
      issue(
        "MISSING_STAGE",
        "Complete-chain validation requires exactly one W0, W1, W2, and W3 receipt.",
      ),
    );
  }

  const setValidation = validateReceiptSet(receipts);
  issues.push(...setValidation.issues.filter((entry) => entry.category === "FORK_DETECTED"));

  for (const [index, receipt] of receipts.entries()) {
    const schema = validateReceiptSchema(receipt);
    issues.push(...schema.issues);

    if (receipt.receiptKind !== RECEIPT_KINDS[index]) {
      issues.push(
        issue(
          "INVALID_STAGE_ORDER",
          `Expected ${RECEIPT_KINDS[index] ?? "no stage"} at index ${index}.`,
          `[${index}].receiptKind`,
        ),
      );
    }

    const integrity = validateReceiptIntegrity(receipt);
    if (!integrity.ok) {
      issues.push(...integrity.issues.filter((entry) => entry.category === "HASH_MISMATCH"));
    }
  }

  const kinds = new Map(receipts.map((receipt) => [receipt.receiptKind, receipt]));
  for (const kind of RECEIPT_KINDS) {
    if (!kinds.has(kind)) {
      issues.push(issue("MISSING_STAGE", `Missing required stage ${kind}.`));
    }
  }

  const w0 = kinds.get("W0_OBSERVATION");
  const w1 = kinds.get("W1_INTENT");
  const w2 = kinds.get("W2_AUTHORIZATION");
  const w3 = kinds.get("W3_OUTCOME");

  if (!(w0 && w1 && w2 && w3)) {
    return { ok: false, issues, findings };
  }

  const sessionId = w0.sessionId;
  for (const receipt of [w1, w2, w3]) {
    if (receipt.sessionId !== sessionId) {
      issues.push(
        issue(
          "SESSION_MISMATCH",
          "All receipts in a chain must share the same sessionId.",
          "sessionId",
        ),
      );
    }
  }

  const seenNonces = new Set<string>();
  const seenReceiptIds = new Set<string>();
  for (const receipt of [w0, w1, w2, w3]) {
    if (seenNonces.has(receipt.nonce)) {
      issues.push(
        issue(
          "DUPLICATE_NONCE",
          "Duplicate nonce in the IRP-1 replay domain.",
          "nonce",
        ),
      );
    }
    seenNonces.add(receipt.nonce);

    if (seenReceiptIds.has(receipt.receiptId)) {
      issues.push(
        issue(
          "INVALID_SCHEMA",
          "Duplicate receiptId in the IRP-1 replay domain.",
          "receiptId",
        ),
      );
    }
    seenReceiptIds.add(receipt.receiptId);
  }

  const ordered = [w0, w1, w2, w3];
  for (let index = 1; index < ordered.length; index += 1) {
    const parent = ordered[index - 1]!;
    const child = ordered[index]!;
    if (Date.parse(child.createdAt) < Date.parse(parent.createdAt)) {
      issues.push(
        issue(
          "TIME_ORDER_VIOLATION",
          "Child createdAt must not predate its parent.",
          "createdAt",
        ),
      );
    }
  }

  if (w0.previousReceiptHash !== null) {
    issues.push(issue("PARENT_HASH_MISMATCH", "W0 must be the root receipt."));
  }
  if (w1.previousReceiptHash !== w0.receiptHash) {
    issues.push(issue("PARENT_HASH_MISMATCH", "W1 previousReceiptHash must equal W0 receiptHash."));
  }
  if (w2.previousReceiptHash !== w1.receiptHash) {
    issues.push(issue("PARENT_HASH_MISMATCH", "W2 previousReceiptHash must equal W1 receiptHash."));
  }
  if (w3.previousReceiptHash !== w2.receiptHash) {
    issues.push(issue("PARENT_HASH_MISMATCH", "W3 previousReceiptHash must equal W2 receiptHash."));
  }

  if (payload(w2).intentReceiptHash !== w1.receiptHash) {
    issues.push(
      issue(
        "SEMANTIC_PARENT_MISMATCH",
        "W2 payload.intentReceiptHash must equal the linked W1 receiptHash.",
      ),
    );
  }
  if (payload(w3).authorizationReceiptHash !== w2.receiptHash) {
    issues.push(
      issue(
        "SEMANTIC_PARENT_MISMATCH",
        "W3 payload.authorizationReceiptHash must equal the linked W2 receiptHash.",
      ),
    );
  }

  if (
    isExecution(w3) &&
    payload(w2).authorizationVerdict !== "AUTHORIZED"
  ) {
    issues.push(
      issue(
        "UNAUTHORIZED_EXECUTION",
        "Execution occurred without W2 AUTHORIZED state.",
      ),
    );
  }

  if (payload(w3).correspondenceVerdict === "DIVERGED") {
    findings.push(
      issue(
        "ACTION_DIVERGENCE",
        "Execution diverged from the authorized action manifest while receipt integrity may remain intact.",
      ),
    );
  }

  return { ok: issues.length === 0, issues, findings };
}

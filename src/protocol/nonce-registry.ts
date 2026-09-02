import {
  type ReceiptEnvelope,
  type ValidationIssue,
  type ValidationResult,
} from "./types.ts";

interface DomainState {
  nonces: Set<string>;
  receiptIds: Set<string>;
}

function domainKey(receipt: ReceiptEnvelope): string {
  return `${receipt.protocol}\u001f${receipt.schemaVersion}\u001f${receipt.sessionId}`;
}

export class NonceRegistry {
  private readonly domains = new Map<string, DomainState>();

  register(receipt: ReceiptEnvelope): ValidationResult {
    const key = domainKey(receipt);
    const state = this.domains.get(key) ?? {
      nonces: new Set<string>(),
      receiptIds: new Set<string>(),
    };

    const issues: ValidationIssue[] = [];

    if (state.nonces.has(receipt.nonce)) {
      issues.push({
        category: "DUPLICATE_NONCE",
        message: "nonce is already registered in this replay domain.",
        path: "nonce",
      });
    }

    if (state.receiptIds.has(receipt.receiptId)) {
      issues.push({
        category: "INVALID_SCHEMA",
        message: "receiptId is already registered in this replay domain.",
        path: "receiptId",
      });
    }

    if (issues.length > 0) {
      return { ok: false, issues };
    }

    state.nonces.add(receipt.nonce);
    state.receiptIds.add(receipt.receiptId);
    this.domains.set(key, state);
    return { ok: true, issues: [] };
  }

  snapshot(): Readonly<Record<string, { nonces: string[]; receiptIds: string[] }>> {
    const output: Record<string, { nonces: string[]; receiptIds: string[] }> = {};
    for (const key of [...this.domains.keys()].sort()) {
      const state = this.domains.get(key)!;
      output[key] = {
        nonces: [...state.nonces].sort(),
        receiptIds: [...state.receiptIds].sort(),
      };
    }
    return output;
  }

  clear(): void {
    this.domains.clear();
  }
}

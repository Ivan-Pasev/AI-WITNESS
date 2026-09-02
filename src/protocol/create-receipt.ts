import { calculateReceiptHash } from "./hash.ts";
import {
  type JsonObject,
  ProtocolError,
  type ReceiptDraft,
  type ReceiptEnvelope,
} from "./types.ts";
import { validateReceiptSchema } from "./validate.ts";

const ZERO_HASH = "0".repeat(64);

export function createReceipt<TPayload extends JsonObject>(
  draft: ReceiptDraft<TPayload>,
): ReceiptEnvelope<TPayload> {
  const provisional: ReceiptEnvelope<TPayload> = {
    ...draft,
    receiptHash: ZERO_HASH,
  };

  const validation = validateReceiptSchema(provisional);
  if (!validation.ok) {
    const first = validation.issues[0]!;
    throw new ProtocolError(first.category, first.message, first.path);
  }

  const receipt: ReceiptEnvelope<TPayload> = {
    ...draft,
    receiptHash: calculateReceiptHash(draft),
  };

  const finalValidation = validateReceiptSchema(receipt);
  if (!finalValidation.ok) {
    const first = finalValidation.issues[0]!;
    throw new ProtocolError(first.category, first.message, first.path);
  }

  return receipt;
}

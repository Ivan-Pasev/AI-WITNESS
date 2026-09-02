import { canonicalAnchorPayload, parseAnchorPayload } from "./anchor.ts";
import type {
  AnchorVerificationResult,
  MirrorTopicMessage,
  PublicAnchorPayload,
} from "./types.ts";

function decodeCanonicalBase64(value: string): string {
  if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(value) || value.length % 4 !== 0) {
    throw new Error("Mirror message is not canonical base64.");
  }
  const bytes = Buffer.from(value, "base64");
  if (bytes.toString("base64") !== value) {
    throw new Error("Mirror message base64 is malformed or non-canonical.");
  }
  return bytes.toString("utf8");
}

function result(
  verdict: AnchorVerificationResult["verdict"],
  issues: string[],
  extra: Partial<AnchorVerificationResult> = {},
): AnchorVerificationResult {
  return { verdict, issues, ...extra };
}

export function verifyMirrorAnchor(
  expectedTopicId: string,
  expectedSequenceNumber: number,
  expectedPayload: PublicAnchorPayload,
  message: MirrorTopicMessage | null,
): AnchorVerificationResult {
  if (message === null) {
    return result("NOT_FOUND", ["Mirror Node did not return the requested topic message."]);
  }
  if (message.topicId !== expectedTopicId) {
    return result("TOPIC_MISMATCH", ["Mirror topic ID does not equal the submitted topic ID."]);
  }
  if (message.sequenceNumber !== expectedSequenceNumber) {
    return result("SEQUENCE_MISMATCH", ["Mirror sequence number does not equal the submit receipt sequence."]);
  }
  if (message.consensusTimestamp.length === 0) {
    return result("MIRROR_ERROR", ["Mirror response lacks a consensus timestamp."]);
  }

  let decoded: PublicAnchorPayload;
  try {
    const text = decodeCanonicalBase64(message.messageBase64);
    decoded = parseAnchorPayload(JSON.parse(text) as unknown);
  } catch (error) {
    return result("MIRROR_ERROR", [
      error instanceof Error ? error.message : "Mirror payload could not be decoded.",
    ]);
  }

  if (
    decoded.receiptHash !== expectedPayload.receiptHash ||
    decoded.publicManifestHash !== expectedPayload.publicManifestHash
  ) {
    return result("HASH_MISMATCH", ["Receipt or public-manifest hash differs from the submitted commitment."], {
      consensusTimestamp: message.consensusTimestamp,
      decodedPayload: decoded,
    });
  }

  if (canonicalAnchorPayload(decoded) !== canonicalAnchorPayload(expectedPayload)) {
    return result("PAYLOAD_MISMATCH", ["Decoded anchor payload differs from the expected minimized payload."], {
      consensusTimestamp: message.consensusTimestamp,
      decodedPayload: decoded,
    });
  }

  return result("ANCHORED", [], {
    consensusTimestamp: message.consensusTimestamp,
    decodedPayload: decoded,
  });
}

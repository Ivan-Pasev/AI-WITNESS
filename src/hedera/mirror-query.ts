import type { MirrorTopicMessage } from "./types.ts";

export const TESTNET_MIRROR_BASE =
  "https://testnet.mirrornode.hedera.com" as const;
const TOPIC_ID_RE = /^\d{1,10}\.\d{1,10}\.\d{1,10}$/u;
const CONSENSUS_TIMESTAMP_RE = /^\d{1,20}\.\d{1,9}$/u;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateMirrorBase(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "testnet.mirrornode.hedera.com" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error("Phase 5 mirror base must be the official Hedera testnet Mirror Node HTTPS host.");
  }
  const path = url.pathname.replace(/\/+$/u, "");
  if (path !== "") {
    throw new Error("Mirror base must not include an API path.");
  }
  return TESTNET_MIRROR_BASE;
}

export function mirrorMessagePath(topicId: string, sequenceNumber: number): string {
  if (!TOPIC_ID_RE.test(topicId)) {
    throw new Error("Invalid Hedera topic ID.");
  }
  if (!Number.isSafeInteger(sequenceNumber) || sequenceNumber <= 0) {
    throw new Error("Sequence number must be a positive safe integer.");
  }
  return `/api/v1/topics/${topicId}/messages/${sequenceNumber}`;
}

export function parseMirrorTopicMessage(value: unknown): MirrorTopicMessage {
  if (!isObject(value)) {
    throw new Error("Mirror response must be an object.");
  }
  if (typeof value.topic_id !== "string" || !TOPIC_ID_RE.test(value.topic_id)) {
    throw new Error("Mirror response has an invalid topic_id.");
  }
  if (
    typeof value.sequence_number !== "number" ||
    !Number.isSafeInteger(value.sequence_number) ||
    value.sequence_number <= 0
  ) {
    throw new Error("Mirror response has an invalid sequence_number.");
  }
  if (
    typeof value.consensus_timestamp !== "string" ||
    !CONSENSUS_TIMESTAMP_RE.test(value.consensus_timestamp)
  ) {
    throw new Error("Mirror response has a missing or invalid consensus_timestamp.");
  }
  if (typeof value.message !== "string" || value.message.length === 0) {
    throw new Error("Mirror response has a missing message.");
  }

  return {
    topicId: value.topic_id,
    sequenceNumber: value.sequence_number,
    consensusTimestamp: value.consensus_timestamp,
    messageBase64: value.message,
    ...(typeof value.running_hash === "string"
      ? { runningHash: value.running_hash }
      : {}),
    ...(typeof value.running_hash_version === "number"
      ? { runningHashVersion: value.running_hash_version }
      : {}),
    ...(typeof value.payer_account_id === "string" || value.payer_account_id === null
      ? { payerAccountId: value.payer_account_id }
      : {}),
  };
}

export async function queryMirrorMessage(
  mirrorBase: string,
  topicId: string,
  sequenceNumber: number,
  fetchImpl: typeof fetch = fetch,
): Promise<MirrorTopicMessage | null> {
  const base = validateMirrorBase(mirrorBase);
  const response = await fetchImpl(`${base}${mirrorMessagePath(topicId, sequenceNumber)}`, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Mirror query failed with HTTP ${response.status}.`);
  }
  return parseMirrorTopicMessage(await response.json());
}

export async function waitForMirrorMessage(
  mirrorBase: string,
  topicId: string,
  sequenceNumber: number,
  options: {
    attempts?: number;
    delayMs?: number;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<MirrorTopicMessage | null> {
  const attempts = options.attempts ?? 24;
  const delayMs = options.delayMs ?? 2500;
  if (!Number.isInteger(attempts) || attempts <= 0) {
    throw new Error("Mirror attempts must be a positive integer.");
  }
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const found = await queryMirrorMessage(
      mirrorBase,
      topicId,
      sequenceNumber,
      options.fetchImpl ?? fetch,
    );
    if (found !== null) {
      return found;
    }
    if (attempt + 1 < attempts) {
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

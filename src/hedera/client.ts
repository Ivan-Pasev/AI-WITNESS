import { AccountId, Client, PrivateKey } from "@hiero-ledger/sdk";

import { validateMirrorBase } from "./mirror-query.ts";
import type { HederaRuntimeConfig } from "./types.ts";

export const HEDERA_CREDENTIAL_HOLD =
  "HOLD_HEDERA_TESTNET_CREDENTIALS_REQUIRED" as const;

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${HEDERA_CREDENTIAL_HOLD}: ${name} is required.`);
  }
  return value.trim();
}

export function loadHederaRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): HederaRuntimeConfig {
  const network = env.HEDERA_NETWORK ?? "testnet";
  if (network !== "testnet") {
    throw new Error("Phase 5 permits HEDERA_NETWORK=testnet only.");
  }

  const mirrorBase = validateMirrorBase(
    env.HEDERA_MIRROR_BASE ?? "https://testnet.mirrornode.hedera.com",
  );

  const topicId = env.HEDERA_TOPIC_ID?.trim();
  const topicSubmitKey = env.HEDERA_TOPIC_SUBMIT_KEY?.trim();
  if (topicId && !topicSubmitKey) {
    throw new Error(
      `${HEDERA_CREDENTIAL_HOLD}: HEDERA_TOPIC_SUBMIT_KEY is required when HEDERA_TOPIC_ID is supplied.`,
    );
  }

  return {
    network: "testnet",
    operatorId: required(env, "HEDERA_OPERATOR_ID"),
    operatorKey: required(env, "HEDERA_OPERATOR_KEY"),
    ...(topicId ? { topicId } : {}),
    ...(topicSubmitKey ? { topicSubmitKey } : {}),
    mirrorBase,
  };
}

export function parsePrivateKey(value: string): PrivateKey {
  return PrivateKey.fromStringDer(value);
}

export function createTestnetClient(config: HederaRuntimeConfig): Client {
  const operatorId = AccountId.fromString(config.operatorId);
  const operatorKey = parsePrivateKey(config.operatorKey);
  return Client.forTestnet().setOperator(operatorId, operatorKey);
}

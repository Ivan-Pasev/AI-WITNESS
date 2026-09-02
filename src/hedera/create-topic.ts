import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
} from "@hiero-ledger/sdk";

export interface CreatedTopic {
  topicId: string;
}

export async function createControlledTopic(
  client: Client,
  submitKey: PrivateKey,
): Promise<CreatedTopic> {
  const response = await new TopicCreateTransaction()
    .setTopicMemo("AI WITNESS / IRP-1 Phase 5 public-proof profile")
    .setSubmitKey(submitKey.publicKey)
    .execute(client);
  const receipt = await response.getReceipt(client);
  if (receipt.topicId === null) {
    throw new Error("HOLD_TOPIC_CREATION_FAILED: topic receipt did not contain a topic ID.");
  }
  return { topicId: receipt.topicId.toString() };
}

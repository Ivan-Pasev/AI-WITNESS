import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after } from 'node:test';

import { AgentMode } from '@hashgraph/hedera-agent-kit';
import { Client } from '@hiero-ledger/sdk';

import {
  IRP1_AGENT_KIT_TOOL_NAMES,
  IRP1_COMPARE_ACTION_MANIFESTS_TOOL,
  IRP1_VERIFY_LOCAL_BUNDLE_TOOL,
  buildIrp1AgentKitConfiguration,
  createIrp1McpToolkit,
  irp1Plugin,
} from '../src/index.ts';
import { Irp1ToolAllowlistPolicy } from '../src/policy.ts';

const client = Client.forTestnet();
after(() => client.close());

async function readJson(path: string) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

test('1 plugin exposes only the three bounded IRP-1 tools', () => {
  const methods = irp1Plugin.tools({}).map((tool) => tool.method);
  assert.deepEqual(methods, [...IRP1_AGENT_KIT_TOOL_NAMES]);
});

test('2 default Agent Kit configuration is human-in-the-loop RETURN_BYTES', () => {
  const configuration = buildIrp1AgentKitConfiguration();
  assert.equal(configuration.context?.mode, AgentMode.RETURN_BYTES);
  assert.deepEqual(configuration.tools, [...IRP1_AGENT_KIT_TOOL_NAMES]);
});

test('3 allowlist policy permits a known tool', async () => {
  const policy = new Irp1ToolAllowlistPolicy([...IRP1_AGENT_KIT_TOOL_NAMES]);
  await assert.doesNotReject(() =>
    policy.preToolExecutionHook(
      { context: {}, rawParams: {}, client, toolType: 'other' },
      IRP1_VERIFY_LOCAL_BUNDLE_TOOL,
    ),
  );
});

test('4 allowlist policy blocks an unknown tool fail-closed', async () => {
  const policy = new Irp1ToolAllowlistPolicy([...IRP1_AGENT_KIT_TOOL_NAMES]);
  await assert.rejects(
    () =>
      policy.preToolExecutionHook(
        { context: {}, rawParams: {}, client, toolType: 'other' },
        'unknown_dangerous_tool',
      ),
    /blocked by policy/i,
  );
});

test('5 local verifier tool independently reproduces ALLOW_AND_MATCH', async () => {
  const receipts = await Promise.all(
    ['W0.json', 'W1.json', 'W2.json', 'W3.json'].map((name) =>
      readJson(`../../../receipts/public/allow-and-match/${name}`),
    ),
  );
  const policy = await readJson('../../../policies/github-demo-policy.json');
  const tool = irp1Plugin.tools({}).find((entry) => entry.method === IRP1_VERIFY_LOCAL_BUNDLE_TOOL);
  assert.ok(tool);
  const result = await tool.execute(client, {}, {
    bundleJson: JSON.stringify({ receipts }),
    policyJson: JSON.stringify(policy),
  });
  assert.equal(result.raw.receiptIntegrity, 'INTACT');
  assert.equal(result.raw.chain, 'CHAIN_VALID');
  assert.equal(result.raw.policy, 'ALLOW');
  assert.equal(result.raw.authorization, 'AUTHORIZED');
  assert.equal(result.raw.correspondence, 'MATCH');
  assert.equal(result.raw.semanticTruthBoundary, 'SEMANTIC TRUTH: NOT PROVEN BY IRP-1');
});

test('6 compare tool preserves DIVERGED as independent correspondence', async () => {
  const tool = irp1Plugin.tools({}).find((entry) => entry.method === IRP1_COMPARE_ACTION_MANIFESTS_TOOL);
  assert.ok(tool);
  const authorized = {
    operation: 'APPEND_TEXT', targetPaths: ['demo/target.md'], changeCount: 1,
    changeDigest: 'a', fileManifest: [{ path: 'demo/target.md', beforeHash: 'b', afterHash: 'c' }],
  };
  const actual = {
    ...authorized,
    targetPaths: ['demo/target.md', 'demo/adversarial-extra.md'],
    changeCount: 2,
  };
  const result = await tool.execute(client, {}, {
    authorizedJson: JSON.stringify(authorized),
    actualJson: JSON.stringify(actual),
    executionState: 'EXECUTED',
  });
  assert.equal(result.raw.correspondence, 'DIVERGED');
  assert.equal(result.raw.semanticTruthBoundary, 'SEMANTIC TRUTH: NOT PROVEN BY IRP-1');
});

test('7 MCP toolkit instantiates without an operator or network mutation', () => {
  const toolkit = createIrp1McpToolkit(client);
  assert.ok(toolkit);
});

import { BaseTool, type Context, type Plugin } from '@hashgraph/hedera-agent-kit';
import type { Client } from '@hiero-ledger/sdk';
import { z } from 'zod';

import { compareActionManifests } from '../../../demo/cases/compare-action.ts';
import type { JsonObject } from '../../../src/protocol/types.ts';
import type { Phase5NetworkEvidence, ReceiptBundleInput } from '../../../src/verifier/types.ts';
import { verifyLocalBundle, verifyPhase5NetworkEvidence } from '../../../src/verifier/verify.ts';

export const IRP1_VERIFY_LOCAL_BUNDLE_TOOL = 'irp1_verify_local_bundle';
export const IRP1_VERIFY_NETWORK_EVIDENCE_TOOL = 'irp1_verify_network_evidence';
export const IRP1_COMPARE_ACTION_MANIFESTS_TOOL = 'irp1_compare_action_manifests';

class VerifyLocalBundleTool extends BaseTool {
  method = IRP1_VERIFY_LOCAL_BUNDLE_TOOL;
  name = 'IRP-1 Verify Local Bundle';
  description = 'Independently checks IRP-1 receipt integrity, chain, policy replay, approval, authorization and correspondence for a disclosed public bundle.';
  parameters = z.object({ bundleJson: z.string().min(2), policyJson: z.string().min(2) });

  async normalizeParams(params: { bundleJson: string; policyJson: string }, _context: Context, _client: Client) {
    return params;
  }

  async coreAction(params: { bundleJson: string; policyJson: string }, _context: Context, _client: Client) {
    const bundle = JSON.parse(params.bundleJson) as { receipts?: unknown };
    const policy = JSON.parse(params.policyJson) as unknown;
    const report = verifyLocalBundle({ receipts: bundle.receipts, policy } as ReceiptBundleInput);
    return { raw: report, humanMessage: JSON.stringify(report) };
  }

  async shouldSecondaryAction() { return false; }
}

class VerifyNetworkEvidenceTool extends BaseTool {
  method = IRP1_VERIFY_NETWORK_EVIDENCE_TOOL;
  name = 'IRP-1 Verify Network Evidence';
  description = 'Re-reads and independently verifies the published IRP-1 Hedera testnet evidence through the configured public Mirror Node.';
  parameters = z.object({ evidenceJson: z.string().min(2) });

  async normalizeParams(params: { evidenceJson: string }, _context: Context, _client: Client) {
    return params;
  }

  async coreAction(params: { evidenceJson: string }, _context: Context, _client: Client) {
    const evidence = JSON.parse(params.evidenceJson) as Phase5NetworkEvidence;
    const report = await verifyPhase5NetworkEvidence(evidence);
    return { raw: report, humanMessage: JSON.stringify(report) };
  }

  async shouldSecondaryAction() { return false; }
}

class CompareActionManifestsTool extends BaseTool {
  method = IRP1_COMPARE_ACTION_MANIFESTS_TOOL;
  name = 'IRP-1 Compare Action Manifests';
  description = 'Deterministically compares an authorized action manifest with an observed action manifest without asserting semantic truth.';
  parameters = z.object({
    authorizedJson: z.string().min(2),
    actualJson: z.string().min(2),
    executionState: z.enum(['EXECUTED', 'NOT_EXECUTED']),
  });

  async normalizeParams(params: { authorizedJson: string; actualJson: string; executionState: 'EXECUTED' | 'NOT_EXECUTED' }, _context: Context, _client: Client) {
    return params;
  }

  async coreAction(params: { authorizedJson: string; actualJson: string; executionState: 'EXECUTED' | 'NOT_EXECUTED' }, _context: Context, _client: Client) {
    const authorized = JSON.parse(params.authorizedJson) as JsonObject;
    const actual = JSON.parse(params.actualJson) as JsonObject;
    const correspondence = compareActionManifests(authorized, actual, params.executionState);
    return {
      raw: { correspondence, semanticTruthBoundary: 'SEMANTIC TRUTH: NOT PROVEN BY IRP-1' },
      humanMessage: correspondence,
    };
  }

  async shouldSecondaryAction() { return false; }
}

const localTool = (_context: Context) => new VerifyLocalBundleTool();
const networkTool = (_context: Context) => new VerifyNetworkEvidenceTool();
const compareTool = (_context: Context) => new CompareActionManifestsTool();

export const IRP1_AGENT_KIT_TOOL_NAMES = [
  IRP1_VERIFY_LOCAL_BUNDLE_TOOL,
  IRP1_VERIFY_NETWORK_EVIDENCE_TOOL,
  IRP1_COMPARE_ACTION_MANIFESTS_TOOL,
] as const;

export const irp1Plugin: Plugin = {
  name: 'ai-witness-irp1',
  version: '0.1.0-rc.1',
  description: 'IRP-1 evidence verification and action-correspondence tools for Hedera Agent Kit. SEMANTIC TRUTH: NOT PROVEN BY IRP-1.',
  tools: (context: Context) => [localTool(context), networkTool(context), compareTool(context)],
};

export default irp1Plugin;

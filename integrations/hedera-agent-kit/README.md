# IRP-1 for Hedera Agent Kit v4 and MCP

This directory is the bounded Phase-9 integration of the AI WITNESS / IRP-1 public proof with Hedera Agent Kit v4 and its MCP package.

**Permanent boundary: SEMANTIC TRUTH: NOT PROVEN BY IRP-1.**

## Compatibility baseline

- `@hashgraph/hedera-agent-kit` 4.1.0
- `@hashgraph/hedera-agent-kit-mcp` 1.1.0
- `@hiero-ledger/sdk` 2.87.0
- Node.js >=22 <23

The adapter intentionally reuses the canonical IRP-1 verifier and correspondence code from the repository rather than creating a second protocol implementation.

## Tools

The plugin exposes exactly three bounded tools:

- `irp1_verify_local_bundle` — verify receipt integrity, chain, policy replay, approval, authorization and correspondence for a disclosed IRP-1 bundle.
- `irp1_verify_network_evidence` — independently re-read the published Hedera testnet W2/W3 evidence through the public Mirror Node and require exact anchor equality.
- `irp1_compare_action_manifests` — deterministically compare authorized and observed action manifests and return `MATCH`, `DIVERGED` or `NOT_EXECUTED`.

No transaction-construction or autonomous-signing tool is added by this plugin.

## Fail-closed tool boundary

`Irp1ToolAllowlistPolicy` applies to `*` and rejects every method not present in the explicit allowlist. The default configuration exposes only the three tools above.

If an application deliberately adds another Agent Kit plugin, its desired tool method must be supplied both as an extra plugin and as an explicit `extraAllowedTools` entry. Unknown tools remain blocked.

## Human-in-the-loop default

`buildIrp1AgentKitConfiguration()` uses `AgentMode.RETURN_BYTES`. If a caller later adds transaction-capable tools, the default mode returns unsigned transaction bytes instead of autonomously signing or broadcasting them. Approval/signing remains an external responsibility unless a separately reviewed execution strategy is supplied.

This integration does not authenticate the human approver merely because an approval state is recorded.

## MCP

`createIrp1McpToolkit(client)` constructs the official Hedera Agent Kit MCP toolkit with the bounded IRP-1 configuration. MCP therefore exposes the same discovered, explicitly allowlisted tools rather than a second independent tool registry.

## Reproduce

From repository root:

```bash
npm ci
npm run typecheck
npm test
npm run verify:public -- local
npm run verify:public -- network
npm ci --prefix integrations/hedera-agent-kit
npm audit --prefix integrations/hedera-agent-kit
npm run typecheck --prefix integrations/hedera-agent-kit
npm test --prefix integrations/hedera-agent-kit
```

The integration tests do not require a private key and do not submit a Hedera transaction. The network verifier tool itself performs public Mirror Node reads only when invoked with evidence.

## Non-claims

This adapter does not prove that an AI interpretation was true, that reasoning was correct, that an action was safe or lawful, or that a human identity was authenticated. It does not imply Hedera or Hashgraph endorsement, certification, complete security, or production readiness.

The published `v0.1.0-rc.1` tag remains the immutable Phase-8 public-proof baseline. Phase-9 integration commits must not move or retag that release.

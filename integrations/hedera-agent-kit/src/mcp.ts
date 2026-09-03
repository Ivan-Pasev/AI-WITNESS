import { AgentMode, type Configuration, type Plugin } from '@hashgraph/hedera-agent-kit';
import HederaMCPToolkit from '@hashgraph/hedera-agent-kit-mcp';
import type { Client } from '@hiero-ledger/sdk';

import irp1Plugin, { IRP1_AGENT_KIT_TOOL_NAMES } from './plugin.ts';
import { Irp1ToolAllowlistPolicy } from './policy.ts';

export type Irp1AgentKitOptions = {
  extraPlugins?: Plugin[];
  extraAllowedTools?: string[];
};

export function buildIrp1AgentKitConfiguration(options: Irp1AgentKitOptions = {}): Configuration {
  const allowedTools = [...IRP1_AGENT_KIT_TOOL_NAMES, ...(options.extraAllowedTools ?? [])];
  return {
    tools: allowedTools,
    plugins: [irp1Plugin, ...(options.extraPlugins ?? [])],
    context: {
      // Human-in-the-loop safe default: transaction-capable plugins return bytes instead of
      // signing/broadcasting autonomously. A caller may later provide a separate approved signer.
      mode: AgentMode.RETURN_BYTES,
      hooks: [new Irp1ToolAllowlistPolicy(allowedTools)],
    },
  };
}

export function createIrp1McpToolkit(client: Client, options: Irp1AgentKitOptions = {}) {
  return new HederaMCPToolkit({ client, configuration: buildIrp1AgentKitConfiguration(options) });
}

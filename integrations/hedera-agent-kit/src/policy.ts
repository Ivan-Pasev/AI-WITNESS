import { AbstractPolicy, type PreToolExecutionParams } from '@hashgraph/hedera-agent-kit';

export class Irp1ToolAllowlistPolicy extends AbstractPolicy {
  readonly name = 'IRP-1 Tool Allowlist';
  readonly description = 'Fail-closed tool allowlist for AI WITNESS / IRP-1 integrations.';
  readonly relevantTools = ['*'];
  private readonly allowed: ReadonlySet<string>;

  constructor(allowedTools: readonly string[]) {
    super();
    this.allowed = new Set(allowedTools);
  }

  protected shouldBlockPreToolExecution(_params: PreToolExecutionParams, method: string): boolean {
    return !this.allowed.has(method);
  }
}

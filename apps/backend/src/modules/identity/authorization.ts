import type {
  AuthorizationPort,
  CommandRequest,
  ExecutionContext,
  StableResult,
  TransactionContext,
} from '@navard/shared-kernel';
import { humanRoles, type HumanRole } from './contracts.js';
import type { IdentityService } from './service.js';

/** Every command owner supplies explicit resource and disclosure policy. */
export interface CommandAuthorizationPolicy {
  readonly command: string;
  readonly version: number;
  readonly roles: readonly HumanRole[];
  readonly canTarget: (
    context: ExecutionContext,
    request: CommandRequest,
    tx?: TransactionContext,
  ) => Promise<boolean>;
  readonly canDisclose: (
    context: ExecutionContext,
    request: CommandRequest,
    result: StableResult,
    tx?: TransactionContext,
  ) => Promise<boolean>;
}

export class IdentityAuthorization implements AuthorizationPort {
  private readonly policies = new Map<string, CommandAuthorizationPolicy>();
  constructor(
    private readonly identity: IdentityService,
    policies: readonly CommandAuthorizationPolicy[] = [],
  ) {
    for (const policy of policies) {
      const key = JSON.stringify([policy.command, policy.version]);
      if (
        this.policies.has(key) ||
        !policy.command ||
        !Number.isInteger(policy.version) ||
        policy.version < 1 ||
        !policy.roles.length ||
        policy.roles.some((role) => !humanRoles.includes(role)) ||
        typeof policy.canTarget !== 'function' ||
        typeof policy.canDisclose !== 'function'
      )
        throw new Error('Invalid authorization policy');
      this.policies.set(key, Object.freeze({ ...policy, roles: Object.freeze([...policy.roles]) }));
    }
  }
  async canExecute(
    context: ExecutionContext,
    request: CommandRequest,
    tx?: TransactionContext,
  ): Promise<boolean> {
    const policy = this.policies.get(JSON.stringify([request.command, request.contract_version]));
    return (
      policy !== undefined &&
      policy.roles.includes(context.actorRole as HumanRole) &&
      (await this.identity.isCurrent(context, tx)) &&
      (await policy.canTarget(context, request, tx))
    );
  }
  async canReplay(
    context: ExecutionContext,
    request: CommandRequest,
    result: StableResult,
    tx?: TransactionContext,
  ): Promise<boolean> {
    const policy = this.policies.get(JSON.stringify([request.command, request.contract_version]));
    return (
      policy !== undefined &&
      (await this.canExecute(context, request, tx)) &&
      (await policy.canDisclose(context, request, result, tx))
    );
  }
}

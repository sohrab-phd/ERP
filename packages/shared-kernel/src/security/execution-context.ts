import { randomUUID } from 'node:crypto';
export interface Principal {
  readonly issuer: string;
  readonly subject: string;
}
export interface ExecutionContext {
  readonly installationId: string;
  readonly authorityScopeId: string;
  readonly principal: Principal;
  readonly actorRole: string;
  readonly requestId: string;
  readonly customerScope?: string;
  readonly temporary?: boolean;
}
const transactionBrand: unique symbol = Symbol('transaction-context');
/** Opaque capability: no connection or transaction control is exposed to handlers. */
export interface TransactionContext {
  readonly id: string;
  readonly [transactionBrand]: true;
}
/** Adapters bind this token to a client using a private WeakMap. */
export function createTransactionContext(): TransactionContext {
  return Object.freeze({ id: randomUUID(), [transactionBrand]: true as const });
}

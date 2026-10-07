import type { TransactionContext } from '@navard/shared-kernel';

export const humanRoles = [
  'ACT-SEC',
  'ACT-SALES',
  'ACT-PROC',
  'ACT-WH',
  'ACT-PLAN',
  'ACT-OP',
  'ACT-SHIP',
  'ACT-FIN',
  'ACT-CUST',
] as const;
export type HumanRole = (typeof humanRoles)[number];
export interface Account {
  id: string;
  installationId: string;
  personId: string;
  username: string;
  passwordHash: string;
  enabled: boolean;
}
export interface Grant {
  actorRole: HumanRole;
  authorityScopeId: string;
  customerScope: string;
}
export interface SessionRecord {
  digest: string;
  accountId: string;
  personId: string;
  username: string;
  installationId: string;
  expiresAt: Date;
}
export type SecurityEvent =
  | 'LOGIN_ACCEPTED'
  | 'LOGIN_DENIED'
  | 'LOGOUT'
  | 'SESSION_REVOKED'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_DISABLED'
  | 'GRANT_CHANGED'
  | 'PASSWORD_CHANGED';
export interface IdentityStore {
  currentGrant(
    installation: string,
    digest: string,
    accountId: string,
    personId: string,
    grant: Grant,
    tx?: TransactionContext,
  ): Promise<boolean>;
  findAccount(
    installation: string,
    username: string,
    tx?: TransactionContext,
  ): Promise<Account | undefined>;
  account(tx: TransactionContext, installation: string, id: string): Promise<Account | undefined>;
  insertAccount(tx: TransactionContext, account: Account): Promise<void>;
  updatePassword(
    tx: TransactionContext,
    installation: string,
    id: string,
    hash: string,
  ): Promise<void>;
  disableAccount(tx: TransactionContext, installation: string, id: string): Promise<void>;
  adminLock(tx: TransactionContext, installation: string): Promise<void>;
  setGrant(
    tx: TransactionContext,
    installation: string,
    id: string,
    grant: Grant,
    enabled: boolean,
  ): Promise<void>;
  grants(tx: TransactionContext | undefined, installation: string, id: string): Promise<Grant[]>;
  countAdmins(tx: TransactionContext, installation: string, scope: string): Promise<number>;
  createSession(
    tx: TransactionContext,
    installation: string,
    accountId: string,
    digest: string,
  ): Promise<Date>;
  session(
    tx: TransactionContext | undefined,
    installation: string,
    digest: string,
    touch?: boolean,
  ): Promise<SessionRecord | undefined>;
  revokeSession(tx: TransactionContext, installation: string, digest: string): Promise<void>;
  revokeAccountSessions(
    tx: TransactionContext,
    installation: string,
    accountId: string,
  ): Promise<void>;
  audit(
    tx: TransactionContext,
    installation: string,
    event: SecurityEvent,
    actorPerson?: string,
    targetPerson?: string,
    details?: Partial<Grant> & { enabled?: boolean },
  ): Promise<void>;
}
export class IdentityError extends Error {
  constructor(readonly kind: 'unauthenticated' | 'forbidden' | 'invalid' | 'conflict' | 'busy') {
    super('Identity request denied.');
    this.name = 'IdentityError';
  }
}

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import {
  validUuid,
  validUnicode,
  type ExecutionContext,
  type TransactionContext,
  type TransactionPort,
  type TransactionSession,
} from '@navard/shared-kernel';
import {
  humanRoles,
  IdentityError,
  type Account,
  type Grant,
  type HumanRole,
  type IdentityStore,
  type SessionRecord,
} from './contracts.js';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './password.js';

interface Issuance {
  digest: string;
  accountId: string;
}
export interface SelfSession {
  accountId: string;
  personId: string;
  username: string;
  expiresAt: Date;
  grants: Grant[];
}
const authenticatedContexts = new WeakSet<ExecutionContext>();

/** A distinct person is evidence only; business approval authority remains owner policy. */
export function distinctAuthenticatedPersons(
  first: ExecutionContext,
  second: ExecutionContext,
): boolean {
  return (
    authenticatedContexts.has(first) &&
    authenticatedContexts.has(second) &&
    first.temporary !== true &&
    second.temporary !== true &&
    first.principal.issuer === second.principal.issuer &&
    first.principal.subject !== second.principal.subject
  );
}

function usernameValid(username: unknown): username is string {
  return typeof username === 'string' && /^[a-z0-9][a-z0-9._-]{2,63}$/u.test(username);
}
function digest(token: string): string {
  if (
    typeof token !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/u.test(token) ||
    Buffer.from(token, 'base64url').toString('base64url') !== token
  )
    throw new IdentityError('unauthenticated');
  return createHash('sha256').update(token).digest('hex');
}
function validCustomer(scope: unknown): scope is string {
  return (
    typeof scope === 'string' &&
    scope.length > 0 &&
    scope.length <= 256 &&
    validUnicode(scope) &&
    Buffer.byteLength(scope, 'utf8') <= 256 &&
    !/[\u0000-\u001f\u007f]/u.test(scope)
  );
}
function sameGrant(grant: Grant, role: HumanRole, authority: string, customer: string): boolean {
  return (
    grant.actorRole === role &&
    grant.authorityScopeId === authority &&
    grant.customerScope === customer
  );
}

export class IdentityService {
  private readonly issued = new WeakMap<ExecutionContext, Issuance>();
  constructor(
    private readonly store: IdentityStore,
    private readonly transactions: TransactionPort,
    private readonly installationId: string,
    private readonly authorityScopeId: string,
  ) {
    if (!validUuid(installationId) || !validUuid(authorityScopeId))
      throw new IdentityError('invalid');
  }

  private async transaction<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    let session: TransactionSession | undefined;
    try {
      session = await this.transactions.begin();
      const active = session;
      const pending = (async () => {
        const result = await work(active.context);
        await active.commit();
        await active.release();
        return result;
      })();
      return await (active.aborted === undefined
        ? pending
        : Promise.race([pending, active.aborted]));
    } catch (error) {
      if (session) {
        let discard = false;
        try {
          await session.rollback();
        } catch {
          discard = true;
        }
        try {
          await session.release(discard);
        } catch {
          /* Adapter cleanup is fail-closed. */
        }
      }
      if (error instanceof IdentityError) throw error;
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')
        throw new IdentityError('conflict');
      throw new IdentityError('busy');
    }
  }

  private async requireSession(
    tx: TransactionContext | undefined,
    tokenDigest: string,
    touch = false,
  ): Promise<SessionRecord> {
    const session = await this.store.session(tx, this.installationId, tokenDigest, touch);
    if (!session) throw new IdentityError('unauthenticated');
    return session;
  }
  private async requireAdmin(tx: TransactionContext, tokenDigest: string): Promise<SessionRecord> {
    await this.store.adminLock(tx, this.installationId);
    const actor = await this.requireSession(tx, tokenDigest, true);
    const grants = await this.store.grants(tx, this.installationId, actor.accountId);
    if (!grants.some((grant) => sameGrant(grant, 'ACT-SEC', this.authorityScopeId, '')))
      throw new IdentityError('forbidden');
    return actor;
  }
  private async requireAccount(tx: TransactionContext, accountId: string): Promise<Account> {
    if (!validUuid(accountId)) throw new IdentityError('invalid');
    const account = await this.store.account(tx, this.installationId, accountId);
    if (!account) throw new IdentityError('forbidden');
    return account;
  }
  private async preserveAdmin(tx: TransactionContext): Promise<void> {
    if ((await this.store.countAdmins(tx, this.installationId, this.authorityScopeId)) < 1)
      throw new IdentityError('conflict');
  }

  async login(username: string, password: string): Promise<{ token: string; expiresAt: Date }> {
    const account = usernameValid(username)
      ? await this.store.findAccount(this.installationId, username)
      : undefined;
    const verified = await verifyPassword(password, account?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!verified || !account || !account.enabled) {
      await this.transaction((tx) => this.store.audit(tx, this.installationId, 'LOGIN_DENIED'));
      throw new IdentityError('unauthenticated');
    }
    const token = randomBytes(32).toString('base64url');
    const result = await this.transaction(async (tx) => {
      const locked = await this.store.account(tx, this.installationId, account.id);
      if (!locked || !locked.enabled || locked.passwordHash !== account.passwordHash) {
        await this.store.audit(tx, this.installationId, 'LOGIN_DENIED');
        return undefined;
      }
      const expiresAt = await this.store.createSession(
        tx,
        this.installationId,
        account.id,
        digest(token),
      );
      await this.store.audit(
        tx,
        this.installationId,
        'LOGIN_ACCEPTED',
        account.personId,
        account.personId,
      );
      return { token, expiresAt };
    });
    if (!result) throw new IdentityError('unauthenticated');
    return result;
  }

  async session(token: string): Promise<SelfSession> {
    const tokenDigest = digest(token);
    return this.transaction(async (tx) => {
      const record = await this.requireSession(tx, tokenDigest, true);
      const grants = await this.store.grants(tx, this.installationId, record.accountId);
      return {
        accountId: record.accountId,
        personId: record.personId,
        username: record.username,
        expiresAt: record.expiresAt,
        grants,
      };
    });
  }

  async logout(token: string): Promise<void> {
    const tokenDigest = digest(token);
    await this.transaction(async (tx) => {
      const actor = await this.requireSession(tx, tokenDigest);
      await this.store.revokeSession(tx, this.installationId, tokenDigest);
      await this.store.audit(tx, this.installationId, 'LOGOUT', actor.personId, actor.personId);
    });
  }

  async createAccount(
    token: string,
    input: { username: string; personId: string; password: string },
  ): Promise<{ accountId: string }> {
    const { username, personId, password } = input;
    const tokenDigest = digest(token);
    // Deny unauthenticated requests before expensive password work; recheck inside the write transaction.
    const actor = await this.requireSession(undefined, tokenDigest);
    const grants = await this.store.grants(undefined, this.installationId, actor.accountId);
    if (!grants.some((grant) => sameGrant(grant, 'ACT-SEC', this.authorityScopeId, '')))
      throw new IdentityError('forbidden');
    if (!usernameValid(username) || !validUuid(personId)) throw new IdentityError('invalid');
    const passwordHash = await hashPassword(password),
      accountId = randomUUID();
    await this.transaction(async (tx) => {
      const current = await this.requireAdmin(tx, tokenDigest);
      await this.store.insertAccount(tx, {
        id: accountId,
        installationId: this.installationId,
        personId,
        username,
        passwordHash,
        enabled: true,
      });
      await this.store.audit(
        tx,
        this.installationId,
        'ACCOUNT_CREATED',
        current.personId,
        personId,
      );
    });
    return { accountId };
  }

  /** Targeted administrator lookup reconciles a lost account-create response. */
  async lookupAccount(
    token: string,
    username: string,
  ): Promise<
    { accountId: string; personId: string; username: string; enabled: boolean } | undefined
  > {
    if (!usernameValid(username)) throw new IdentityError('invalid');
    const tokenDigest = digest(token);
    return this.transaction(async (tx) => {
      await this.requireAdmin(tx, tokenDigest);
      const account = await this.store.findAccount(this.installationId, username, tx);
      return account === undefined
        ? undefined
        : {
            accountId: account.id,
            personId: account.personId,
            username: account.username,
            enabled: account.enabled,
          };
    });
  }
  async setGrant(
    token: string,
    input: { accountId: string; actorRole: HumanRole; customerScope?: string; enabled: boolean },
  ): Promise<void> {
    const { accountId, actorRole, customerScope, enabled } = input;
    const tokenDigest = digest(token),
      customer = customerScope ?? '';
    if (
      !humanRoles.includes(actorRole) ||
      typeof enabled !== 'boolean' ||
      (customerScope !== undefined && !validCustomer(customerScope)) ||
      (actorRole === 'ACT-CUST' && customer === '')
    )
      throw new IdentityError('invalid');
    await this.transaction(async (tx) => {
      const actor = await this.requireAdmin(tx, tokenDigest);
      const target = await this.requireAccount(tx, accountId);
      if (!target.enabled && enabled) throw new IdentityError('conflict');
      await this.store.setGrant(
        tx,
        this.installationId,
        target.id,
        {
          actorRole,
          authorityScopeId: this.authorityScopeId,
          customerScope: customer,
        },
        enabled,
      );
      await this.preserveAdmin(tx);
      await this.store.audit(
        tx,
        this.installationId,
        'GRANT_CHANGED',
        actor.personId,
        target.personId,
        { actorRole, authorityScopeId: this.authorityScopeId, customerScope: customer, enabled },
      );
    });
  }

  async disableAccount(token: string, accountId: string): Promise<void> {
    const tokenDigest = digest(token);
    await this.transaction(async (tx) => {
      const actor = await this.requireAdmin(tx, tokenDigest);
      const target = await this.requireAccount(tx, accountId);
      await this.store.disableAccount(tx, this.installationId, target.id);
      await this.store.revokeAccountSessions(tx, this.installationId, target.id);
      await this.preserveAdmin(tx);
      await this.store.audit(
        tx,
        this.installationId,
        'ACCOUNT_DISABLED',
        actor.personId,
        target.personId,
      );
    });
  }

  async revokeSessions(token: string, accountId: string): Promise<void> {
    const tokenDigest = digest(token);
    await this.transaction(async (tx) => {
      const actor = await this.requireAdmin(tx, tokenDigest);
      const target = await this.requireAccount(tx, accountId);
      await this.store.revokeAccountSessions(tx, this.installationId, target.id);
      await this.store.audit(
        tx,
        this.installationId,
        'SESSION_REVOKED',
        actor.personId,
        target.personId,
      );
    });
  }

  async changePassword(
    token: string,
    input: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const { currentPassword, newPassword } = input;
    const tokenDigest = digest(token);
    const actor = await this.requireSession(undefined, tokenDigest);
    const old = await this.store.findAccount(this.installationId, actor.username);
    if (!old || !(await verifyPassword(currentPassword, old.passwordHash)))
      throw new IdentityError('unauthenticated');
    const passwordHash = await hashPassword(newPassword);
    await this.transaction(async (tx) => {
      const current = await this.requireSession(tx, tokenDigest);
      const locked = await this.requireAccount(tx, current.accountId);
      if (!locked.enabled || locked.passwordHash !== old.passwordHash)
        throw new IdentityError('unauthenticated');
      await this.store.updatePassword(tx, this.installationId, current.accountId, passwordHash);
      await this.store.revokeAccountSessions(tx, this.installationId, current.accountId);
      await this.store.audit(
        tx,
        this.installationId,
        'PASSWORD_CHANGED',
        current.personId,
        current.personId,
      );
    });
  }

  async context(
    token: string,
    actorRole: HumanRole,
    customerScope?: string,
  ): Promise<ExecutionContext> {
    if (
      !humanRoles.includes(actorRole) ||
      (customerScope !== undefined && !validCustomer(customerScope))
    )
      throw new IdentityError('invalid');
    const tokenDigest = digest(token);
    const self = await this.session(token);
    if (
      !self.grants.some((grant) =>
        sameGrant(grant, actorRole, this.authorityScopeId, customerScope ?? ''),
      )
    )
      throw new IdentityError('forbidden');
    const context: ExecutionContext = Object.freeze({
      installationId: this.installationId,
      authorityScopeId: this.authorityScopeId,
      principal: Object.freeze({ issuer: `local:${this.installationId}`, subject: self.personId }),
      actorRole,
      requestId: randomUUID(),
      ...(customerScope === undefined ? {} : { customerScope }),
    });
    this.issued.set(context, { digest: tokenDigest, accountId: self.accountId });
    authenticatedContexts.add(context);
    return context;
  }

  async isCurrent(context: ExecutionContext, tx?: TransactionContext): Promise<boolean> {
    const issued = this.issued.get(context);
    if (!issued || context.temporary === true) return false;
    return this.store.currentGrant(
      this.installationId,
      issued.digest,
      issued.accountId,
      context.principal.subject,
      {
        actorRole: context.actorRole as HumanRole,
        authorityScopeId: this.authorityScopeId,
        customerScope: context.customerScope ?? '',
      },
      tx,
    );
  }

  async distinctPersons(first: ExecutionContext, second: ExecutionContext): Promise<boolean> {
    return (
      distinctAuthenticatedPersons(first, second) &&
      (await this.isCurrent(first)) &&
      (await this.isCurrent(second))
    );
  }
}

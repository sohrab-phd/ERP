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
interface SalesQueryTransactions {
  begin(mode?: 'write' | 'read-snapshot', signal?: AbortSignal): Promise<TransactionSession>;
}
export interface SelfSession {
  accountId: string;
  personId: string;
  username: string;
  expiresAt: Date;
  grants: Grant[];
  hasCustomerSales?: boolean;
  installationId?: string;
  authorityScopeId?: string;
}
/** Private authenticated query capability. Never serialized into browser DTOs. */
export interface SalesBrowserPrincipal {
  readonly installationId: string;
  readonly authorityScopeId: string;
  readonly accountId: string;
  readonly personId: string;
  readonly sessionDigest: string;
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
  private readonly salesReaders = new WeakSet<SalesBrowserPrincipal>();
  constructor(
    private readonly store: IdentityStore,
    private readonly transactions: TransactionPort,
    private readonly installationId: string,
    private readonly authorityScopeId: string,
    private readonly salesQueryTransactions?: SalesQueryTransactions,
  ) {
    if (!validUuid(installationId) || !validUuid(authorityScopeId))
      throw new IdentityError('invalid');
  }

  private async transaction<T>(
    work: (tx: TransactionContext) => Promise<T>,
    sales?: {
      readOnly?: boolean;
      signal?: AbortSignal | undefined;
    },
  ): Promise<T> {
    let session: TransactionSession | undefined;
    try {
      session =
        sales && this.salesQueryTransactions
          ? await this.salesQueryTransactions.begin(
              sales.readOnly ? 'read-snapshot' : 'write',
              sales.signal,
            )
          : await this.transactions.begin();
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
    input: {
      accountId: string;
      actorRole: HumanRole;
      customerScope?: string;
      enabled: boolean;
      productionDisposition?: boolean;
    },
  ): Promise<void> {
    const { accountId, actorRole, customerScope, enabled, productionDisposition } = input;
    const tokenDigest = digest(token),
      customer = customerScope ?? '';
    if (
      !humanRoles.includes(actorRole) ||
      typeof enabled !== 'boolean' ||
      (customerScope !== undefined && !validCustomer(customerScope)) ||
      (actorRole === 'ACT-CUST' && customer === '') ||
      (productionDisposition !== undefined &&
        (typeof productionDisposition !== 'boolean' || actorRole !== 'ACT-PLAN'))
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
          ...(productionDisposition === undefined ? {} : { productionDisposition }),
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
        {
          actorRole,
          authorityScopeId: this.authorityScopeId,
          customerScope: customer,
          enabled,
          ...(productionDisposition === undefined ? {} : { productionDisposition }),
        },
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
    return (await this.contextAndSession(token, actorRole, customerScope)).actor;
  }

  async browserSelf(token: string): Promise<SelfSession> {
    const tokenDigest = digest(token);
    if (!this.store.browserGrants) throw new IdentityError('busy');
    // Preserve existing session idle refresh and account-before-session locking.
    return this.transaction(async (tx) => {
      const session = await this.requireSession(tx, tokenDigest, true);
      const projection = await this.store.browserGrants!(
        this.installationId,
        this.authorityScopeId,
        session.accountId,
        tx,
      );
      return {
        accountId: session.accountId,
        personId: session.personId,
        username: session.username,
        expiresAt: session.expiresAt,
        grants: projection.grants,
        hasCustomerSales: projection.hasCustomerSales,
        installationId: this.installationId,
        authorityScopeId: this.authorityScopeId,
      };
    });
  }

  async salesReader(token: string, signal?: AbortSignal): Promise<SalesBrowserPrincipal> {
    const sessionDigest = digest(token);
    if (!this.store.readSession) throw new IdentityError('busy');
    // Renew accepted idle lifetime before the read-only data snapshot. Browser
    // activity bounds use request-start time; a read must renew the server too.
    const session = await this.transaction((tx) => this.requireSession(tx, sessionDigest, true), {
      signal,
    });
    const principal = Object.freeze({
      installationId: this.installationId,
      authorityScopeId: this.authorityScopeId,
      accountId: session.accountId,
      personId: session.personId,
      sessionDigest,
    });
    this.salesReaders.add(principal);
    return principal;
  }

  async authorizeSalesReader(
    principal: SalesBrowserPrincipal,
    customers: readonly string[] = [],
    tx?: TransactionContext,
    signal?: AbortSignal,
  ): Promise<void> {
    if (tx === undefined && this.salesQueryTransactions)
      return this.transaction(
        (inner) => this.authorizeSalesReader(principal, customers, inner, signal),
        { readOnly: true, signal },
      );
    if (
      !this.salesReaders.has(principal) ||
      !this.store.salesAccess ||
      customers.length > 51 ||
      customers.some((id) => !validUuid(id))
    )
      throw new IdentityError('forbidden');
    if (!this.store.readSession) throw new IdentityError('busy');
    const session = await this.store.readSession(this.installationId, principal.sessionDigest, tx);
    if (
      !session ||
      session.accountId !== principal.accountId ||
      session.personId !== principal.personId
    )
      throw new IdentityError('unauthenticated');
    if (
      !(await this.store.salesAccess(
        this.installationId,
        this.authorityScopeId,
        principal.sessionDigest,
        principal.accountId,
        principal.personId,
        customers,
        tx,
      ))
    )
      throw new IdentityError('forbidden');
  }

  async salesContext(
    principal: SalesBrowserPrincipal,
    customerId: string,
    signal?: AbortSignal,
  ): Promise<ExecutionContext> {
    await this.authorizeSalesReader(principal, [customerId], undefined, signal);
    const context: ExecutionContext = Object.freeze({
      installationId: this.installationId,
      authorityScopeId: this.authorityScopeId,
      principal: Object.freeze({
        issuer: `local:${this.installationId}`,
        subject: principal.personId,
      }),
      actorRole: 'ACT-SALES',
      requestId: randomUUID(),
      customerScope: customerId,
    });
    this.issued.set(context, { digest: principal.sessionDigest, accountId: principal.accountId });
    authenticatedContexts.add(context);
    return context;
  }

  async contextAndSession(
    token: string,
    actorRole: HumanRole,
    customerScope?: string,
  ): Promise<{ actor: ExecutionContext; self: SelfSession }> {
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
    return { actor: context, self };
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

  /** Current explicit authority on the SAME individually authenticated account; no manager claim. */
  async canDispose(context: ExecutionContext, tx?: TransactionContext): Promise<boolean> {
    if (!['ACT-OP', 'ACT-PLAN'].includes(context.actorRole) || !(await this.isCurrent(context, tx)))
      return false;
    const issued = this.issued.get(context)!;
    return this.store.currentGrant(
      this.installationId,
      issued.digest,
      issued.accountId,
      context.principal.subject,
      {
        actorRole: 'ACT-PLAN',
        authorityScopeId: this.authorityScopeId,
        customerScope: context.customerScope ?? '',
        productionDisposition: true,
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

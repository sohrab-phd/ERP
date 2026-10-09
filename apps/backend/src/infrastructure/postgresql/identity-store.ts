import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type { TransactionContext } from '@navard/shared-kernel';
import type {
  Account,
  Grant,
  IdentityStore,
  SecurityEvent,
  SessionRecord,
} from '../../modules/identity/index.js';
import { transactionClient } from './transaction.js';

const accountColumns =
  'account_id AS id,installation_id AS "installationId",person_id AS "personId",username,password_hash AS "passwordHash",enabled';
const sessionColumns =
  's.token_digest AS digest,s.account_id AS "accountId",a.person_id AS "personId",a.username,s.installation_id AS "installationId",s.expires_at AS "expiresAt"';
const activeSession =
  "s.revoked_at IS NULL AND a.enabled AND s.expires_at>clock_timestamp() AND s.last_seen_at>clock_timestamp()-interval '30 minutes'";
export class PostgresIdentityStore implements IdentityStore {
  constructor(private readonly pool: Pool) {}
  async currentGrant(
    installation: string,
    digest: string,
    accountId: string,
    personId: string,
    g: Grant,
    tx?: TransactionContext,
  ) {
    if (tx !== undefined && !(await this.session(tx, installation, digest))) return false;
    const client = tx === undefined ? this.pool : transactionClient(tx);
    const r = await client.query<{ allowed: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM identity.session s JOIN identity.account a USING(installation_id,account_id) JOIN identity.role_grant g USING(installation_id,account_id) WHERE s.installation_id=$1 AND s.token_digest=$2 AND s.account_id=$3 AND a.person_id=$4 AND g.authority_scope_id=$5 AND g.actor_role=$6 AND g.customer_scope=$7 AND ' +
        activeSession +
        ' AND ($8::boolean=false OR g.production_disposition)) AS allowed',
      [
        installation,
        digest,
        accountId,
        personId,
        g.authorityScopeId,
        g.actorRole,
        g.customerScope,
        g.productionDisposition === true,
      ],
    );
    return r.rows[0]?.allowed === true;
  }
  async findAccount(installation: string, username: string, tx?: TransactionContext) {
    const client = tx === undefined ? this.pool : transactionClient(tx);
    return (
      await client.query<Account>(
        'SELECT ' +
          accountColumns +
          ' FROM identity.account WHERE installation_id=$1 AND username=$2',
        [installation, username],
      )
    ).rows[0];
  }
  async account(tx: TransactionContext, installation: string, id: string) {
    return (
      await transactionClient(tx).query<Account>(
        'SELECT ' +
          accountColumns +
          ' FROM identity.account WHERE installation_id=$1 AND account_id=$2 FOR UPDATE',
        [installation, id],
      )
    ).rows[0];
  }
  async insertAccount(tx: TransactionContext, a: Account) {
    await transactionClient(tx).query(
      'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash,enabled) VALUES($1,$2,$3,$4,$5,$6)',
      [a.installationId, a.id, a.personId, a.username, a.passwordHash, a.enabled],
    );
  }
  async updatePassword(tx: TransactionContext, installation: string, id: string, hash: string) {
    await transactionClient(tx).query(
      'UPDATE identity.account SET password_hash=$3 WHERE installation_id=$1 AND account_id=$2',
      [installation, id, hash],
    );
  }
  async disableAccount(tx: TransactionContext, installation: string, id: string) {
    await transactionClient(tx).query(
      'UPDATE identity.account SET enabled=false WHERE installation_id=$1 AND account_id=$2',
      [installation, id],
    );
  }
  async adminLock(tx: TransactionContext, installation: string) {
    await transactionClient(tx).query(
      "SELECT pg_advisory_xact_lock(hashtextextended('identity-admin:'||$1,0))",
      [installation],
    );
  }
  async setGrant(
    tx: TransactionContext,
    installation: string,
    id: string,
    g: Grant,
    enabled: boolean,
  ) {
    const values = [installation, id, g.authorityScopeId, g.actorRole, g.customerScope];
    const client = transactionClient(tx);
    if (enabled) {
      // The existing account/admin locks serialize grant replacement and permission revocation.
      // No UPDATE privilege or separate permission subsystem is introduced.
      if (g.productionDisposition !== undefined)
        await client.query(
          'DELETE FROM identity.role_grant WHERE installation_id=$1 AND account_id=$2 AND authority_scope_id=$3 AND actor_role=$4 AND customer_scope=$5',
          values,
        );
      await client.query(
        'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope,production_disposition) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
        [...values, g.productionDisposition === true],
      );
    } else
      await transactionClient(tx).query(
        'DELETE FROM identity.role_grant WHERE installation_id=$1 AND account_id=$2 AND authority_scope_id=$3 AND actor_role=$4 AND customer_scope=$5',
        values,
      );
  }
  async grants(tx: TransactionContext | undefined, installation: string, id: string) {
    const client = tx === undefined ? this.pool : transactionClient(tx);
    return (
      await client.query<Grant>(
        'SELECT actor_role AS "actorRole",authority_scope_id AS "authorityScopeId",customer_scope AS "customerScope", production_disposition AS "productionDisposition" FROM identity.role_grant WHERE installation_id=$1 AND account_id=$2 ORDER BY actor_role,customer_scope',
        [installation, id],
      )
    ).rows.map(({ productionDisposition, ...grant }) =>
      productionDisposition === true ? { ...grant, productionDisposition: true } : grant,
    );
  }
  async countAdmins(tx: TransactionContext, installation: string, scope: string) {
    const r = await transactionClient(tx).query<{ count: number }>(
      "SELECT count(*)::integer AS count FROM identity.role_grant g JOIN identity.account a USING(installation_id,account_id) WHERE g.installation_id=$1 AND g.authority_scope_id=$2 AND g.actor_role='ACT-SEC' AND g.customer_scope='' AND a.enabled",
      [installation, scope],
    );
    return r.rows[0]?.count ?? 0;
  }
  async createSession(
    tx: TransactionContext,
    installation: string,
    accountId: string,
    digest: string,
  ) {
    const r = await transactionClient(tx).query<{ expiresAt: Date }>(
      'INSERT INTO identity.session(installation_id,account_id,token_digest) VALUES($1,$2,$3) RETURNING expires_at AS "expiresAt"',
      [installation, accountId, digest],
    );
    return r.rows[0]!.expiresAt;
  }
  async session(
    tx: TransactionContext | undefined,
    installation: string,
    digest: string,
    touch = false,
  ) {
    const client = tx === undefined ? this.pool : transactionClient(tx);
    if (tx !== undefined) {
      // Account before session everywhere, including password change/revocation.
      await client.query(
        'SELECT a.account_id FROM identity.account a JOIN identity.session s USING(installation_id,account_id) WHERE s.installation_id=$1 AND s.token_digest=$2 FOR UPDATE OF a',
        [installation, digest],
      );
    }
    const r = await client.query<SessionRecord>(
      'SELECT ' +
        sessionColumns +
        ' FROM identity.session s JOIN identity.account a USING(installation_id,account_id) WHERE s.installation_id=$1 AND s.token_digest=$2 AND ' +
        activeSession +
        (tx === undefined ? '' : ' FOR UPDATE OF s'),
      [installation, digest],
    );
    const row = r.rows[0];
    if (row && touch) {
      if (tx === undefined) throw new Error('Session touch requires transaction');
      await client.query(
        'UPDATE identity.session SET last_seen_at=clock_timestamp() WHERE installation_id=$1 AND token_digest=$2',
        [installation, digest],
      );
    }
    return row;
  }
  async revokeSession(tx: TransactionContext, installation: string, digest: string) {
    await transactionClient(tx).query(
      'UPDATE identity.session SET revoked_at=COALESCE(revoked_at,clock_timestamp()) WHERE installation_id=$1 AND token_digest=$2',
      [installation, digest],
    );
  }
  async revokeAccountSessions(tx: TransactionContext, installation: string, accountId: string) {
    await transactionClient(tx).query(
      'UPDATE identity.session SET revoked_at=COALESCE(revoked_at,clock_timestamp()) WHERE installation_id=$1 AND account_id=$2',
      [installation, accountId],
    );
  }
  async audit(
    tx: TransactionContext,
    installation: string,
    event: SecurityEvent,
    actor?: string,
    target?: string,
    details: Partial<Grant> & { enabled?: boolean } = {},
  ) {
    await transactionClient(tx).query(
      'INSERT INTO identity.security_event(event_id,installation_id,kind,actor_person_id,target_person_id,safe_details) VALUES($1,$2,$3,$4,$5,$6::jsonb)',
      [randomUUID(), installation, event, actor ?? null, target ?? null, JSON.stringify(details)],
    );
  }
}

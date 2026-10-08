import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { spawn } from 'node:child_process';
import {
  IdentityService,
  IdentityAuthorization,
  IdentityError,
  hashPassword,
  distinctAuthenticatedPersons,
  type HumanRole,
} from '../../src/modules/identity/index.js';
import { PostgresIdentityStore } from '../../src/infrastructure/postgresql/identity-store.js';
import { withDatabase, repositoryRoot, type DatabaseFixture } from '../support/database-fixture.js';
import { harness, request } from '../support/synthetic-command.js';
import { createIdentityHandler } from '../../src/transport/identity-http.js';
import { createHttpHost, closeHttpHost } from '../../src/transport/http-host.js';
import { compose } from '../../src/composition-root.js';

const installation = '11111111-1111-4111-8111-111111111111';
const scope = '22222222-2222-4222-8222-222222222222';
const password = 'synthetic fixture password';
let credential: Promise<string> | undefined;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const denied = (kind: IdentityError['kind']) => (error: unknown) =>
  error instanceof IdentityError && error.kind === kind;

async function setup(db: DatabaseFixture) {
  credential ??= hashPassword(password);
  const accountId = randomUUID();
  const personId = randomUUID();
  await db.owner.query(
    'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) VALUES($1,$2,$3,$4,$5)',
    [installation, accountId, personId, 'fixture.steward', await credential],
  );
  await db.owner.query(
    "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role) VALUES($1,$2,$3,'ACT-SEC')",
    [installation, accountId, scope],
  );
  const service = new IdentityService(
    new PostgresIdentityStore(db.runtime),
    db.transactions,
    installation,
    scope,
  );
  const admin = await service.login('fixture.steward', password);
  return { service, admin: admin.token, accountId, personId };
}

async function personal(service: IdentityService, admin: string, username = 'fixture.operator') {
  const personId = randomUUID();
  const { accountId } = await service.createAccount(admin, { username, personId, password });
  return { accountId, personId, token: (await service.login(username, password)).token };
}

void test('personal sessions store only digests, attribute distinct humans, and logout/revocation remove access', async () => {
  await withDatabase(async (db) => {
    const { service, admin, personId } = await setup(db);
    const user = await personal(service, admin);
    assert.equal((await service.session(user.token)).personId, user.personId);
    assert.notEqual(user.personId, personId);
    assert.notEqual(user.token, admin);
    const stored = await db.owner.query<{
      token_digest: string;
      expires_at: Date;
      created_at: Date;
    }>('SELECT token_digest,expires_at,created_at FROM identity.session WHERE token_digest=$1', [
      digest(user.token),
    ]);
    assert.equal(stored.rows.length, 1);
    assert.notEqual(stored.rows[0]?.token_digest, user.token);
    assert.ok(
      Math.abs(
        stored.rows[0]!.expires_at.getTime() -
          stored.rows[0]!.created_at.getTime() -
          8 * 60 * 60 * 1000,
      ) <= 2,
    );
    await service.logout(user.token);
    await assert.rejects(service.session(user.token), denied('unauthenticated'));
    const renewed = (await service.login('fixture.operator', password)).token;
    await service.revokeSessions(admin, user.accountId);
    await assert.rejects(service.session(renewed), denied('unauthenticated'));
    const audit = await db.owner.query<{
      kind: string;
      actor_person_id: string;
      target_person_id: string;
    }>('SELECT kind,actor_person_id,target_person_id FROM identity.security_event');
    assert.ok(
      audit.rows.some((row) => row.kind === 'LOGOUT' && row.actor_person_id === user.personId),
    );
    assert.ok(
      audit.rows.some(
        (row) =>
          row.kind === 'SESSION_REVOKED' &&
          row.actor_person_id === personId &&
          row.target_person_id === user.personId,
      ),
    );
    assert.ok(!JSON.stringify(audit.rows).includes(user.token));
  });
});

void test('database absolute/idle expiry and disabled accounts deny access and login safely', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    const user = await personal(service, admin);
    await assert.rejects(
      service.login('fixture.operator', 'incorrect fixture password'),
      denied('unauthenticated'),
    );
    await assert.rejects(service.login('fixture.unknown', password), denied('unauthenticated'));
    await db.owner.query(
      "UPDATE identity.session SET created_at=clock_timestamp()-interval '9 hours',last_seen_at=clock_timestamp()-interval '1 minute',expires_at=clock_timestamp()-interval '1 hour' WHERE token_digest=$1",
      [digest(user.token)],
    );
    await assert.rejects(service.session(user.token), denied('unauthenticated'));
    const idle = (await service.login('fixture.operator', password)).token;
    await db.owner.query(
      "UPDATE identity.session SET created_at=clock_timestamp()-interval '1 hour',last_seen_at=clock_timestamp()-interval '31 minutes' WHERE token_digest=$1",
      [digest(idle)],
    );
    await assert.rejects(service.session(idle), denied('unauthenticated'));
    const current = (await service.login('fixture.operator', password)).token;
    await service.disableAccount(admin, user.accountId);
    await assert.rejects(service.session(current), denied('unauthenticated'));
    await assert.rejects(service.login('fixture.operator', password), denied('unauthenticated'));
    const counts = await db.owner.query<{ count: number }>(
      "SELECT count(*)::integer AS count FROM identity.security_event WHERE kind='LOGIN_DENIED'",
    );
    assert.equal(counts.rows[0]?.count, 3);
  });
});

void test('unique personal accounts and ACT-SEC administration prevent privilege escalation and last-steward removal', async () => {
  await withDatabase(async (db) => {
    const { service, admin, accountId } = await setup(db);
    const user = await personal(service, admin);
    await assert.rejects(
      service.createAccount(admin, {
        username: 'fixture.operator',
        personId: randomUUID(),
        password,
      }),
      denied('conflict'),
    );
    await assert.rejects(
      service.createAccount(admin, {
        username: 'fixture.other',
        personId: user.personId,
        password,
      }),
      denied('conflict'),
    );
    await assert.rejects(
      service.createAccount(user.token, {
        username: 'fixture.forbidden',
        personId: randomUUID(),
        password,
      }),
      denied('forbidden'),
    );
    await assert.rejects(
      service.setGrant(user.token, {
        accountId: user.accountId,
        actorRole: 'ACT-SEC',
        enabled: true,
      }),
      denied('forbidden'),
    );
    await assert.rejects(service.revokeSessions(user.token, accountId), denied('forbidden'));
    await assert.rejects(service.disableAccount(user.token, accountId), denied('forbidden'));
    await service.setGrant(admin, {
      accountId: user.accountId,
      actorRole: 'ACT-SEC',
      customerScope: 'customer-a',
      enabled: true,
    });
    assert.equal(
      (await service.context(user.token, 'ACT-SEC', 'customer-a')).customerScope,
      'customer-a',
    );
    await assert.rejects(
      service.createAccount(user.token, {
        username: 'fixture.customer-steward',
        personId: randomUUID(),
        password,
      }),
      denied('forbidden'),
    );
    await assert.rejects(
      service.setGrant(user.token, {
        accountId: user.accountId,
        actorRole: 'ACT-SEC',
        enabled: true,
      }),
      denied('forbidden'),
    );
    await service.setGrant(admin, {
      accountId: user.accountId,
      actorRole: 'ACT-SEC',
      customerScope: 'customer-a',
      enabled: false,
    });
    await assert.rejects(service.disableAccount(admin, accountId), denied('conflict'));
    await assert.rejects(
      service.setGrant(admin, { accountId, actorRole: 'ACT-SEC', enabled: false }),
      denied('conflict'),
    );
    for (const actorRole of ['ACT-QC', 'ACT-IPS'] as unknown as HumanRole[]) {
      await assert.rejects(
        service.setGrant(admin, { accountId: user.accountId, actorRole, enabled: true }),
        denied('invalid'),
      );
    }
    assert.deepEqual((await service.session(user.token)).grants, []);
    await service.setGrant(admin, {
      accountId: user.accountId,
      actorRole: 'ACT-SEC',
      enabled: true,
    });
    await service.setGrant(admin, { accountId, actorRole: 'ACT-SEC', enabled: false });
    await assert.rejects(
      service.createAccount(admin, {
        username: 'fixture.no-longer-admin',
        personId: randomUUID(),
        password,
      }),
      denied('forbidden'),
    );
  });
});

void test('current role, site and customer scopes reject forged contexts and prove distinct authenticated humans', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    const first = await personal(service, admin);
    const second = await personal(service, admin, 'fixture.second');
    await service.setGrant(admin, {
      accountId: first.accountId,
      actorRole: 'ACT-OP',
      enabled: true,
    });
    await service.setGrant(admin, {
      accountId: second.accountId,
      actorRole: 'ACT-OP',
      enabled: true,
    });
    await service.setGrant(admin, {
      accountId: first.accountId,
      actorRole: 'ACT-CUST',
      customerScope: 'customer-a',
      enabled: true,
    });
    const a = await service.context(first.token, 'ACT-OP');
    const b = await service.context(second.token, 'ACT-OP');
    assert.equal(await service.isCurrent(a), true);
    assert.equal(await service.isCurrent({ ...a }), false);
    assert.equal(await service.isCurrent({ ...a, actorRole: 'ACT-SEC' }), false);
    assert.equal(distinctAuthenticatedPersons(a, b), true);
    assert.equal(distinctAuthenticatedPersons(a, a), false);
    assert.equal(distinctAuthenticatedPersons(a, { ...b, temporary: true }), false);
    assert.equal(distinctAuthenticatedPersons({ ...a }, { ...b }), false);
    await assert.rejects(service.context(first.token, 'ACT-SEC'), denied('forbidden'));
    await assert.rejects(
      service.context(first.token, 'ACT-CUST', 'customer-b'),
      denied('forbidden'),
    );
    assert.equal(
      (await service.context(first.token, 'ACT-CUST', 'customer-a')).customerScope,
      'customer-a',
    );
    const foreignSite = new IdentityService(
      new PostgresIdentityStore(db.runtime),
      db.transactions,
      installation,
      randomUUID(),
    );
    await assert.rejects(foreignSite.context(first.token, 'ACT-OP'), denied('forbidden'));
    const foreignInstallation = new IdentityService(
      new PostgresIdentityStore(db.runtime),
      db.transactions,
      randomUUID(),
      scope,
    );
    await assert.rejects(foreignInstallation.session(first.token), denied('unauthenticated'));
    const foreignAccount = randomUUID();
    await db.owner.query(
      'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) VALUES($1,$2,$3,$4,$5)',
      [randomUUID(), foreignAccount, randomUUID(), 'fixture.foreign', await credential],
    );
    await assert.rejects(
      service.setGrant(admin, { accountId: foreignAccount, actorRole: 'ACT-SEC', enabled: true }),
      denied('forbidden'),
    );
    await assert.rejects(service.disableAccount(admin, foreignAccount), denied('forbidden'));
    assert.equal(
      (
        await db.owner.query<{ enabled: boolean }>(
          'SELECT enabled FROM identity.account WHERE account_id=$1',
          [foreignAccount],
        )
      ).rows[0]?.enabled,
      true,
    );
    await service.setGrant(admin, {
      accountId: first.accountId,
      actorRole: 'ACT-OP',
      enabled: false,
    });
    assert.equal(await service.isCurrent(a), false);
    assert.equal(await service.distinctPersons(a, b), false);
  });
});

void test('concurrent account creation and steward removal preserve uniqueness and a current administrator', async () => {
  await withDatabase(async (db) => {
    const { service, admin, accountId } = await setup(db);
    const duplicate = await Promise.allSettled([
      service.createAccount(admin, {
        username: 'fixture.concurrent',
        personId: randomUUID(),
        password,
      }),
      service.createAccount(admin, {
        username: 'fixture.concurrent',
        personId: randomUUID(),
        password,
      }),
    ]);
    assert.equal(duplicate.filter((result) => result.status === 'fulfilled').length, 1);
    const rejected = duplicate.find((result) => result.status === 'rejected');
    assert.ok(rejected?.status === 'rejected' && denied('conflict')(rejected.reason));
    assert.equal(
      (await db.owner.query("SELECT 1 FROM identity.account WHERE username='fixture.concurrent'"))
        .rowCount,
      1,
    );
    const second = await personal(service, admin, 'fixture.second-steward');
    await service.setGrant(admin, {
      accountId: second.accountId,
      actorRole: 'ACT-SEC',
      enabled: true,
    });
    const removals = await Promise.allSettled([
      service.setGrant(admin, {
        accountId: second.accountId,
        actorRole: 'ACT-SEC',
        enabled: false,
      }),
      service.setGrant(second.token, { accountId, actorRole: 'ACT-SEC', enabled: false }),
    ]);
    assert.equal(removals.filter((result) => result.status === 'fulfilled').length, 1);
    const denial = removals.find((result) => result.status === 'rejected');
    assert.ok(denial?.status === 'rejected' && denied('forbidden')(denial.reason));
    assert.equal(
      (
        await db.owner.query(
          "SELECT 1 FROM identity.role_grant g JOIN identity.account a USING(installation_id,account_id) WHERE actor_role='ACT-SEC' AND a.enabled",
        )
      ).rowCount,
      1,
    );
  });
});

void test('password change requires current credential and atomically invalidates every old session', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    const user = await personal(service, admin);
    const another = (await service.login('fixture.operator', password)).token;
    await assert.rejects(
      service.changePassword(user.token, {
        currentPassword: 'incorrect fixture password',
        newPassword: 'new synthetic fixture password',
      }),
      denied('unauthenticated'),
    );
    assert.equal((await service.session(user.token)).personId, user.personId);
    await service.changePassword(user.token, {
      currentPassword: password,
      newPassword: 'new synthetic fixture password',
    });
    for (const token of [user.token, another])
      await assert.rejects(service.session(token), denied('unauthenticated'));
    await assert.rejects(service.login('fixture.operator', password), denied('unauthenticated'));
    assert.equal(
      (
        await service.session(
          (await service.login('fixture.operator', 'new synthetic fixture password')).token,
        )
      ).personId,
      user.personId,
    );
    const audit = await db.owner.query<{ actor_person_id: string; target_person_id: string }>(
      "SELECT actor_person_id,target_person_id FROM identity.security_event WHERE kind='PASSWORD_CHANGED'",
    );
    assert.deepEqual(audit.rows, [
      { actor_person_id: user.personId, target_person_id: user.personId },
    ]);
  });
});

void test('security audit insertion failure rolls back login, account, grant and session revocation writes', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    const user = await personal(service, admin);
    await db.owner.query(
      "CREATE FUNCTION identity.fail_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'synthetic audit failure'; END$$",
    );
    await db.owner.query(
      'CREATE TRIGGER fail_test_audit BEFORE INSERT ON identity.security_event FOR EACH ROW EXECUTE FUNCTION identity.fail_test_audit()',
    );
    try {
      const before = (
        await db.owner.query<{ count: number }>(
          'SELECT count(*)::integer AS count FROM identity.session',
        )
      ).rows[0]?.count;
      await assert.rejects(service.login('fixture.operator', password));
      assert.equal(
        (
          await db.owner.query<{ count: number }>(
            'SELECT count(*)::integer AS count FROM identity.session',
          )
        ).rows[0]?.count,
        before,
      );
      await assert.rejects(
        service.createAccount(admin, {
          username: 'fixture.rollback',
          personId: randomUUID(),
          password,
        }),
      );
      assert.equal(
        (await db.owner.query("SELECT 1 FROM identity.account WHERE username='fixture.rollback'"))
          .rowCount,
        0,
      );
      await assert.rejects(
        service.setGrant(admin, { accountId: user.accountId, actorRole: 'ACT-OP', enabled: true }),
      );
      assert.deepEqual((await service.session(user.token)).grants, []);
      await assert.rejects(service.revokeSessions(admin, user.accountId));
      assert.equal((await service.session(user.token)).personId, user.personId);
      await assert.rejects(service.disableAccount(admin, user.accountId));
      assert.equal((await service.session(user.token)).personId, user.personId);
    } finally {
      await db.owner.query('DROP TRIGGER fail_test_audit ON identity.security_event');
      await db.owner.query('DROP FUNCTION identity.fail_test_audit()');
    }
  });
});

void test('runtime role cannot alter security history or create identity schema objects', async () => {
  await withDatabase(async (db) => {
    await setup(db);
    for (const sql of [
      "UPDATE identity.security_event SET kind='LOGIN_DENIED'",
      'DELETE FROM identity.security_event',
      'TRUNCATE identity.security_event',
      'CREATE TABLE identity.forbidden(id integer)',
      'ALTER TABLE identity.account ADD COLUMN forbidden integer',
      'DROP TABLE identity.security_event',
    ]) {
      await assert.rejects(
        db.runtime.query(sql),
        (error: unknown) =>
          typeof error === 'object' && error !== null && 'code' in error && error.code === '42501',
      );
    }
    assert.equal(
      (await db.owner.query("SELECT 1 FROM identity.security_event WHERE kind='LOGIN_ACCEPTED'"))
        .rowCount,
      1,
    );
  });
});

async function waitForIdentityLock(db: DatabaseFixture) {
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    const blocked = await db.runtime.query<{ count: number }>(
      "SELECT count(*)::integer AS count FROM pg_stat_activity WHERE usename=$1 AND wait_event_type='Lock' AND query LIKE '%identity.%'",
      [db.runtimeRole],
    );
    if ((blocked.rows[0]?.count ?? 0) > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Identity operation did not reach its database lock barrier');
}

void test('login racing account disable waits for locked account and cannot mint an active session after disable', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    const user = await personal(service, admin);
    const locker = await db.owner.connect();
    let operation: Promise<unknown> | undefined;
    try {
      await locker.query('BEGIN');
      await locker.query('SELECT account_id FROM identity.account WHERE account_id=$1 FOR UPDATE', [
        user.accountId,
      ]);
      operation = service.login('fixture.operator', password);
      void operation.catch(() => undefined);
      await waitForIdentityLock(db);
      await locker.query('UPDATE identity.account SET enabled=false WHERE account_id=$1', [
        user.accountId,
      ]);
      await locker.query('COMMIT');
      await assert.rejects(operation, denied('unauthenticated'));
      await assert.rejects(service.session(user.token), denied('unauthenticated'));
      assert.equal(
        (
          await db.owner.query('SELECT 1 FROM identity.session WHERE account_id=$1', [
            user.accountId,
          ])
        ).rowCount,
        1,
      );
    } finally {
      await locker.query('ROLLBACK');
      locker.release();
      await operation?.catch(() => undefined);
    }
  });
});

void test('admin grant operation racing steward revocation rechecks current authority after the database barrier', async () => {
  await withDatabase(async (db) => {
    const { service, admin, accountId } = await setup(db);
    const user = await personal(service, admin);
    const locker = await db.owner.connect();
    let operation: Promise<void> | undefined;
    try {
      await locker.query('BEGIN');
      await locker.query('SELECT account_id FROM identity.account WHERE account_id=$1 FOR UPDATE', [
        accountId,
      ]);
      operation = service.setGrant(admin, {
        accountId: user.accountId,
        actorRole: 'ACT-OP',
        enabled: true,
      });
      void operation.catch(() => undefined);
      await waitForIdentityLock(db);
      await locker.query(
        "DELETE FROM identity.role_grant WHERE account_id=$1 AND actor_role='ACT-SEC'",
        [accountId],
      );
      await locker.query('COMMIT');
      await assert.rejects(operation, denied('forbidden'));
      assert.equal(
        (
          await db.owner.query('SELECT 1 FROM identity.role_grant WHERE account_id=$1', [
            user.accountId,
          ])
        ).rowCount,
        0,
      );
    } finally {
      await locker.query('ROLLBACK');
      locker.release();
      await operation?.catch(() => undefined);
    }
  });
});

void test('command execution retains current-authority locks until outcome/audit commit before revocation proceeds', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    const user = await personal(service, admin);
    await service.setGrant(admin, {
      accountId: user.accountId,
      actorRole: 'ACT-OP',
      enabled: true,
    });
    const caller = await service.context(user.token, 'ACT-OP');
    let markEntered = () => undefined as void;
    let rejectEntered: (error: Error) => void = () => undefined;
    const entered = new Promise<void>((resolve, reject) => {
      markEntered = resolve;
      rejectEntered = reject;
    });
    let releaseGate = () => undefined as void;
    const released = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    let checks = 0;
    const authorization = new IdentityAuthorization(service, [
      {
        command: 'TEST-RecordFact',
        version: 1,
        roles: ['ACT-OP'],
        async canTarget() {
          if (++checks === 2) {
            markEntered();
            await released;
          }
          return true;
        },
        canDisclose: () => Promise.resolve(true),
      },
    ]);
    const h = harness(db, { ports: { authorization } });
    const input = request();
    const operation = h.run(input, caller);
    const timer = setTimeout(
      () => rejectEntered(new Error('Command did not reach transaction authorization')),
      3_000,
    );
    let revocation: Promise<void> | undefined;
    try {
      await entered;
      revocation = service.revokeSessions(admin, user.accountId);
      void revocation.catch(() => undefined);
      await waitForIdentityLock(db);
      assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
      releaseGate();
      assert.equal((await operation).status, 'completed');
      await revocation;
      assert.equal((await h.run(input, caller)).status, 'admission-denied');
      assert.equal(h.executions(), 1);
    } finally {
      clearTimeout(timer);
      releaseGate();
      await operation;
      await revocation?.catch(() => undefined);
    }
  });
});

void test('Identity command policy checks targets/results and fresh grants on durable accepted/rejected replay', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    const first = await personal(service, admin);
    const second = await personal(service, admin, 'fixture.second');
    for (const accountId of [first.accountId, second.accountId])
      await service.setGrant(admin, { accountId, actorRole: 'ACT-OP', enabled: true });
    const caller = await service.context(first.token, 'ACT-OP');
    let targetVisible = true;
    let resultVisible = true;
    const authorization = new IdentityAuthorization(service, [
      {
        command: 'TEST-RecordFact',
        version: 1,
        roles: ['ACT-OP'],
        canTarget: () => Promise.resolve(targetVisible),
        canDisclose: () => Promise.resolve(resultVisible),
      },
    ]);
    const h = harness(db, { ports: { authorization } });
    for (const reject of [false, true]) {
      const input = request({ payload: { material: 'identity fixture', reject } });
      const firstResult = await h.run(input, caller);
      assert.equal(firstResult.status, 'completed');
      const replay = await h.run(input, caller);
      assert.equal(replay.status, 'completed');
      if (firstResult.status === 'completed' && replay.status === 'completed') {
        assert.equal(replay.replayed, true);
        assert.equal(replay.executionId, firstResult.executionId);
        assert.deepEqual(replay.result, firstResult.result);
      }
      const foreign = await h.run(input, await service.context(second.token, 'ACT-OP'));
      assert.equal(foreign.status, 'conflict');
      assert.ok(!JSON.stringify(foreign).includes('identity fixture'));
      resultVisible = false;
      assert.equal((await h.run(input, caller)).status, 'admission-denied');
      resultVisible = true;
      await service.setGrant(admin, {
        accountId: first.accountId,
        actorRole: 'ACT-OP',
        enabled: false,
      });
      assert.equal((await h.run(input, caller)).status, 'admission-denied');
      await service.setGrant(admin, {
        accountId: first.accountId,
        actorRole: 'ACT-OP',
        enabled: true,
      });
    }
    targetVisible = false;
    assert.equal((await h.run(request(), caller)).status, 'admission-denied');
    assert.equal((await h.run(request(), { ...caller })).status, 'admission-denied');
    assert.equal(
      (await h.run(request({ command: 'TEST-Other' }), caller)).status,
      'admission-denied',
    );
    assert.equal(h.executions(), 2);
    const counts = await db.counts();
    assert.equal(counts.facts, 1);
    assert.equal(counts.outcomes, 2);
    const terminalAudit = await db.owner.query(
      "SELECT 1 FROM kernel.audit_event WHERE event_kind IN ('AUD-CMD-ACCEPTED','AUD-CMD-REJECTED','AUD-CMD-REPLAYED')",
    );
    assert.equal(terminalAudit.rowCount, 4);
  });
});

async function withIdentityHttp(
  service: IdentityService,
  body: (base: string) => Promise<void>,
  clock?: () => number,
) {
  const server = createHttpHost({
    ping: () => Promise.resolve(),
    identity: createIdentityHandler(service, clock),
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    await body(`http://127.0.0.1:${address.port}`);
  } finally {
    await closeHttpHost(server);
  }
}

function post(base: string, path: string, value: unknown, bearer?: string) {
  return fetch(base + path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(value),
  });
}

void test('Identity HTTP personal login, steward account/grant administration, password change and logout use the real store', async () => {
  await withDatabase(async (db) => {
    const { service, personId } = await setup(db);
    await withIdentityHttp(service, async (base) => {
      const login = await post(base, '/identity/login', { username: 'fixture.steward', password });
      assert.equal(login.status, 200);
      assert.equal(login.headers.get('cache-control'), 'no-store');
      assert.equal(login.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(login.headers.get('set-cookie'), null);
      const admin = ((await login.json()) as { token: string }).token;
      assert.match(admin, /^[A-Za-z0-9_-]{43}$/u);
      const own = await fetch(base + '/identity/session', {
        headers: { authorization: `Bearer ${admin}` },
      });
      assert.equal(own.status, 200);
      const session = (await own.json()) as { personId: string };
      assert.equal(session.personId, personId);
      assert.ok(!JSON.stringify(session).includes('passwordHash'));
      const person = randomUUID();
      const created = await post(
        base,
        '/identity/accounts',
        { username: 'fixture.http', personId: person, password },
        admin,
      );
      assert.equal(created.status, 201);
      const { accountId } = (await created.json()) as { accountId: string };
      assert.equal(
        (
          await post(
            base,
            '/identity/grants',
            { accountId, actorRole: 'ACT-OP', enabled: true },
            admin,
          )
        ).status,
        200,
      );
      const grantAudit = await db.owner.query<{
        actor_person_id: string;
        target_person_id: string;
        safe_details: unknown;
      }>(
        "SELECT actor_person_id,target_person_id,safe_details FROM identity.security_event WHERE kind='GRANT_CHANGED'",
      );
      assert.deepEqual(grantAudit.rows, [
        {
          actor_person_id: personId,
          target_person_id: person,
          safe_details: {
            actorRole: 'ACT-OP',
            authorityScopeId: scope,
            customerScope: '',
            enabled: true,
          },
        },
      ]);
      const personalLogin = await post(base, '/identity/login', {
        username: 'fixture.http',
        password,
      });
      const user = ((await personalLogin.json()) as { token: string }).token;
      assert.equal(
        (
          await post(
            base,
            '/identity/grants',
            { accountId, actorRole: 'ACT-SEC', enabled: true },
            user,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await post(
            base,
            '/identity/password',
            { currentPassword: password, newPassword: 'new synthetic HTTP password' },
            user,
          )
        ).status,
        200,
      );
      assert.equal(
        (await fetch(base + '/identity/session', { headers: { authorization: `Bearer ${user}` } }))
          .status,
        401,
      );
      assert.equal(
        (await post(base, '/identity/login', { username: 'fixture.http', password })).status,
        401,
      );
      const changed = await post(base, '/identity/login', {
        username: 'fixture.http',
        password: 'new synthetic HTTP password',
      });
      assert.equal(changed.status, 200);
      const changedToken = ((await changed.json()) as { token: string }).token;
      assert.equal((await post(base, '/identity/logout', {}, changedToken)).status, 200);
      assert.equal(
        (
          await fetch(base + '/identity/session', {
            headers: { authorization: `Bearer ${changedToken}` },
          })
        ).status,
        401,
      );
      assert.equal((await post(base, '/identity/disable', { accountId }, admin)).status, 200);
      assert.equal(
        (
          await post(base, '/identity/login', {
            username: 'fixture.http',
            password: 'new synthetic HTTP password',
          })
        ).status,
        401,
      );
    });
  });
});

void test('Identity HTTP rejects unsafe framing, body claims, duplicate JSON fields, origins and unauthenticated administration', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    await withIdentityHttp(service, async (base) => {
      for (const body of [
        '{',
        '[]',
        'null',
        '{"username":"fixture.steward","username":"fixture.other","password":"synthetic fixture password"}',
        JSON.stringify({ username: 'fixture.steward', password, actorRole: 'ACT-SEC' }),
        JSON.stringify({ username: 'fixture.steward', password: 42 }),
        JSON.stringify({ username: 'fixture.steward', password: 'a'.repeat(4100) }),
      ]) {
        const response = await fetch(base + '/identity/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        });
        assert.equal(response.status, 400);
        assert.ok(!(await response.text()).includes(password));
      }
      assert.equal(
        (
          await fetch(base + '/identity/login', {
            method: 'POST',
            headers: { 'content-type': 'text/plain' },
            body: '{}',
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await fetch(base + '/identity/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json', origin: 'https://untrusted.invalid' },
            body: JSON.stringify({ username: 'fixture.steward', password }),
          })
        ).status,
        403,
      );
      assert.equal((await fetch(base + '/identity/login')).status, 405);
      assert.equal((await post(base, '/identity/session', {}, admin)).status, 405);
      assert.equal(
        (
          await fetch(base + '/identity/session?actorRole=ACT-SEC', {
            headers: { authorization: `Bearer ${admin}` },
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await post(base, '/identity/accounts', {
            username: 'fixture.noauth',
            personId: randomUUID(),
            password,
          })
        ).status,
        401,
      );
      assert.equal(
        (await fetch(base + '/identity/session', { headers: { cookie: `session=${admin}` } }))
          .status,
        401,
      );
      assert.equal(
        (
          await post(
            base,
            '/identity/grants',
            {
              accountId: randomUUID(),
              actorRole: 'ACT-OP',
              enabled: true,
              authorityScopeId: randomUUID(),
            },
            admin,
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await post(
            base,
            '/identity/grants',
            { accountId: randomUUID(), actorRole: 'ACT-QC', enabled: true },
            admin,
          )
        ).status,
        400,
      );
      const duplicateAuthorization = await new Promise<number | undefined>((resolve, reject) => {
        const call = httpRequest(
          base + '/identity/session',
          {
            headers: [
              'Host',
              new URL(base).host,
              'Authorization',
              `Bearer ${admin}`,
              'Authorization',
              `Bearer ${admin}`,
            ],
          },
          (response) => {
            response.resume();
            response.on('end', () => resolve(response.statusCode));
          },
        );
        call.on('error', reject);
        call.end();
      });
      assert.equal(duplicateAuthorization, 401);
      const getWithBody = await new Promise<number | undefined>((resolve, reject) => {
        const call = httpRequest(
          base + '/identity/session',
          { headers: { authorization: `Bearer ${admin}`, 'content-length': '2' } },
          (response) => {
            response.resume();
            response.on('end', () => resolve(response.statusCode));
          },
        );
        call.on('error', reject);
        call.end('{}');
      });
      assert.equal(getWithBody, 400);
      const chunked = await new Promise<number | undefined>((resolve, reject) => {
        const call = httpRequest(
          base + '/identity/login',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'transfer-encoding': 'chunked' },
          },
          (response) => {
            response.resume();
            response.on('end', () => resolve(response.statusCode));
          },
        );
        call.on('error', reject);
        call.end('{}');
      });
      assert.equal(chunked, 400);
      assert.equal((await db.owner.query('SELECT 1 FROM identity.account')).rowCount, 1);
      assert.equal((await db.owner.query('SELECT 1 FROM identity.role_grant')).rowCount, 1);
    });
  });
});

void test('production composition exposes Identity and bounded receipt routes with no fixture business commands', async () => {
  await withDatabase(async (db) => {
    const { accountId } = await setup(db);
    await db.owner.query(
      "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role) VALUES($1,$2,$1,'ACT-SEC')",
      [installation, accountId],
    );
    const application = compose({
      nodeEnv: 'production',
      host: '127.0.0.1',
      port: 0,
      databaseUrl: process.env.TEST_DATABASE_URL!,
      installationId: installation,
      logLevel: 'error',
    });
    try {
      await application.start();
      const address = application.server.address();
      assert.ok(address && typeof address !== 'string');
      const base = `http://127.0.0.1:${address.port}`;
      const response = await post(base, '/identity/login', {
        username: 'fixture.steward',
        password,
      });
      assert.equal(response.status, 200);
      const token = ((await response.json()) as { token: string }).token;
      const created = await post(
        base,
        '/identity/accounts',
        { username: 'fixture.composed', personId: randomUUID(), password },
        token,
      );
      assert.equal(created.status, 201);
      for (const route of ['/commands', '/fixtures', '/identity/commands'])
        assert.equal((await fetch(base + route)).status, 404);
      assert.equal((await fetch(base + '/health/ready')).status, 200);
    } finally {
      await application.stop();
    }
  });
});

void test('failed-login budget protects known and unknown names, isolates other people and recovers after the monotonic window', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    await personal(service, admin, 'fixture.unaffected');
    let now = 0;
    await withIdentityHttp(
      service,
      async (base) => {
        for (let i = 0; i < 8; i++)
          assert.equal(
            (await post(base, '/identity/login', { username: 'fixture.steward', password: 42 }))
              .status,
            400,
          );
        for (const username of ['fixture.steward', 'fixture.unknown']) {
          for (let i = 0; i < 5; i++)
            assert.equal(
              (
                await post(base, '/identity/login', {
                  username,
                  password: 'incorrect synthetic password',
                })
              ).status,
              401,
            );
          const blocked = await post(base, '/identity/login', { username, password });
          assert.equal(blocked.status, 503);
          assert.equal(blocked.headers.get('retry-after'), '60');
          assert.deepEqual(await blocked.json(), { error: 'unavailable' });
        }
        assert.equal(
          (await post(base, '/identity/login', { username: 'fixture.unaffected', password }))
            .status,
          200,
        );
        assert.equal(
          (await db.owner.query("SELECT 1 FROM identity.security_event WHERE kind='LOGIN_DENIED'"))
            .rowCount,
          10,
        );
        now = 60_001;
        assert.equal(
          (await post(base, '/identity/login', { username: 'fixture.steward', password })).status,
          200,
        );
        for (let run = 0; run < 2; run++) {
          for (let i = 0; i < 4; i++)
            assert.equal(
              (
                await post(base, '/identity/login', {
                  username: 'fixture.steward',
                  password: 'incorrect synthetic password',
                })
              ).status,
              401,
            );
          assert.equal(
            (await post(base, '/identity/login', { username: 'fixture.steward', password })).status,
            200,
          );
        }
      },
      () => now,
    );
  });
});

void test('global failed-login budget bounds attacks across distinct account names before credential work', async () => {
  await withDatabase(async (db) => {
    const { service } = await setup(db);
    let now = 0;
    await withIdentityHttp(
      service,
      async (base) => {
        for (let i = 0; i < 60; i++)
          assert.equal(
            (
              await post(base, '/identity/login', {
                username: `fixture.unknown-${i}`,
                password: 'incorrect synthetic password',
              })
            ).status,
            401,
          );
        const blocked = await post(base, '/identity/login', {
          username: 'fixture.steward',
          password,
        });
        assert.equal(blocked.status, 503);
        assert.equal(blocked.headers.get('retry-after'), '60');
        assert.equal(
          (await db.owner.query("SELECT 1 FROM identity.security_event WHERE kind='LOGIN_DENIED'"))
            .rowCount,
          60,
        );
        now = 60_001;
        assert.equal(
          (await post(base, '/identity/login', { username: 'fixture.steward', password })).status,
          200,
        );
      },
      () => now,
    );
  });
});

void test('targeted account reconciliation is installation-bound and exposes only safe fields to organizational security administrators', async () => {
  await withDatabase(async (db) => {
    const { service, admin } = await setup(db);
    const personId = randomUUID();
    const { accountId } = await service.createAccount(admin, {
      username: 'fixture.reconcile',
      personId,
      password,
    });
    const user = await personal(service, admin);
    await service.setGrant(admin, {
      accountId: user.accountId,
      actorRole: 'ACT-SEC',
      customerScope: 'customer-a',
      enabled: true,
    });
    await db.owner.query(
      'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) VALUES($1,$2,$3,$4,$5)',
      [randomUUID(), randomUUID(), randomUUID(), 'fixture.foreign-only', await credential],
    );
    await withIdentityHttp(service, async (base) => {
      const lookup = await post(
        base,
        '/identity/account-query',
        { username: 'fixture.reconcile' },
        admin,
      );
      assert.equal(lookup.status, 200);
      assert.deepEqual(await lookup.json(), {
        account: { accountId, personId, username: 'fixture.reconcile', enabled: true },
      });
      for (const username of ['fixture.not-existing', 'fixture.foreign-only']) {
        const missing = await post(base, '/identity/account-query', { username }, admin);
        assert.equal(missing.status, 200);
        assert.deepEqual(await missing.json(), { account: null });
      }
      assert.equal(
        (await post(base, '/identity/account-query', { username: 'fixture.reconcile' }, user.token))
          .status,
        403,
      );
      assert.equal(
        (await post(base, '/identity/account-query', { username: 'fixture.reconcile' })).status,
        401,
      );
      for (const value of [
        { username: 'fixture.reconcile', installationId: randomUUID() },
        { username: 'fixture.reconcile', authorityScopeId: randomUUID() },
        { username: 'fixture.reconcile', customerScope: 'customer-a' },
      ])
        assert.equal((await post(base, '/identity/account-query', value, admin)).status, 400);
    });
  });
});

async function provision(personId: string, extraEnv: NodeJS.ProcessEnv = {}, ack = installation) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        'tools/identity/provision-admin.mjs',
        '--installation-ack',
        ack,
        '--person-id',
        personId,
        '--username',
        'fixture.provisioned',
      ],
      {
        cwd: repositoryRoot,
        env: { ...process.env, INSTALLATION_ID: installation, ...extraEnv },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    let stdout = '',
      stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Provisioning fixture exceeded its deadline'));
    }, 10_000);
    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString('utf8');
    });
    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString('utf8');
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(password + '\n');
  });
}

void test('explicit owner provisioning creates one personal steward atomically and refuses repetition, mismatched acknowledgement and runtime credentials', async () => {
  await withDatabase(async (db) => {
    const personId = randomUUID();
    for (const refused of [
      await provision(randomUUID(), {}, randomUUID()),
      await provision(randomUUID(), { MIGRATION_DATABASE_URL: process.env.TEST_DATABASE_URL }),
    ]) {
      assert.equal(refused.code, 1);
      assert.equal(refused.stdout, '');
      assert.match(refused.stderr, /Initial administrator provisioning refused or failed/u);
      assert.ok(!JSON.stringify(refused).includes(password));
    }
    assert.equal((await db.owner.query('SELECT 1 FROM identity.account')).rowCount, 0);
    assert.equal((await db.owner.query('SELECT 1 FROM identity.role_grant')).rowCount, 0);
    const created = await provision(personId);
    assert.equal(created.code, 0);
    assert.ok(!JSON.stringify(created).includes(password));
    const service = new IdentityService(
      new PostgresIdentityStore(db.runtime),
      db.transactions,
      installation,
      installation,
    );
    const token = (await service.login('fixture.provisioned', password)).token;
    const self = await service.session(token);
    assert.equal(self.personId, personId);
    assert.deepEqual(self.grants, [
      { actorRole: 'ACT-SEC', authorityScopeId: installation, customerScope: '' },
    ]);
    for (const refused of [await provision(randomUUID())]) {
      assert.equal(refused.code, 1);
      assert.equal(refused.stdout, '');
      assert.match(refused.stderr, /Initial administrator provisioning refused or failed/u);
      assert.ok(!JSON.stringify(refused).includes(password));
    }
    assert.equal((await db.owner.query('SELECT 1 FROM identity.account')).rowCount, 1);
    assert.equal((await db.owner.query('SELECT 1 FROM identity.role_grant')).rowCount, 1);
    const audit = await db.owner.query<{
      kind: string;
      actor_person_id: string;
      target_person_id: string;
      safe_details: unknown;
    }>(
      "SELECT kind,actor_person_id,target_person_id,safe_details FROM identity.security_event WHERE kind IN ('ACCOUNT_CREATED','GRANT_CHANGED') ORDER BY kind",
    );
    assert.deepEqual(audit.rows, [
      {
        kind: 'ACCOUNT_CREATED',
        actor_person_id: personId,
        target_person_id: personId,
        safe_details: {},
      },
      {
        kind: 'GRANT_CHANGED',
        actor_person_id: personId,
        target_person_id: personId,
        safe_details: {
          actorRole: 'ACT-SEC',
          authorityScopeId: installation,
          customerScope: '',
          enabled: true,
        },
      },
    ]);
  });
});

void test('initial steward provisioning audit failure rolls back both the account and its security grant', async () => {
  await withDatabase(async (db) => {
    await db.owner.query(
      "CREATE FUNCTION identity.fail_test_provision_audit() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'synthetic provisioning audit failure'; END$$",
    );
    await db.owner.query(
      'CREATE TRIGGER fail_test_provision_audit BEFORE INSERT ON identity.security_event FOR EACH ROW EXECUTE FUNCTION identity.fail_test_provision_audit()',
    );
    try {
      const refused = await provision(randomUUID());
      assert.equal(refused.code, 1);
      assert.equal((await db.owner.query('SELECT 1 FROM identity.account')).rowCount, 0);
      assert.equal((await db.owner.query('SELECT 1 FROM identity.role_grant')).rowCount, 0);
      assert.equal((await db.owner.query('SELECT 1 FROM identity.security_event')).rowCount, 0);
      assert.ok(!JSON.stringify(refused).includes(password));
    } finally {
      await db.owner.query('DROP TRIGGER fail_test_provision_audit ON identity.security_event');
      await db.owner.query('DROP FUNCTION identity.fail_test_provision_audit()');
    }
  });
});

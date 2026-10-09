import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import {
  CommandRegistry,
  executeCommand,
  TechnicalError,
  type CommandRequest,
  type ExecutionContext,
  type ExecutionPorts,
  type ExecutionResult,
  type TransactionContext,
  type TransactionPort,
} from '@navard/shared-kernel';
import {
  InventoryPostingService,
  Kg,
  type PostingContext,
  type PostingEffect,
  type PostingPolicy,
} from '../../src/modules/inventory/index.js';
import { PostgresInventoryStore } from '../../src/infrastructure/postgresql/inventory-store.js';
import {
  transactionClient,
  PostgresTransactions,
} from '../../src/infrastructure/postgresql/transaction.js';
import {
  IdentityAuthorization,
  IdentityService,
  hashPassword,
} from '../../src/modules/identity/index.js';
import { PostgresIdentityStore } from '../../src/infrastructure/postgresql/identity-store.js';
import { context, request } from '../support/synthetic-command.js';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import { lostCommitProxy } from '../support/crash-child.js';

// These are synthetic orchestration handlers, never production business registrations.
const commands = [
  'PostGoodsReceipt',
  'CompleteProductionOperation',
  'ActivateReservation',
  'ReleaseReservation',
  'DispatchShipment',
  'IssueAllocatedMaterial',
] as const;
const installation = '11111111-1111-4111-8111-111111111111';
const scope = '22222222-2222-4222-8222-222222222222';
const caller = () => context({ actorRole: 'ACT-WH' });
const policy: PostingPolicy = {
  authorize: () => Promise.resolve(true),
  validate: () => Promise.resolve(undefined),
  reservationPriority: () => Promise.resolve(true),
  maintain: () => Promise.resolve(true),
};

function incoming(
  unitId: string = randomUUID(),
  kg = '10',
  factId: string = randomUUID(),
): Extract<PostingEffect, { type: 'STOCK_IN' }> {
  return {
    type: 'STOCK_IN',
    source: { factId, effectId: randomUUID() },
    unitId,
    kg,
    create: { lotId: randomUUID(), kind: 'COIL', locationId: randomUUID(), customerScope: '' },
  };
}

function outgoing(unitId: string, kg: string): Extract<PostingEffect, { type: 'STOCK_OUT' }> {
  return {
    type: 'STOCK_OUT',
    source: { factId: randomUUID(), effectId: randomUUID() },
    unitId,
    kg,
    nextState: 'PARTIALLY_CONSUMED',
  };
}

function additional(unitId: string, kg: string): Extract<PostingEffect, { type: 'STOCK_IN' }> {
  return { type: 'STOCK_IN', source: { factId: randomUUID(), effectId: randomUUID() }, unitId, kg };
}

function reserve(unitId: string, kg = '2'): Extract<PostingEffect, { type: 'RESERVE' }> {
  return {
    type: 'RESERVE',
    source: { factId: randomUUID(), effectId: randomUUID() },
    unitId,
    kg,
    reservationId: randomUUID(),
    demandId: randomUUID(),
  };
}

function command(
  effects: readonly PostingEffect[],
  name: string = 'PostGoodsReceipt',
): CommandRequest {
  return request({
    command: name,
    target: { kind: 'inventory-fixture', id: effects[0]?.source.factId ?? randomUUID() },
    payload: { effects: JSON.stringify(effects) },
    preconditions: {},
  });
}

function completed(result: ExecutionResult, outcome: 'accepted' | 'rejected', family?: string) {
  assert.equal(result.status, 'completed', JSON.stringify(result));
  if (result.status !== 'completed') throw new Error('Expected completed envelope outcome');
  assert.equal(result.result.outcome, outcome, JSON.stringify(result));
  if (family !== undefined) assert.equal(result.result.family, family);
  return result;
}

function postingHarness(
  db: DatabaseFixture,
  options: {
    policy?: PostingPolicy;
    authorization?: ExecutionPorts['authorization'];
    transactions?: TransactionPort;
  } = {},
) {
  const service = new InventoryPostingService(
    new PostgresInventoryStore(),
    options.policy ?? policy,
  );
  const ports: ExecutionPorts = {
    registry: new CommandRegistry(
      commands.map((name) => ({
        command: name,
        version: 1,
        active: true,
        payloadShape: { effects: { type: 'scalar' as const } },
        preconditionsShape: {},
        async execute(input, actor, transaction) {
          if (typeof input.payload.effects !== 'string') throw new Error('Invalid fixture effects');
          const effects = JSON.parse(input.payload.effects) as PostingEffect[];
          await transactionClient(transaction).query(
            'INSERT INTO envelope_test.fact(identity,material) VALUES($1,$2) ON CONFLICT DO NOTHING',
            [input.target.id, 'synthetic inventory orchestration'],
          );
          const rows = await service.post({ actor, request: input, transaction }, effects);
          return {
            outcome: 'accepted' as const,
            factIdentity: input.target.id,
            event: 'FixtureInventoryPosted',
            data: { ledgerIds: rows.map((row) => row.id) },
          };
        },
      })),
    ),
    transactions: options.transactions ?? db.transactions,
    outcomes: db.outcomes,
    audits: db.audit,
    authorization: options.authorization ?? {
      canExecute: () => Promise.resolve(true),
      canReplay: () => Promise.resolve(true),
    },
    recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
  };
  return {
    service,
    run: (input: CommandRequest, actor: ExecutionContext = caller()) =>
      executeCommand(JSON.stringify(input), actor, ports),
  };
}

async function inTransaction<T>(
  db: DatabaseFixture,
  body: (context: PostingContext) => Promise<T>,
  actor: ExecutionContext = caller(),
): Promise<T> {
  const session = await db.transactions.begin();
  try {
    const value = await body({ actor, request: command([]), transaction: session.context });
    await session.commit();
    return value;
  } catch (error) {
    await session.rollback();
    throw error;
  } finally {
    await session.release();
  }
}

async function quantities(db: DatabaseFixture, service: InventoryPostingService, unitId: string) {
  return inTransaction(db, (context) => service.snapshot(context, unitId));
}

void test('exact kg posting persists tiny fractions without floating-point loss', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const first = incoming(randomUUID(), '0.100000000000000001');
    completed(await h.run(command([first])), 'accepted');
    const addition = additional(first.unitId, '0.2');
    completed(await h.run(command([addition])), 'accepted');
    assert.deepEqual(await quantities(db, h.service, first.unitId), {
      onHand: '0.300000000000000001',
      reserved: '0',
    });
    assert.equal(
      Kg.parse('99999999999999999999.999999999999999999').toString(),
      '99999999999999999999.999999999999999999',
    );
  });
});

void test('invalid, nonpositive and over-scale stock quantities reject durably without owner facts', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    for (const kg of ['0', '-1', '0.0000000000000000001', '100000000000000000000', '1\n']) {
      completed(await h.run(command([incoming(randomUUID(), kg)])), 'rejected', 'GUARD_INVARIANT');
    }
    assert.equal((await db.counts()).facts, 0);
  });
});

void test('accepted replay has one posting and conflicting reuse cannot alter stock', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    const input = command([effect]);
    const first = completed(await h.run(input), 'accepted');
    const replay = completed(await h.run(input), 'accepted');
    assert.equal(replay.replayed, true);
    assert.equal(replay.executionId, first.executionId);
    assert.deepEqual(replay.result, first.result);
    const changed = { ...input, payload: { effects: JSON.stringify([{ ...effect, kg: '11' }]) } };
    assert.equal((await h.run(changed)).status, 'conflict');
    assert.equal((await quantities(db, h.service, effect.unitId)).onHand, '10');
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 3 });
  });
});

void test('business effect duplicates under different keys distinguish identical intent from changed reuse', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    completed(await h.run(command([effect])), 'accepted');
    completed(await h.run(command([effect])), 'rejected', 'GUARD_IDEMPOTENT_DUP');
    completed(await h.run(command([{ ...effect, kg: '9' }])), 'rejected', 'GUARD_CONFLICT');
    completed(
      await h.run(command([{ ...effect, unitId: randomUUID() }])),
      'rejected',
      'GUARD_CONFLICT',
    );
    assert.equal((await quantities(db, h.service, effect.unitId)).onHand, '10');
  });
});

void test('competing partial reservations allow only one active claim for a stock unit', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    completed(await h.run(command([effect])), 'accepted');
    const claims = [reserve(effect.unitId, '2'), reserve(effect.unitId, '3')];
    const results = await Promise.all(
      claims.map((claim) => h.run(command([claim], 'ActivateReservation'))),
    );
    assert.equal(
      results.filter(
        (result) => result.status === 'completed' && result.result.outcome === 'accepted',
      ).length,
      1,
    );
    assert.equal(
      results.filter(
        (result) => result.status === 'completed' && result.result.outcome === 'rejected',
      ).length,
      1,
    );
    const total = await quantities(db, h.service, effect.unitId);
    assert.equal(total.onHand, '10');
    assert.ok(total.reserved === '2' || total.reserved === '3');
    const leftover = completed(
      await h.run(command([reserve(effect.unitId, '1')], 'ActivateReservation')),
      'rejected',
    );
    assert.notEqual(leftover.result.outcome, 'accepted');
    assert.deepEqual(await quantities(db, h.service, effect.unitId), total);
  });
});

void test('concurrent reuse of a reservation identity across distinct units returns a durable conflict', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const first = incoming(),
      second = incoming();
    completed(await h.run(command([first, second])), 'accepted');
    const reservationId = randomUUID();
    const requests = [first, second].map((unit) =>
      command([{ ...reserve(unit.unitId), reservationId }], 'ActivateReservation'),
    );
    const results = await Promise.all(requests.map((input) => h.run(input)));
    assert.equal(
      results.filter(
        (result) => result.status === 'completed' && result.result.outcome === 'accepted',
      ).length,
      1,
    );
    const conflictIndex = results.findIndex(
      (result) => result.status === 'completed' && result.result.outcome === 'rejected',
    );
    assert.ok(conflictIndex >= 0);
    completed(results[conflictIndex]!, 'rejected', 'GUARD_CONFLICT');
    assert.equal(
      completed(await h.run(requests[conflictIndex]!), 'rejected', 'GUARD_CONFLICT').replayed,
      true,
    );
    const totals = await Promise.all([
      quantities(db, h.service, first.unitId),
      quantities(db, h.service, second.unitId),
    ]);
    assert.equal(totals.filter((total) => total.reserved === '2').length, 1);
    assert.equal(totals.filter((total) => total.reserved === '0').length, 1);
  });
});

void test('unknown reservation-priority policy fails closed without changing stock', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    completed(await h.run(command([effect])), 'accepted');
    const guarded = postingHarness(db, {
      policy: { ...policy, reservationPriority: () => Promise.resolve(false) },
    });
    const result = completed(
      await guarded.run(command([reserve(effect.unitId)], 'ActivateReservation')),
      'rejected',
      'GUARD_OPEN_POLICY',
    );
    assert.equal(result.result.open_item, 'OQ-008');
    assert.deepEqual(await quantities(db, h.service, effect.unitId), {
      onHand: '10',
      reserved: '0',
    });
  });
});

void test('release changes only reserved quantity; terminal claims cannot be consumed again', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    completed(await h.run(command([effect])), 'accepted');
    const reservation = reserve(effect.unitId, '4');
    if (reservation.type !== 'RESERVE') throw new Error('Expected reservation fixture');
    completed(await h.run(command([reservation], 'ActivateReservation')), 'accepted');
    const release: PostingEffect = {
      type: 'RELEASE',
      source: { factId: randomUUID(), effectId: randomUUID() },
      unitId: effect.unitId,
      reservationId: reservation.reservationId,
      terminal: 'RELEASED',
    };
    const input = command([release], 'ReleaseReservation');
    completed(await h.run(input), 'accepted');
    assert.equal(completed(await h.run(input), 'accepted').replayed, true);
    assert.deepEqual(await quantities(db, h.service, effect.unitId), {
      onHand: '10',
      reserved: '0',
    });
    completed(
      await h.run(
        command(
          [{ ...release, source: { factId: randomUUID(), effectId: randomUUID() } }],
          'ReleaseReservation',
        ),
      ),
      'rejected',
    );
    assert.deepEqual(await quantities(db, h.service, effect.unitId), {
      onHand: '10',
      reserved: '0',
    });
  });
});

void test('a rejected later posting leg rolls back earlier unit, fact and reservation changes atomically', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const first = incoming();
    const impossible = additional(randomUUID(), '1');
    const input = command([first, impossible]);
    const rejection = completed(await h.run(input), 'rejected', 'GUARD_STATE');
    assert.equal(completed(await h.run(input), 'rejected').executionId, rejection.executionId);
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 1, audits: 2 });
    await inTransaction(db, async (context) => {
      assert.equal(await new PostgresInventoryStore().unit(context, first.unitId), undefined);
      assert.equal(await new PostgresInventoryStore().findEffect(context, first.source), undefined);
    });
  });
});

void test('audit persistence failure rolls back inventory and owner fact, permitting the same-key retry', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    const input = command([effect]);
    await db.owner.query(
      "CREATE FUNCTION envelope_test.reject_inventory_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit failure'; END $$",
    );
    await db.owner.query(
      'CREATE TRIGGER reject_inventory_audit BEFORE INSERT ON kernel.audit_event FOR EACH ROW EXECUTE FUNCTION envelope_test.reject_inventory_audit()',
    );
    try {
      assert.equal((await h.run(input)).status, 'technical');
      assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
      await inTransaction(db, async (context) =>
        assert.equal(await new PostgresInventoryStore().unit(context, effect.unitId), undefined),
      );
    } finally {
      await db.owner.query('DROP TRIGGER reject_inventory_audit ON kernel.audit_event');
      await db.owner.query('DROP FUNCTION envelope_test.reject_inventory_audit()');
    }
    completed(await h.run(input), 'accepted');
    assert.deepEqual(await quantities(db, h.service, effect.unitId), {
      onHand: '10',
      reserved: '0',
    });
  });
});

void test('transaction capability rejects forged and released contexts before any inventory write', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    const session = await db.transactions.begin();
    const issued = session.context;
    await session.rollback();
    await session.release();
    for (const transaction of [issued, { id: randomUUID() } as TransactionContext]) {
      await assert.rejects(
        h.service.post({ actor: caller(), request: command([effect]), transaction }, [effect]),
        TechnicalError,
      );
    }
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
  });
});

let credential: Promise<string> | undefined;
async function authenticatedOperators(db: DatabaseFixture) {
  credential ??= hashPassword('synthetic inventory operator password');
  for (const username of ['fixture.warehouse.a', 'fixture.warehouse.b']) {
    const accountId = randomUUID();
    await db.owner.query(
      'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) VALUES($1,$2,$3,$4,$5)',
      [installation, accountId, randomUUID(), username, await credential],
    );
    await db.owner.query(
      "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role) VALUES($1,$2,$3,'ACT-WH')",
      [installation, accountId, scope],
    );
  }
  const service = new IdentityService(
    new PostgresIdentityStore(db.runtime),
    db.transactions,
    installation,
    scope,
  );
  const first = await service.login('fixture.warehouse.a', 'synthetic inventory operator password');
  const second = await service.login(
    'fixture.warehouse.b',
    'synthetic inventory operator password',
  );
  return { service, first: first.token, second: second.token };
}

void test('real identity integration rejects forged callers, foreign targets, cross-principal key reuse and revoked replay', async () => {
  await withDatabase(async (db) => {
    const identity = await authenticatedOperators(db);
    const effect = incoming();
    const input = command([effect]);
    const authorization = new IdentityAuthorization(
      identity.service,
      commands.map((name) => ({
        command: name,
        version: 1,
        roles: ['ACT-WH' as const],
        canTarget: (_actor: ExecutionContext, request: CommandRequest) =>
          Promise.resolve(request.target.id === input.target.id),
        canDisclose: () => Promise.resolve(true),
      })),
    );
    const h = postingHarness(db, {
      authorization,
      policy: {
        ...policy,
        authorize: (context) => identity.service.isCurrent(context.actor, context.transaction),
      },
    });
    const actor = await identity.service.context(identity.first, 'ACT-WH');
    assert.equal(
      (await h.run(input, { ...actor, principal: { ...actor.principal } })).status,
      'admission-denied',
    );
    const foreignTarget = {
      ...input,
      idempotency_key: randomUUID(),
      target: { kind: 'inventory-fixture', id: randomUUID() },
    };
    assert.equal((await h.run(foreignTarget, actor)).status, 'admission-denied');
    completed(await h.run(input, actor), 'accepted');
    assert.equal(
      (await h.run(input, await identity.service.context(identity.second, 'ACT-WH'))).status,
      'conflict',
    );
    const alteredScope = Object.freeze({ ...actor, authorityScopeId: randomUUID() });
    assert.equal((await h.run(input, alteredScope)).status, 'admission-denied');
    await identity.service.logout(identity.first);
    assert.equal((await h.run(input, actor)).status, 'admission-denied');
    const remainingActor = await identity.service.context(identity.second, 'ACT-WH');
    assert.deepEqual(
      await inTransaction(
        db,
        (context) => h.service.snapshot(context, effect.unitId),
        remainingActor,
      ),
      {
        onHand: '10',
        reserved: '0',
      },
    );
  });
});

void test('concurrent consumption cannot overdraw a unit and rejected depletion is durably replayable', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    completed(await h.run(command([effect])), 'accepted');
    // Synthetic future-owner state fixture, not an implemented production workflow.
    await db.owner.query(
      "UPDATE inventory.unit SET state='ISSUED_TO_PRODUCTION' WHERE installation_id=$1 AND authority_scope=$2 AND unit_id=$3",
      [installation, scope, effect.unitId],
    );
    const inputs = [
      command([outgoing(effect.unitId, '7')], 'CompleteProductionOperation'),
      command([outgoing(effect.unitId, '7')], 'CompleteProductionOperation'),
    ];
    const results = await Promise.all(inputs.map((input) => h.run(input)));
    assert.equal(
      results.filter(
        (result) => result.status === 'completed' && result.result.outcome === 'accepted',
      ).length,
      1,
    );
    const rejectedIndex = results.findIndex(
      (result) => result.status === 'completed' && result.result.outcome === 'rejected',
    );
    assert.ok(rejectedIndex >= 0);
    completed(results[rejectedIndex]!, 'rejected', 'GUARD_INVARIANT');
    assert.equal(
      completed(await h.run(inputs[rejectedIndex]!), 'rejected', 'GUARD_INVARIANT').replayed,
      true,
    );
    assert.deepEqual(await quantities(db, h.service, effect.unitId), {
      onHand: '3',
      reserved: '0',
    });
  });
});

void test('multiunit reverse input order uses stable locks and persists exactly both accepted batches', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const first = incoming(),
      second = incoming();
    completed(await h.run(command([first, second])), 'accepted');
    const addition = (unitId: string) => {
      const effect = additional(unitId, '1');
      return effect;
    };
    const inputs = [
      command([addition(first.unitId), addition(second.unitId)]),
      command([addition(second.unitId), addition(first.unitId)]),
    ];
    for (const result of await Promise.all(inputs.map((input) => h.run(input))))
      completed(result, 'accepted');
    assert.equal((await quantities(db, h.service, first.unitId)).onHand, '12');
    assert.equal((await quantities(db, h.service, second.unitId)).onHand, '12');
  });
});

void test('Ledger stays immutable while missing and drifted Balance can be reconstructed without new history', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    completed(await h.run(command([effect])), 'accepted');
    const before = await db.owner.query('SELECT * FROM inventory.ledger ORDER BY ledger_id');
    await assert.rejects(
      db.runtime.query('UPDATE inventory.ledger SET on_hand_delta=1'),
      (error: unknown) =>
        typeof error === 'object' && error !== null && 'code' in error && error.code === '42501',
    );
    await assert.rejects(
      db.runtime.query('DELETE FROM inventory.ledger'),
      (error: unknown) =>
        typeof error === 'object' && error !== null && 'code' in error && error.code === '42501',
    );
    await assert.rejects(
      db.runtime.query('ALTER TABLE inventory.ledger ADD COLUMN compromised boolean'),
      (error: unknown) =>
        typeof error === 'object' && error !== null && 'code' in error && error.code === '42501',
    );
    await db.owner.query('UPDATE inventory.balance SET on_hand=5');
    await assert.rejects(
      quantities(db, h.service, effect.unitId),
      (error: unknown) => error instanceof TechnicalError && error.kind === 'incompatible',
    );
    assert.deepEqual(
      await inTransaction(db, (context) => h.service.rebuild(context, [effect.unitId])),
      [{ onHand: '10', reserved: '0' }],
    );
    await db.owner.query('DELETE FROM inventory.balance');
    await assert.rejects(quantities(db, h.service, effect.unitId), TechnicalError);
    assert.deepEqual(
      await inTransaction(db, (context) => h.service.rebuild(context, [effect.unitId])),
      [{ onHand: '10', reserved: '0' }],
    );
    assert.deepEqual(
      (await db.owner.query('SELECT * FROM inventory.ledger ORDER BY ledger_id')).rows,
      before.rows,
    );
    assert.equal((await db.counts()).outcomes, 1);
  });
});

void test('stock-out requires owning workflow state and customer-scoped callers cannot cross unit ownership', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = {
      ...incoming(),
      create: { ...incoming().create!, customerScope: 'factory-customer-a' },
    };
    completed(await h.run(command([effect])), 'accepted');
    completed(
      await h.run(command([outgoing(effect.unitId, '1')], 'CompleteProductionOperation')),
      'rejected',
      'GUARD_STATE',
    );
    completed(
      await h.run(command([outgoing(effect.unitId, '1')], 'PostGoodsReceipt')),
      'rejected',
      'GUARD_INVARIANT',
    );
    completed(
      await h.run(
        command([reserve(effect.unitId)], 'ActivateReservation'),
        callerWithCustomer('factory-customer-b'),
      ),
      'rejected',
      'GUARD_ACTOR',
    );
    assert.deepEqual(await quantities(db, h.service, effect.unitId), {
      onHand: '10',
      reserved: '0',
    });
  });
});

function callerWithCustomer(customerScope: string): ExecutionContext {
  return context({ actorRole: 'ACT-WH', customerScope });
}

void test('confirmed COMMIT with a lost response recovers the same inventory intent without another movement', async () => {
  await withDatabase(async (db) => {
    const proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL ?? '');
    const pool = new Pool({ connectionString: proxy.url });
    pool.on('error', () => undefined);
    try {
      const effect = incoming();
      const input = command([effect]);
      const h = postingHarness(db);
      const uncertain = await postingHarness(db, {
        transactions: new PostgresTransactions(pool),
      }).run(input);
      assert.equal(uncertain.status, 'technical');
      if (uncertain.status === 'technical') assert.equal(uncertain.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      assert.equal(completed(await h.run(input), 'accepted').replayed, true);
      assert.deepEqual(await quantities(db, h.service, effect.unitId), {
        onHand: '10',
        reserved: '0',
      });
      assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 2 });
      assert.equal(
        (
          await db.owner.query<{ total: number }>(
            'SELECT count(*)::int AS total FROM inventory.ledger',
          )
        ).rows[0]?.total,
        1,
      );
    } finally {
      await pool.end();
      await proxy.close();
    }
  });
});

void test('actual Windows process crash before commit leaves no partial inventory, while after commit retry replays', async () => {
  for (const stage of ['after-inventory', 'before-commit', 'after-commit']) {
    await withDatabase(async (db) => {
      const effect = incoming();
      const input = command([effect]);
      const child = fork(
        fileURLToPath(new URL('../support/inventory-crash.js', import.meta.url)),
        ['--inventory-crash', stage, Buffer.from(JSON.stringify(input)).toString('base64')],
        { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] },
      );
      const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
      try {
        const reached = await new Promise<unknown>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error(`Inventory child did not reach ${stage}`)),
            8_000,
          );
          child.once('message', (message) => {
            clearTimeout(timer);
            resolve(message);
          });
          child.once('error', (error) => {
            clearTimeout(timer);
            reject(error);
          });
        });
        assert.deepEqual(reached, { stage });
      } finally {
        child.kill('SIGKILL');
        await exited;
      }
      assert.deepEqual(
        await db.counts(),
        stage === 'after-commit'
          ? { facts: 1, outcomes: 1, audits: 1 }
          : { facts: 0, outcomes: 0, audits: 0 },
      );
      const history = await db.owner.query<{ total: number }>(
        'SELECT count(*)::int AS total FROM inventory.ledger',
      );
      assert.equal(history.rows[0]?.total, stage === 'after-commit' ? 1 : 0);
      const h = postingHarness(db);
      assert.equal(completed(await h.run(input), 'accepted').replayed, stage === 'after-commit');
      assert.deepEqual(await quantities(db, h.service, effect.unitId), {
        onHand: '10',
        reserved: '0',
      });
      assert.equal(
        (
          await db.owner.query<{ total: number }>(
            'SELECT count(*)::int AS total FROM inventory.ledger',
          )
        ).rows[0]?.total,
        1,
      );
    });
  }
});

void test('PostgreSQL refuses over-scale/range values and cross-unit movement references without silently rounding', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const first = incoming(),
      second = incoming();
    completed(await h.run(command([first, second])), 'accepted');
    const sqlCode = (code: string) => (error: unknown) =>
      typeof error === 'object' && error !== null && 'code' in error && error.code === code;
    for (const value of [
      '0.0000000000000000001',
      '100000000000000000000',
      '-1',
      'NaN',
      'Infinity',
      '-Infinity',
    ]) {
      await assert.rejects(
        db.owner.query('UPDATE inventory.balance SET on_hand=$1 WHERE unit_id=$2', [
          value,
          first.unitId,
        ]),
        sqlCode('23514'),
      );
    }
    const appendCopy =
      'INSERT INTO inventory.ledger(installation_id,authority_scope,ledger_id,unit_id,source_fact_id,effect_id,binding,on_hand_delta,reserved_delta,original_ledger_id,executor,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key) SELECT installation_id,authority_scope,$1,unit_id,source_fact_id,$2,binding,$3,0,$4,$5,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key FROM inventory.ledger WHERE unit_id=$6 LIMIT 1';
    for (const value of [
      '0.0000000000000000001',
      '100000000000000000000',
      'NaN',
      'Infinity',
      '-Infinity',
    ]) {
      await assert.rejects(
        db.owner.query(appendCopy, [
          randomUUID(),
          randomUUID(),
          value,
          null,
          'ACT-IPS',
          first.unitId,
        ]),
        sqlCode('23514'),
      );
    }
    await assert.rejects(
      db.owner.query(appendCopy, [randomUUID(), randomUUID(), '1', null, 'ACT-WH', first.unitId]),
      sqlCode('23514'),
    );
    const other = await db.owner.query<{ ledger_id: string }>(
      'SELECT ledger_id FROM inventory.ledger WHERE unit_id=$1',
      [second.unitId],
    );
    await assert.rejects(
      db.owner.query(appendCopy, [
        randomUUID(),
        randomUUID(),
        '-1',
        other.rows[0]!.ledger_id,
        'ACT-IPS',
        first.unitId,
      ]),
      sqlCode('23503'),
    );
    assert.deepEqual(await quantities(db, h.service, first.unitId), {
      onHand: '10',
      reserved: '0',
    });
    assert.equal(
      (
        await db.owner.query<{ total: number }>(
          'SELECT count(*)::int AS total FROM inventory.ledger',
        )
      ).rows[0]?.total,
      2,
    );
  });
});

void test('fresh-key production source duplicates conflict while original accepted and rejected outcomes replay', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    completed(await h.run(command([effect])), 'accepted');
    // Owning production workflow is not implemented; fixture supplies its issued precondition.
    await db.owner.query(
      "UPDATE inventory.unit SET state='ISSUED_TO_PRODUCTION' WHERE unit_id=$1",
      [effect.unitId],
    );
    const originalMovement = (
      await db.owner.query<{ ledger_id: string }>(
        'SELECT ledger_id FROM inventory.ledger WHERE unit_id=$1',
        [effect.unitId],
      )
    ).rows[0]!.ledger_id;
    const consumption: PostingEffect = {
      ...outgoing(effect.unitId, '3'),
      type: 'STOCK_OUT',
      kg: '3',
      nextState: 'PARTIALLY_CONSUMED',
      originalLedgerId: originalMovement,
    };
    const original = command([consumption], 'CompleteProductionOperation');
    const acceptance = completed(await h.run(original), 'accepted');
    assert.equal(completed(await h.run(original), 'accepted').executionId, acceptance.executionId);
    const duplicate = command([consumption], 'CompleteProductionOperation');
    const rejection = completed(await h.run(duplicate), 'rejected', 'GUARD_CONFLICT');
    const replay = completed(await h.run(duplicate), 'rejected', 'GUARD_CONFLICT');
    assert.equal(replay.executionId, rejection.executionId);
    assert.equal(replay.replayed, true);
    assert.deepEqual(await quantities(db, h.service, effect.unitId), {
      onHand: '7',
      reserved: '0',
    });
    assert.equal(
      (
        await db.owner.query<{ original_ledger_id: string }>(
          'SELECT original_ledger_id FROM inventory.ledger WHERE effect_id=$1',
          [consumption.source.effectId],
        )
      ).rows[0]?.original_ledger_id,
      originalMovement,
    );
    assert.equal(
      (
        await db.owner.query<{ total: number }>(
          'SELECT count(*)::int AS total FROM inventory.ledger',
        )
      ).rows[0]?.total,
      2,
    );
  });
});

void test('over-reservation rejects durably and Ledger records caller provenance with canonical audit families', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    const input = command([effect]);
    const actor = caller();
    const accepted = completed(await h.run(input, actor), 'accepted');
    const provenance = await db.owner.query<{
      executor: string;
      issuer: string;
      subject: string;
      actor_role: string;
      request_id: string;
      command_id: string;
      command_version: number;
      idempotency_key: string;
      source_fact_id: string;
      effect_id: string;
    }>(
      'SELECT executor,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key,source_fact_id,effect_id FROM inventory.ledger',
    );
    assert.deepEqual(provenance.rows[0], {
      executor: 'ACT-IPS',
      issuer: actor.principal.issuer,
      subject: actor.principal.subject,
      actor_role: actor.actorRole,
      request_id: actor.requestId,
      command_id: input.command,
      command_version: input.contract_version,
      idempotency_key: input.idempotency_key,
      source_fact_id: effect.source.factId,
      effect_id: effect.source.effectId,
    });
    const over = command([reserve(effect.unitId, '11')], 'ActivateReservation');
    const rejection = completed(await h.run(over), 'rejected', 'GUARD_INVARIANT');
    const replay = completed(await h.run(over), 'rejected', 'GUARD_INVARIANT');
    assert.equal(replay.replayed, true);
    assert.equal(replay.executionId, rejection.executionId);
    assert.deepEqual(await quantities(db, h.service, effect.unitId), {
      onHand: '10',
      reserved: '0',
    });
    assert.equal(
      (
        await db.owner.query<{ total: number }>(
          'SELECT count(*)::int AS total FROM inventory.reservation',
        )
      ).rows[0]?.total,
      0,
    );
    const audit = await db.owner.query<{
      event_kind: string;
      execution_id: string;
      idempotency_key: string;
    }>('SELECT event_kind,execution_id,idempotency_key FROM kernel.audit_event');
    // Millisecond timestamps can tie; UUID order is not command chronology.
    assert.equal(audit.rowCount, 3);
    for (const [event_kind, execution_id, idempotency_key] of [
      ['AUD-CMD-ACCEPTED', accepted.executionId, input.idempotency_key],
      ['AUD-CMD-REJECTED', rejection.executionId, over.idempotency_key],
      ['AUD-CMD-REPLAYED', rejection.executionId, over.idempotency_key],
    ]) {
      assert.deepEqual(
        audit.rows.filter((row) => row.event_kind === event_kind),
        [{ event_kind, execution_id, idempotency_key }],
      );
    }
  });
});

void test('later-leg rejection rolls back a newly active claim and its Ledger/projection/lifecycle changes', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const effect = incoming();
    completed(await h.run(command([effect])), 'accepted');
    const claim = reserve(effect.unitId, '3');
    if (claim.type !== 'RESERVE') throw new Error('Expected claim');
    const failure = additional(randomUUID(), '1');
    const input = command([claim, failure], 'ActivateReservation');
    completed(await h.run(input), 'rejected', 'GUARD_STATE');
    assert.deepEqual(await quantities(db, h.service, effect.unitId), {
      onHand: '10',
      reserved: '0',
    });
    assert.equal(
      (
        await db.owner.query<{ total: number }>(
          'SELECT count(*)::int AS total FROM inventory.reservation',
        )
      ).rows[0]?.total,
      0,
    );
    assert.equal(
      (
        await db.owner.query<{ total: number }>(
          'SELECT count(*)::int AS total FROM inventory.ledger',
        )
      ).rows[0]?.total,
      1,
    );
    assert.equal(
      (
        await db.owner.query<{ state: string }>(
          'SELECT state FROM inventory.unit WHERE unit_id=$1',
          [effect.unitId],
        )
      ).rows[0]?.state,
      'AVAILABLE',
    );
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 2, audits: 2 });
  });
});

void test('terminal stock-out and claim consumption preserve distinct reserved and physical quantities', async () => {
  await withDatabase(async (db) => {
    const h = postingHarness(db);
    const production = incoming();
    completed(await h.run(command([production])), 'accepted');
    const claim = reserve(production.unitId, '4');
    if (claim.type !== 'RESERVE') throw new Error('Expected claim');
    completed(await h.run(command([claim], 'ActivateReservation')), 'accepted');
    await db.owner.query(
      "UPDATE inventory.unit SET state='ISSUED_TO_PRODUCTION' WHERE unit_id=$1",
      [production.unitId],
    );
    completed(
      await h.run(command([outgoing(production.unitId, '1')], 'CompleteProductionOperation')),
      'rejected',
      'GUARD_CONFLICT',
    );
    const consume: PostingEffect = {
      type: 'RELEASE',
      source: { factId: randomUUID(), effectId: randomUUID() },
      unitId: production.unitId,
      reservationId: claim.reservationId,
      terminal: 'CONSUMED',
    };
    completed(await h.run(command([consume], 'IssueAllocatedMaterial')), 'accepted');
    assert.deepEqual(await quantities(db, h.service, production.unitId), {
      onHand: '10',
      reserved: '0',
    });
    const full: PostingEffect = {
      ...outgoing(production.unitId, '10'),
      type: 'STOCK_OUT',
      kg: '10',
      nextState: 'CONSUMED',
    };
    completed(await h.run(command([full], 'CompleteProductionOperation')), 'accepted');
    assert.deepEqual(await quantities(db, h.service, production.unitId), {
      onHand: '0',
      reserved: '0',
    });
    assert.equal(
      (
        await db.owner.query<{ state: string }>(
          'SELECT state FROM inventory.unit WHERE unit_id=$1',
          [production.unitId],
        )
      ).rows[0]?.state,
      'CONSUMED',
    );

    const shipment = incoming();
    completed(await h.run(command([shipment])), 'accepted');
    const shipmentClaim = reserve(shipment.unitId, '10');
    if (shipmentClaim.type !== 'RESERVE') throw new Error('Expected claim');
    completed(await h.run(command([shipmentClaim], 'ActivateReservation')), 'accepted');
    await db.owner.query("UPDATE inventory.unit SET state='PACKED' WHERE unit_id=$1", [
      shipment.unitId,
    ]);
    const shipmentConsume: PostingEffect = {
      ...consume,
      source: { factId: randomUUID(), effectId: randomUUID() },
      unitId: shipment.unitId,
      reservationId: shipmentClaim.reservationId,
    };
    const shipped: PostingEffect = {
      type: 'STOCK_OUT',
      source: { factId: randomUUID(), effectId: randomUUID() },
      unitId: shipment.unitId,
      kg: '10',
      nextState: 'SHIPPED',
    };
    completed(await h.run(command([shipmentConsume, shipped], 'DispatchShipment')), 'accepted');
    assert.deepEqual(await quantities(db, h.service, shipment.unitId), {
      onHand: '0',
      reserved: '0',
    });
    assert.equal(
      (
        await db.owner.query<{ state: string }>(
          'SELECT state FROM inventory.unit WHERE unit_id=$1',
          [shipment.unitId],
        )
      ).rows[0]?.state,
      'SHIPPED',
    );
  });
});

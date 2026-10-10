import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { Pool } from 'pg';
import { AdmissionError, BusinessRejection, type TransactionPort } from '@navard/shared-kernel';
import {
  PostgresTransactions,
  transactionClient,
} from '../../src/infrastructure/postgresql/transaction.js';
import { PostgresPurchaseStore } from '../../src/infrastructure/postgresql/purchase-store.js';
import type {
  PurchaseContext,
  CompletedPurchaseInput,
  PurchaseProformaInput,
} from '../../src/modules/procurement/index.js';
import { withDatabase } from '../support/database-fixture.js';
import { lostCommitProxy } from '../support/crash-child.js';
import {
  purchasingPeople,
  purchaseHarness,
  purchaseCommand,
  proformaCommand,
  purchaseCounts,
  completed,
  readTransaction,
  guard,
  pgCode,
} from '../support/purchase-harness.js';

/** Bounded arrival rendezvous before the real document advisory lock, for separate people. */
function twoPartyGate() {
  let arrivals = 0;
  let markReady!: () => void, rejectReady!: (error: Error) => void, release!: () => void;
  const ready = new Promise<void>((resolve, reject) => {
    markReady = resolve;
    rejectReady = reject;
  });
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const timer = setTimeout(
    () => rejectReady(new Error(`Only ${arrivals} of 2 people reached the document lock`)),
    8000,
  );
  return {
    ready,
    get arrivals() {
      return arrivals;
    },
    async enter() {
      arrivals++;
      assert.ok(arrivals <= 2);
      if (arrivals === 2) markReady();
      await released;
    },
    release() {
      clearTimeout(timer);
      release();
    },
  };
}
async function atOwnerLock<T>(
  gate: ReturnType<typeof twoPartyGate>,
  first: () => Promise<T>,
  second: () => Promise<T>,
) {
  const running = [first(), second()];
  const results = Promise.all(running);
  void results.catch(() => undefined);
  try {
    await gate.ready;
    assert.equal(gate.arrivals, 2);
    gate.release();
    return await results;
  } finally {
    gate.release();
    await Promise.allSettled(running);
  }
}

void test('completed purchase and later optional sent-proforma retain descriptive facts and personal attribution without foreign writes', async () => {
  await withDatabase(async (db) => {
    const people = await purchasingPeople(db),
      actor = await people.actor(),
      h = purchaseHarness(db, people.identity),
      input = purchaseCommand();
    const accepted = completed(await h.run(input, actor), 'accepted');
    assert.equal(accepted.result.event, 'CompletedPurchaseRecorded');
    const purchase = await readTransaction(db, actor, input, (ctx) =>
      h.service.get(ctx, 'GetCompletedPurchase', input.target.id),
    );
    assert.ok(purchase);
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(purchase).filter(
          ([key]) => !['id', 'issuer', 'subject', 'recordedAt'].includes(key),
        ),
      ),
      input.payload,
    );
    assert.equal(purchase.subject, actor.principal.subject);
    assert.equal(purchase.issuer, actor.principal.issuer);
    assert.ok(Number.isFinite(Date.parse(purchase.recordedAt)));
    assert.equal('binding' in purchase, false);
    assert.deepEqual(await purchaseCounts(db), {
      purchases: 1,
      proformas: 0,
      outcomes: 1,
      audits: 1,
      foreignWrites: 0,
    });
    // No approved ordering rule: an already-sent document can predate the purchase record's date.
    const sent = proformaCommand(input.target.id, {
      payload: {
        purchaseId: input.target.id,
        proformaReference: 'Previously sent factory document',
        sentDate: '2026-10-01',
      },
    });
    assert.equal(
      completed(await h.run(sent, actor), 'accepted').result.event,
      'PurchaseProformaSentRecorded',
    );
    const proforma = await readTransaction(db, actor, sent, (ctx) =>
      h.service.get(ctx, 'GetPurchaseProforma', sent.target.id),
    );
    assert.ok(proforma && 'purchaseId' in proforma);
    assert.equal(proforma.purchaseId, purchase.id);
    assert.equal(proforma.sentDate, '2026-10-01');
    assert.equal(proforma.subject, actor.principal.subject);
    assert.equal('binding' in proforma, false);
    assert.deepEqual(
      await readTransaction(db, actor, input, (ctx) =>
        h.service.get(ctx, 'GetCompletedPurchase', input.target.id),
      ),
      purchase,
    );
    const attribution = await db.owner.query<{
      actor_role: string;
      request_id: string;
      idempotency_key: string;
    }>('SELECT actor_role,request_id,idempotency_key FROM procurement.completed_purchase');
    assert.deepEqual(attribution.rows, [
      {
        actor_role: 'ACT-PROC',
        request_id: actor.requestId,
        idempotency_key: input.idempotency_key,
      },
    ]);
    assert.deepEqual(await purchaseCounts(db), {
      purchases: 1,
      proformas: 1,
      outcomes: 2,
      audits: 2,
      foreignWrites: 0,
    });
  });
});

void test('matching documentary references do not invent supplier-master or unique document-number policy', async () => {
  await withDatabase(async (db) => {
    const people = await purchasingPeople(db),
      actor = await people.actor(),
      h = purchaseHarness(db, people.identity),
      first = purchaseCommand();
    const second = purchaseCommand({ payload: first.payload });
    completed(await h.run(first, actor), 'accepted');
    completed(await h.run(second, actor), 'accepted');
    const sent = proformaCommand(first.target.id);
    completed(await h.run(sent, actor), 'accepted');
    completed(
      await h.run(proformaCommand(first.target.id, { payload: sent.payload }), actor),
      'accepted',
    );
    assert.deepEqual(await purchaseCounts(db), {
      purchases: 2,
      proformas: 2,
      outcomes: 4,
      audits: 4,
      foreignWrites: 0,
    });
  });
});

for (const kind of ['purchase', 'proforma'] as const) {
  void test(`${kind}: accepted and rejected replay, occupied-key payload/principal conflicts, and new-key DUP/CONFLICT are durable`, async () => {
    await withDatabase(async (db) => {
      const people = await purchasingPeople(db),
        actor = await people.actor(),
        second = await people.secondActor(),
        h = purchaseHarness(db, people.identity),
        parent = purchaseCommand();
      if (kind === 'proforma') completed(await h.run(parent, actor), 'accepted');
      const input = kind === 'purchase' ? parent : proformaCommand(parent.target.id);
      const field = kind === 'purchase' ? 'supplierReference' : 'proformaReference';
      const changed = { ...input, payload: { ...input.payload, [field]: 'Different evidence' } };
      const first = completed(await h.run(input, actor), 'accepted'),
        replay = completed(await h.run(input, actor), 'accepted');
      assert.equal(replay.replayed, true);
      assert.equal(replay.executionId, first.executionId);
      assert.deepEqual(replay.result, first.result);
      const payloadConflict = await h.run(changed, actor),
        principalConflict = await h.run(input, second);
      assert.equal(payloadConflict.status, 'conflict');
      assert.equal(principalConflict.status, 'conflict');
      if (payloadConflict.status === 'conflict')
        assert.equal(payloadConflict.family, 'GUARD_CONFLICT');
      if (principalConflict.status === 'conflict')
        assert.equal(principalConflict.family, 'GUARD_CONFLICT');
      const duplicate = { ...input, idempotency_key: randomUUID() };
      const rejected = completed(await h.run(duplicate, actor), 'rejected', 'GUARD_IDEMPOTENT_DUP');
      const rejectedReplay = completed(
        await h.run(duplicate, actor),
        'rejected',
        'GUARD_IDEMPOTENT_DUP',
      );
      assert.equal(rejectedReplay.replayed, true);
      assert.equal(rejectedReplay.executionId, rejected.executionId);
      assert.deepEqual(rejectedReplay.result, rejected.result);
      completed(
        await h.run({ ...changed, idempotency_key: randomUUID() }, actor),
        'rejected',
        'GUARD_CONFLICT',
      );
      assert.deepEqual(await purchaseCounts(db), {
        purchases: 1,
        proformas: kind === 'proforma' ? 1 : 0,
        outcomes: kind === 'proforma' ? 4 : 3,
        audits: kind === 'proforma' ? 8 : 7,
        foreignWrites: 0,
      });
    });
  });

  for (const changed of [false, true]) {
    void test(`${kind}: distinct authenticated people race at the actual document lock and the loser is ${changed ? 'CONFLICT' : 'DUP'}`, async () => {
      await withDatabase(async (db) => {
        const people = await purchasingPeople(db),
          actor = await people.actor(),
          second = await people.secondActor(),
          gate = twoPartyGate(),
          parent = purchaseCommand();
        assert.notEqual(actor.principal.subject, second.principal.subject);
        class RacingStore extends PostgresPurchaseStore {
          override async lock(
            ctx: PurchaseContext,
            resource: 'purchase-record' | 'purchase-proforma',
            id: string,
          ) {
            await gate.enter();
            await super.lock(ctx, resource, id);
          }
        }
        if (kind === 'proforma')
          completed(await purchaseHarness(db, people.identity).run(parent, actor), 'accepted');
        const h = purchaseHarness(db, people.identity, { store: new RacingStore() }),
          input = kind === 'purchase' ? parent : proformaCommand(parent.target.id);
        const other = {
          ...input,
          idempotency_key: randomUUID(),
          payload: changed
            ? {
                ...input.payload,
                [kind === 'purchase' ? 'supplierReference' : 'proformaReference']:
                  'Different race facts',
              }
            : input.payload,
        };
        const results = await atOwnerLock(
          gate,
          () => h.run(input, actor),
          () => h.run(other, second),
        );
        assert.equal(
          results.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted').length,
          1,
        );
        const loser = results.find(
          (r) => r.status === 'completed' && r.result.outcome === 'rejected',
        );
        assert.ok(loser);
        completed(loser, 'rejected', changed ? 'GUARD_CONFLICT' : 'GUARD_IDEMPOTENT_DUP');
        assert.deepEqual(await purchaseCounts(db), {
          purchases: 1,
          proformas: kind === 'proforma' ? 1 : 0,
          outcomes: kind === 'proforma' ? 3 : 2,
          audits: kind === 'proforma' ? 3 : 2,
          foreignWrites: 0,
        });
      });
    });
  }

  for (const failure of ['business', 'technical', 'audit'] as const) {
    void test(`${kind}: ${failure} failure after actual INSERT rolls back the fact and preserves only a durable business rejection`, async () => {
      await withDatabase(async (db) => {
        const people = await purchasingPeople(db),
          actor = await people.actor(),
          parent = purchaseCommand(),
          good = purchaseHarness(db, people.identity);
        if (kind === 'proforma') completed(await good.run(parent, actor), 'accepted');
        const input = kind === 'purchase' ? parent : proformaCommand(parent.target.id);
        const fail = () => {
          if (failure === 'business')
            throw new BusinessRejection({
              family: 'GUARD_INVARIANT',
              message: 'Injected later business guard',
            });
          throw new Error('Injected technical abort after insert');
        };
        class FailingStore extends PostgresPurchaseStore {
          override async recordPurchase(
            ctx: PurchaseContext,
            id: string,
            binding: string,
            data: CompletedPurchaseInput,
          ) {
            await super.recordPurchase(ctx, id, binding, data);
            fail();
          }
          override async recordProforma(
            ctx: PurchaseContext,
            id: string,
            binding: string,
            data: PurchaseProformaInput,
          ) {
            await super.recordProforma(ctx, id, binding, data);
            fail();
          }
        }
        const h = purchaseHarness(
          db,
          people.identity,
          failure === 'audit'
            ? {
                ports: {
                  audits: {
                    async append(tx, event) {
                      await db.audit.append(tx, event);
                      throw new Error('Injected audit failure after real audit INSERT');
                    },
                  },
                },
              }
            : { store: new FailingStore() },
        );
        const result = await h.run(input, actor);
        if (failure === 'business') completed(result, 'rejected', 'GUARD_INVARIANT');
        else assert.equal(result.status, 'technical');
        const parentCount = kind === 'proforma' ? 1 : 0;
        assert.deepEqual(await purchaseCounts(db), {
          purchases: parentCount,
          proformas: 0,
          outcomes: parentCount + (failure === 'business' ? 1 : 0),
          audits: parentCount + (failure === 'business' ? 1 : 0),
          foreignWrites: 0,
        });
        if (failure === 'business')
          assert.equal(
            completed(await good.run(input, actor), 'rejected', 'GUARD_INVARIANT').replayed,
            true,
          );
        else completed(await good.run(input, actor), 'accepted');
      });
    });
  }

  void test(`${kind}: lost server-confirmed COMMIT response resolves through same-key replay to one fact`, async () => {
    await withDatabase(async (db) => {
      const people = await purchasingPeople(db),
        actor = await people.actor(),
        parent = purchaseCommand();
      if (kind === 'proforma')
        completed(await purchaseHarness(db, people.identity).run(parent, actor), 'accepted');
      const input = kind === 'purchase' ? parent : proformaCommand(parent.target.id),
        proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL ?? ''),
        pool = new Pool({ connectionString: proxy.url });
      pool.on('error', () => undefined);
      try {
        const result = await purchaseHarness(db, people.identity, {
          ports: { transactions: new PostgresTransactions(pool) },
        }).run(input, actor);
        assert.equal(result.status, 'technical');
        if (result.status === 'technical') assert.equal(result.kind, 'uncertain');
        assert.equal(proxy.commitConfirmed(), true);
        assert.equal(
          completed(await purchaseHarness(db, people.identity).run(input, actor), 'accepted')
            .replayed,
          true,
        );
        assert.deepEqual(await purchaseCounts(db), {
          purchases: 1,
          proformas: kind === 'proforma' ? 1 : 0,
          outcomes: kind === 'proforma' ? 2 : 1,
          audits: kind === 'proforma' ? 3 : 2,
          foreignWrites: 0,
        });
      } finally {
        await pool.end();
        await proxy.close();
      }
    });
  });
}

void test('absent and foreign-scope purchase references reject with the same STATE family and never create sent evidence', async () => {
  await withDatabase(async (db) => {
    const people = await purchasingPeople(db),
      actor = await people.actor(),
      h = purchaseHarness(db, people.identity),
      parent = purchaseCommand();
    completed(await h.run(parent, actor), 'accepted');
    await db.owner.query('UPDATE procurement.completed_purchase SET authority_scope=$1', [
      randomUUID(),
    ]);
    completed(await h.run(proformaCommand(parent.target.id), actor), 'rejected', 'GUARD_STATE');
    completed(await h.run(proformaCommand(randomUUID()), actor), 'rejected', 'GUARD_STATE');
    assert.equal(
      await readTransaction(db, actor, parent, (ctx) =>
        h.service.get(ctx, 'GetCompletedPurchase', parent.target.id),
      ),
      undefined,
    );
    assert.deepEqual(await purchaseCounts(db), {
      purchases: 1,
      proformas: 0,
      outcomes: 3,
      audits: 3,
      foreignWrites: 0,
    });
  });
});

void test('strict purchase/proforma fields, UTF8 byte bounds, controls and real calendar dates reject before any fact write', async () => {
  await withDatabase(async (db) => {
    const people = await purchasingPeople(db),
      actor = await people.actor(),
      h = purchaseHarness(db, people.identity),
      parent = purchaseCommand();
    completed(await h.run(parent, actor), 'accepted');
    let invalidCount = 0;
    for (const base of [purchaseCommand(), proformaCommand(parent.target.id)]) {
      const dateField = base.command === 'RecordCompletedPurchase' ? 'purchaseDate' : 'sentDate';
      const reference =
        base.command === 'RecordCompletedPurchase'
          ? 'purchaseDocumentReference'
          : 'proformaReference';
      const invalidPayloads = [
        ...[
          '2026-02-29',
          '2024-02-30',
          '0000-01-01',
          '2026-13-01',
          '2026-10-00',
          '2026-1-01',
          '2026-10-10T00:00:00Z',
        ].map((value) => ({ ...base.payload, [dateField]: value })),
        ...['', '   ', 'bad\nreference', 'bad\u007freference', 'a'.repeat(129), 'آ'.repeat(65)].map(
          (value) => ({ ...base.payload, [reference]: value }),
        ),
      ];
      for (const payload of invalidPayloads) {
        completed(
          await h.run({ ...base, idempotency_key: randomUUID(), payload }, actor),
          'rejected',
          'GUARD_INVARIANT',
        );
        invalidCount++;
      }
      const unknown = await h.run(
        {
          ...base,
          idempotency_key: randomUUID(),
          payload: { ...base.payload, supplierApproval: true },
        },
        actor,
      );
      assert.equal(unknown.status, 'admission-denied');
    }
    for (const payload of [
      { ...parent.payload, supplierReference: '' },
      { ...parent.payload, materialDescription: 'a'.repeat(513) },
    ]) {
      completed(await h.run(purchaseCommand({ payload }), actor), 'rejected', 'GUARD_INVARIANT');
      invalidCount++;
    }
    completed(
      await h.run(
        proformaCommand(parent.target.id, {
          payload: { purchaseId: 'not-a-uuid', proformaReference: 'PF', sentDate: '2026-10-10' },
        }),
        actor,
      ),
      'rejected',
      'GUARD_INVARIANT',
    );
    invalidCount++;
    const leap = purchaseCommand({
      payload: {
        ...parent.payload,
        purchaseDate: '2024-02-29',
        purchaseDocumentReference: 'آ'.repeat(64),
        materialDescription: 'آ'.repeat(256),
      },
    });
    completed(await h.run(leap, actor), 'accepted');
    assert.deepEqual(await purchaseCounts(db), {
      purchases: 2,
      proformas: 0,
      outcomes: 2 + invalidCount,
      audits: 4 + invalidCount,
      foreignWrites: 0,
    });
  });
});

void test('current personal ACT-PROC organization authority is mandatory for commands, replay and scoped reads', async () => {
  await withDatabase(async (db) => {
    const people = await purchasingPeople(db),
      actor = await people.actor(),
      h = purchaseHarness(db, people.identity),
      parent = purchaseCommand(),
      sent = proformaCommand(parent.target.id);
    completed(await h.run(parent, actor), 'accepted');
    completed(await h.run(sent, actor), 'accepted');
    let denials = 0;
    for (const role of ['ACT-WH', 'ACT-CUST', 'ACT-SEC'] as const) {
      const wrong = await people.actor(role);
      for (const input of [parent, sent]) {
        assert.equal((await h.run(input, wrong)).status, 'admission-denied');
        denials++;
        await assert.rejects(
          readTransaction(db, wrong, input, (ctx) =>
            h.service.get(
              ctx,
              input === parent ? 'GetCompletedPurchase' : 'GetPurchaseProforma',
              input.target.id,
            ),
          ),
          guard('GUARD_ACTOR'),
        );
      }
    }
    for (const fake of [
      Object.freeze({ ...actor, principal: Object.freeze({ ...actor.principal }) }),
      Object.freeze({ ...actor, authorityScopeId: randomUUID() }),
      Object.freeze({ ...actor, installationId: randomUUID() }),
      Object.freeze({ ...actor, customerScope: 'foreign-customer' }),
      Object.freeze({ ...actor, temporary: true }),
    ]) {
      assert.equal((await h.run(parent, fake)).status, 'admission-denied');
      denials++;
      await assert.rejects(
        readTransaction(db, fake, parent, (ctx) =>
          h.service.get(ctx, 'GetCompletedPurchase', parent.target.id),
        ),
        (error: unknown) =>
          guard('GUARD_ACTOR')(error) ||
          (error instanceof AdmissionError && error.family === 'GUARD_ACTOR'),
      );
    }
    const customer = randomUUID();
    const self = await people.identity.session(people.tokens.get('ACT-PROC')!);
    await db.owner.query(
      'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,$4,$5)',
      [actor.installationId, self.accountId, actor.authorityScopeId, 'ACT-PROC', customer],
    );
    const customerActor = await people.identity.context(
      people.tokens.get('ACT-PROC')!,
      'ACT-PROC',
      customer,
    );
    assert.equal(
      await people.identity.isCurrent(customerActor),
      true,
      'Actual branded customer grant is current before module denial',
    );
    for (const input of [parent, sent]) {
      assert.equal((await h.run(input, customerActor)).status, 'admission-denied');
      denials++;
      await assert.rejects(
        readTransaction(db, customerActor, input, (ctx) =>
          h.service.get(
            ctx,
            input === parent ? 'GetCompletedPurchase' : 'GetPurchaseProforma',
            input.target.id,
          ),
        ),
        guard('GUARD_ACTOR'),
      );
    }
    await db.owner.query('DELETE FROM identity.role_grant WHERE actor_role=$1', ['ACT-PROC']);
    for (const input of [parent, sent]) {
      assert.equal((await h.run(input, actor)).status, 'admission-denied');
      denials++;
      await assert.rejects(
        readTransaction(db, actor, input, (ctx) =>
          h.service.get(
            ctx,
            input === parent ? 'GetCompletedPurchase' : 'GetPurchaseProforma',
            input.target.id,
          ),
        ),
        guard('GUARD_ACTOR'),
      );
    }
    assert.deepEqual(await purchaseCounts(db), {
      purchases: 1,
      proformas: 1,
      outcomes: 2,
      audits: 2 + denials,
      foreignWrites: 0,
    });
  });
});

for (const replay of [false, true]) {
  void test(`session revocation during actual envelope advisory-lock wait denies ${replay ? 'accepted replay' : 'new purchase'}`, async () => {
    await withDatabase(async (db) => {
      const people = await purchasingPeople(db),
        actor = await people.actor(),
        input = purchaseCommand();
      if (replay)
        completed(await purchaseHarness(db, people.identity).run(input, actor), 'accepted');
      const blocker = await db.owner.connect();
      let announce!: (pid: number) => void;
      const waiting = new Promise<number>((resolve) => {
        announce = resolve;
      });
      await blocker.query('BEGIN');
      const transactions: TransactionPort = {
        async begin() {
          const session = await db.transactions.begin();
          return {
            ...session,
            async lock(words) {
              await blocker.query('SELECT pg_advisory_xact_lock($1::integer,$2::integer)', [
                ...words,
              ]);
              const pid = (
                await transactionClient(session.context).query<{ pid: number }>(
                  'SELECT pg_backend_pid() AS pid',
                )
              ).rows[0]!.pid;
              announce(pid);
              await session.lock(words);
            },
          };
        },
      };
      const running = purchaseHarness(db, people.identity, { ports: { transactions } }).run(
        input,
        actor,
      );
      try {
        const pid = await Promise.race([
          waiting,
          delay(8000).then(() => {
            throw new Error('Command did not reach envelope lock');
          }),
        ]);
        const deadline = Date.now() + 3000;
        let blocked = false;
        while (Date.now() < deadline) {
          const locks = await db.owner.query<{ blocked: boolean }>(
            "SELECT EXISTS(SELECT 1 FROM pg_locks WHERE pid=$1 AND locktype='advisory' AND NOT granted) AS blocked",
            [pid],
          );
          if (locks.rows[0]?.blocked) {
            blocked = true;
            break;
          }
          await delay(20);
        }
        assert.equal(
          blocked,
          true,
          'Observed real PostgreSQL advisory-lock wait before revocation',
        );
        await people.identity.logout(people.tokens.get('ACT-PROC')!);
      } finally {
        await blocker.query('ROLLBACK');
        blocker.release();
      }
      assert.equal((await running).status, 'admission-denied');
      assert.deepEqual(await purchaseCounts(db), {
        purchases: replay ? 1 : 0,
        proformas: 0,
        outcomes: replay ? 1 : 0,
        audits: replay ? 2 : 1,
        foreignWrites: 0,
      });
    });
  });
}

void test('runtime cannot UPDATE/DELETE immutable purchasing facts; scoped FK and database field constraints are enforced', async () => {
  await withDatabase(async (db) => {
    const people = await purchasingPeople(db),
      actor = await people.actor(),
      h = purchaseHarness(db, people.identity),
      parent = purchaseCommand(),
      sent = proformaCommand(parent.target.id);
    completed(await h.run(parent, actor), 'accepted');
    completed(await h.run(sent, actor), 'accepted');
    for (const table of ['procurement.completed_purchase', 'procurement.purchase_proforma_sent']) {
      for (const sql of [
        `UPDATE ${table} SET binding='changed'`,
        `DELETE FROM ${table}`,
        `TRUNCATE ${table}`,
      ])
        await assert.rejects(db.runtime.query(sql), pgCode('42501'));
    }
    for (const sql of [
      "UPDATE procurement.purchase_proforma_sent SET purchase_id='" + randomUUID() + "'",
      "UPDATE procurement.purchase_proforma_sent SET authority_scope='" + randomUUID() + "'",
      "UPDATE procurement.purchase_proforma_sent SET installation_id='" + randomUUID() + "'",
    ])
      await assert.rejects(db.owner.query(sql), pgCode('23503'));
    for (const sql of [
      "UPDATE procurement.completed_purchase SET supplier_reference=''",
      "UPDATE procurement.completed_purchase SET material_description=repeat('a',513)",
      "UPDATE procurement.completed_purchase SET purchase_date=DATE '10000-01-01'",
      "UPDATE procurement.completed_purchase SET actor_role='ACT-WH'",
      "UPDATE procurement.purchase_proforma_sent SET proforma_reference=''",
      "UPDATE procurement.purchase_proforma_sent SET sent_date=DATE '10000-01-01'",
      "UPDATE procurement.purchase_proforma_sent SET actor_role='ACT-CUST'",
    ])
      await assert.rejects(db.owner.query(sql), pgCode('23514'));
    assert.deepEqual(await purchaseCounts(db), {
      purchases: 1,
      proformas: 1,
      outcomes: 2,
      audits: 2,
      foreignWrites: 0,
    });
  });
});

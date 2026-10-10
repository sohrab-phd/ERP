import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { Pool } from 'pg';
import { AdmissionError, BusinessRejection, type TransactionPort } from '@navard/shared-kernel';
import { IdentityService } from '../../src/modules/identity/index.js';
import { PostgresIdentityStore } from '../../src/infrastructure/postgresql/identity-store.js';
import { PostgresInvoiceEvidenceStore } from '../../src/infrastructure/postgresql/invoice-evidence-store.js';
import {
  PostgresTransactions,
  transactionClient,
} from '../../src/infrastructure/postgresql/transaction.js';
import type {
  InvoiceEvidenceContext,
  InvoiceEvidenceInput,
} from '../../src/modules/finance/index.js';
import { withDatabase } from '../support/database-fixture.js';
import { lostCommitProxy } from '../support/crash-child.js';
import {
  invoicePeople,
  invoiceCommand,
  invoiceHarness,
  invoiceCounts,
  completed,
  readTransaction,
  guard,
  pgCode,
} from '../support/invoice-evidence-harness.js';

function rendezvous() {
  let arrivals = 0,
    ready!: () => void,
    release!: () => void,
    reject!: (error: Error) => void;
  const arrived = new Promise<void>((resolve, fail) => {
    ready = resolve;
    reject = fail;
  });
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const timer = setTimeout(
    () => reject(new Error(`Only ${arrivals} people reached the evidence lock`)),
    8000,
  );
  return {
    arrived,
    async enter() {
      arrivals++;
      assert.ok(arrivals <= 2);
      if (arrivals === 2) ready();
      await released;
    },
    release() {
      clearTimeout(timer);
      release();
    },
  };
}
async function observedAdvisoryWait(
  db: Parameters<Parameters<typeof withDatabase>[0]>[0],
  pid: number,
) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const locks = await db.owner.query<{ blocked: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_locks WHERE pid=$1 AND locktype='advisory' AND NOT granted) AS blocked",
      [pid],
    );
    if (locks.rows[0]?.blocked) return;
    await delay(20);
  }
  assert.fail('Expected observed real PostgreSQL advisory-lock wait');
}

void test('issued-invoice evidence retains only approved facts and trusted personal attribution; duplicate references and multiple evidence IDs per draft order are allowed', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      h = invoiceHarness(db, people.identity);
    const orderBefore = (await db.owner.query('SELECT * FROM sales.sales_order')).rows;
    const input = invoiceCommand(people.orderId, people.customerId);
    const accepted = completed(await h.run(input, actor), 'accepted');
    assert.equal(accepted.result.event, 'IssuedInvoiceEvidenceRecorded');
    assert.deepEqual(accepted.result.data, { evidenceId: input.target.id });
    const record = await readTransaction(db, actor, input, (ctx) =>
      h.service.get(ctx, input.target.id),
    );
    assert.ok(record);
    assert.deepEqual(Object.keys(record).sort(), [
      'customerId',
      'id',
      'invoiceDocumentReference',
      'issueDate',
      'issuer',
      'recordedAt',
      'salesOrderId',
      'subject',
    ]);
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(record).filter(
          ([key]) => !['id', 'issuer', 'subject', 'recordedAt'].includes(key),
        ),
      ),
      input.payload,
    );
    assert.equal(record.subject, actor.principal.subject);
    assert.equal(record.issuer, actor.principal.issuer);
    assert.equal(typeof record.recordedAt, 'string');
    assert.ok(Number.isFinite(Date.parse(record.recordedAt)));
    const fin = await people.actor('ACT-FIN');
    assert.deepEqual(
      await readTransaction(db, fin, input, (ctx) => h.service.get(ctx, input.target.id)),
      record,
    );
    completed(
      await h.run(
        invoiceCommand(people.orderId, people.customerId, { payload: input.payload }),
        actor,
      ),
      'accepted',
    );
    assert.deepEqual((await db.owner.query('SELECT * FROM sales.sales_order')).rows, orderBefore);
    assert.deepEqual(
      (
        await db.owner.query(
          'SELECT actor_role,request_id,idempotency_key FROM finance.invoice_evidence WHERE evidence_id=$1',
          [input.target.id],
        )
      ).rows,
      [
        {
          actor_role: 'ACT-SALES',
          request_id: actor.requestId,
          idempotency_key: input.idempotency_key,
        },
      ],
    );
    assert.deepEqual(await invoiceCounts(db), {
      evidence: 2,
      outcomes: 3,
      audits: 3,
      foreignWrites: 0,
    });
  });
});

void test('accepted/rejected replay and occupied-key target/payload/principal conflicts are durable; new-key same evidence UUID rejects DUP or CONFLICT', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      second = await people.secondActor(),
      h = invoiceHarness(db, people.identity),
      input = invoiceCommand(people.orderId, people.customerId);
    const first = completed(await h.run(input, actor), 'accepted'),
      replay = completed(await h.run(input, actor), 'accepted');
    assert.equal(replay.replayed, true);
    assert.equal(replay.executionId, first.executionId);
    assert.deepEqual(replay.result, first.result);
    const changed = {
      ...input,
      payload: { ...input.payload, invoiceDocumentReference: 'Different invoice evidence' },
    };
    for (const [command, person] of [
      [changed, actor],
      [{ ...input, target: { ...input.target, id: randomUUID() } }, actor],
      [input, second],
    ] as const) {
      const conflict = await h.run(command, person);
      assert.equal(conflict.status, 'conflict');
      if (conflict.status === 'conflict') assert.equal(conflict.family, 'GUARD_CONFLICT');
    }
    const duplicate = { ...input, idempotency_key: randomUUID() };
    const rejected = completed(await h.run(duplicate, actor), 'rejected', 'GUARD_IDEMPOTENT_DUP'),
      rejectedReplay = completed(await h.run(duplicate, actor), 'rejected', 'GUARD_IDEMPOTENT_DUP');
    assert.equal(rejectedReplay.replayed, true);
    assert.equal(rejectedReplay.executionId, rejected.executionId);
    assert.deepEqual(rejectedReplay.result, rejected.result);
    completed(
      await h.run({ ...changed, idempotency_key: randomUUID() }, actor),
      'rejected',
      'GUARD_CONFLICT',
    );
    assert.equal((await invoiceCounts(db)).evidence, 1);
    assert.equal((await invoiceCounts(db)).outcomes, 4);
  });
});

void test('missing, mismatched and foreign Sales/customer links produce the same safe durable rejection without changing Sales or inserting evidence', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      h = invoiceHarness(db, people.identity),
      foreignScope = randomUUID();
    await db.owner.query(
      'INSERT INTO sales.customer(installation_id,authority_scope,customer_id,display_name) VALUES($1,$2,$3,$4)',
      [actor.installationId, foreignScope, people.customerId, 'Foreign synthetic customer'],
    );
    const foreignOrderId = randomUUID();
    await db.owner.query(
      'INSERT INTO sales.sales_order(installation_id,authority_scope,order_id,customer_id,customer_name,items,commercial_terms,binding,state,issuer,subject) SELECT installation_id,$1,$2,customer_id,customer_name,items,commercial_terms,binding,state,issuer,subject FROM sales.sales_order WHERE order_id=$3',
      [foreignScope, foreignOrderId, people.orderId],
    );
    const before = (await db.owner.query('SELECT * FROM sales.sales_order ORDER BY order_id')).rows;
    for (const [orderId, customerId] of [
      [randomUUID(), people.customerId],
      [people.orderId, randomUUID()],
      [people.orderId, people.otherCustomerId],
      [foreignOrderId, people.customerId],
    ]) {
      const input = invoiceCommand(orderId!, customerId!);
      const rejected = completed(await h.run(input, actor), 'rejected', 'GUARD_STATE');
      assert.equal(rejected.result.message, 'Matching Sales order and customer required');
      assert.equal(JSON.stringify(rejected.result).includes('Foreign synthetic'), false);
      const replay = completed(await h.run(input, actor), 'rejected', 'GUARD_STATE');
      assert.equal(replay.replayed, true);
      assert.deepEqual(replay.result, rejected.result);
    }
    assert.equal((await invoiceCounts(db)).evidence, 0);
    assert.deepEqual(
      (await db.owner.query('SELECT * FROM sales.sales_order ORDER BY order_id')).rows,
      before,
    );
  });
});

for (const changed of [false, true]) {
  void test(`different authenticated people race at the real evidence lock; one fact and one ${changed ? 'CONFLICT' : 'DUP'} outcome`, async () => {
    await withDatabase(async (db) => {
      const people = await invoicePeople(db),
        actor = await people.actor(),
        second = await people.secondActor(),
        gate = rendezvous();
      assert.notEqual(actor.principal.subject, second.principal.subject);
      class RacingStore extends PostgresInvoiceEvidenceStore {
        override async lock(ctx: InvoiceEvidenceContext, id: string) {
          await gate.enter();
          await super.lock(ctx, id);
        }
      }
      const h = invoiceHarness(db, people.identity, { store: new RacingStore() }),
        input = invoiceCommand(people.orderId, people.customerId);
      const other = {
        ...input,
        idempotency_key: randomUUID(),
        payload: changed
          ? { ...input.payload, invoiceDocumentReference: 'Other document' }
          : input.payload,
      };
      const running = [h.run(input, actor), h.run(other, second)],
        results = Promise.all(running);
      void results.catch(() => undefined);
      try {
        await gate.arrived;
        gate.release();
        const values = await results;
        assert.equal(
          values.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted').length,
          1,
        );
        const loser = values.find(
          (r) => r.status === 'completed' && r.result.outcome === 'rejected',
        );
        assert.ok(loser);
        completed(loser, 'rejected', changed ? 'GUARD_CONFLICT' : 'GUARD_IDEMPOTENT_DUP');
        assert.deepEqual(await invoiceCounts(db), {
          evidence: 1,
          outcomes: 3,
          audits: 3,
          foreignWrites: 0,
        });
      } finally {
        gate.release();
        await Promise.allSettled(running);
      }
    });
  });
}

for (const failure of ['business', 'technical', 'audit', 'outcome'] as const) {
  void test(`${failure} failure after actual INSERT proves fact/outcome/audit atomic rollback`, async () => {
    await withDatabase(async (db) => {
      const people = await invoicePeople(db),
        actor = await people.actor(),
        input = invoiceCommand(people.orderId, people.customerId),
        good = invoiceHarness(db, people.identity);
      class FailingStore extends PostgresInvoiceEvidenceStore {
        override async record(
          ctx: InvoiceEvidenceContext,
          id: string,
          binding: string,
          data: InvoiceEvidenceInput,
        ) {
          await super.record(ctx, id, binding, data);
          if (failure === 'business')
            throw new BusinessRejection({
              family: 'GUARD_INVARIANT',
              message: 'Injected later business guard',
            });
          throw new Error('Injected technical abort after invoice evidence INSERT');
        }
      }
      const h = invoiceHarness(
        db,
        people.identity,
        failure === 'audit'
          ? {
              ports: {
                audits: {
                  async append(tx, event) {
                    await db.audit.append(tx, event);
                    throw new Error('Injected abort after audit INSERT');
                  },
                },
              },
            }
          : failure === 'outcome'
            ? {
                ports: {
                  outcomes: {
                    find: db.outcomes.find.bind(db.outcomes),
                    async insert(tx, outcome) {
                      await db.outcomes.insert(tx, outcome);
                      throw new Error('Injected abort after outcome INSERT');
                    },
                  },
                },
              }
            : { store: new FailingStore() },
      );
      const result = await h.run(input, actor);
      if (failure === 'business') completed(result, 'rejected', 'GUARD_INVARIANT');
      else assert.equal(result.status, 'technical');
      assert.deepEqual(await invoiceCounts(db), {
        evidence: 0,
        outcomes: 1 + (failure === 'business' ? 1 : 0),
        audits: 1 + (failure === 'business' ? 1 : 0),
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

void test('lost server-confirmed COMMIT response resolves by same-key replay to one invoice evidence fact', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      input = invoiceCommand(people.orderId, people.customerId),
      proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL ?? ''),
      pool = new Pool({ connectionString: proxy.url });
    pool.on('error', () => undefined);
    try {
      const result = await invoiceHarness(db, people.identity, {
        ports: { transactions: new PostgresTransactions(pool) },
      }).run(input, actor);
      assert.equal(result.status, 'technical');
      if (result.status === 'technical') assert.equal(result.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      assert.equal(
        completed(await invoiceHarness(db, people.identity).run(input, actor), 'accepted').replayed,
        true,
      );
      assert.deepEqual(await invoiceCounts(db), {
        evidence: 1,
        outcomes: 2,
        audits: 3,
        foreignWrites: 0,
      });
    } finally {
      await pool.end();
      await proxy.close();
    }
  });
});

void test('only current organization SALES writes; FIN reads only; customer grants, unrelated roles and forged contexts never disclose evidence', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      h = invoiceHarness(db, people.identity),
      input = invoiceCommand(people.orderId, people.customerId);
    completed(await h.run(input, actor), 'accepted');
    for (const role of [
      'ACT-FIN',
      'ACT-PROC',
      'ACT-WH',
      'ACT-OP',
      'ACT-PLAN',
      'ACT-SEC',
      'ACT-CUST',
    ] as const) {
      const wrong = await people.actor(role);
      assert.equal((await h.run(input, wrong)).status, 'admission-denied');
      if (role !== 'ACT-FIN')
        await assert.rejects(
          readTransaction(db, wrong, input, (ctx) => h.service.get(ctx, input.target.id)),
          guard('GUARD_ACTOR'),
        );
    }
    const finToken = people.tokens.get('ACT-FIN')!;
    const finAccount = await people.identity.session(finToken);
    await db.owner.query(
      'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,$4,$5)',
      [
        actor.installationId,
        finAccount.accountId,
        actor.authorityScopeId,
        'ACT-FIN',
        people.customerId,
      ],
    );
    const customerFin = await people.identity.context(finToken, 'ACT-FIN', people.customerId);
    assert.equal(
      await people.identity.isCurrent(customerFin),
      true,
      'Genuine FIN customer grant is current before module rejection',
    );
    for (const wrong of [
      people.customerActor,
      customerFin,
      Object.freeze({ ...actor, principal: Object.freeze({ ...actor.principal }) }),
      Object.freeze({ ...actor, authorityScopeId: randomUUID() }),
      Object.freeze({ ...actor, installationId: randomUUID() }),
      Object.freeze({ ...actor, temporary: true }),
    ]) {
      assert.equal((await h.run(input, wrong)).status, 'admission-denied');
      await assert.rejects(
        readTransaction(db, wrong, input, (ctx) => h.service.get(ctx, input.target.id)),
        (error: unknown) =>
          guard('GUARD_ACTOR')(error) ||
          (error instanceof AdmissionError && error.family === 'GUARD_ACTOR'),
      );
    }
    const fin = await people.actor('ACT-FIN');
    await db.owner.query(
      "DELETE FROM identity.role_grant WHERE actor_role IN ('ACT-SALES','ACT-FIN') AND customer_scope='' ",
    );
    assert.equal((await h.run(input, actor)).status, 'admission-denied');
    for (const revoked of [actor, fin])
      await assert.rejects(
        readTransaction(db, revoked, input, (ctx) => h.service.get(ctx, input.target.id)),
        guard('GUARD_ACTOR'),
      );
    assert.equal((await invoiceCounts(db)).evidence, 1);
  });
});

void test('a genuinely authenticated other-organization grant cannot read existing evidence or bind its Sales order', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      h = invoiceHarness(db, people.identity),
      input = invoiceCommand(people.orderId, people.customerId);
    completed(await h.run(input, actor), 'accepted');
    const self = await people.identity.session(people.tokens.get('ACT-SALES')!),
      foreignAuthority = randomUUID();
    await db.owner.query(
      'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,$4,$5)',
      [actor.installationId, self.accountId, foreignAuthority, 'ACT-SALES', ''],
    );
    const foreignIdentity = new IdentityService(
      new PostgresIdentityStore(db.runtime),
      db.transactions,
      actor.installationId,
      foreignAuthority,
    );
    const foreign = await foreignIdentity.context(people.tokens.get('ACT-SALES')!, 'ACT-SALES');
    assert.equal(await foreignIdentity.isCurrent(foreign), true);
    const other = invoiceHarness(db, foreignIdentity);
    assert.equal(
      await readTransaction(db, foreign, input, (ctx) => other.service.get(ctx, input.target.id)),
      undefined,
    );
    const rejected = completed(
      await other.run({ ...input, idempotency_key: randomUUID() }, foreign),
      'rejected',
      'GUARD_STATE',
    );
    assert.equal(rejected.result.message, 'Matching Sales order and customer required');
    assert.equal((await invoiceCounts(db)).evidence, 1);
  });
});

void test('a genuinely authenticated other-installation SALES grant cannot disclose existing evidence or its Sales links', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      input = invoiceCommand(people.orderId, people.customerId);
    completed(await invoiceHarness(db, people.identity).run(input, actor), 'accepted');
    const foreignInstallation = randomUUID(),
      foreignAccount = randomUUID();
    await db.owner.query(
      'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) SELECT $1,$2,$3,$4,password_hash FROM identity.account WHERE username=$5',
      [
        foreignInstallation,
        foreignAccount,
        randomUUID(),
        'invoice.foreign.installation',
        'invoice.act-fin',
      ],
    );
    await db.owner.query(
      'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,$4,$5)',
      [foreignInstallation, foreignAccount, actor.authorityScopeId, 'ACT-SALES', ''],
    );
    const foreignIdentity = new IdentityService(
      new PostgresIdentityStore(db.runtime),
      db.transactions,
      foreignInstallation,
      actor.authorityScopeId,
    );
    const token = (
      await foreignIdentity.login(
        'invoice.foreign.installation',
        'synthetic invoice evidence individual',
      )
    ).token;
    const foreign = await foreignIdentity.context(token, 'ACT-SALES');
    assert.equal(await foreignIdentity.isCurrent(foreign), true);
    const other = invoiceHarness(db, foreignIdentity);
    assert.equal(
      await readTransaction(db, foreign, input, (ctx) => other.service.get(ctx, input.target.id)),
      undefined,
    );
    completed(await other.run(input, foreign), 'rejected', 'GUARD_STATE');
    assert.equal((await invoiceCounts(db)).evidence, 1);
  });
});

for (const replay of [false, true]) {
  void test(`session revoked during actual envelope advisory-lock wait denies ${replay ? 'accepted replay' : 'new invoice evidence'}`, async () => {
    await withDatabase(async (db) => {
      const people = await invoicePeople(db),
        actor = await people.actor(),
        input = invoiceCommand(people.orderId, people.customerId);
      if (replay)
        completed(await invoiceHarness(db, people.identity).run(input, actor), 'accepted');
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
      const running = invoiceHarness(db, people.identity, { ports: { transactions } }).run(
        input,
        actor,
      );
      try {
        const pid = await Promise.race([
          waiting,
          delay(8000).then(() => {
            throw new Error('Envelope lock not reached');
          }),
        ]);
        await observedAdvisoryWait(db, pid);
        await people.identity.logout(people.tokens.get('ACT-SALES')!);
      } finally {
        await blocker.query('ROLLBACK');
        blocker.release();
      }
      assert.equal((await running).status, 'admission-denied');
      assert.deepEqual(await invoiceCounts(db), {
        evidence: replay ? 1 : 0,
        outcomes: replay ? 2 : 1,
        audits: replay ? 3 : 2,
        foreignWrites: 0,
      });
    });
  });
}

void test('current personal grant is rechecked after the actual evidence identity lock wait', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      input = invoiceCommand(people.orderId, people.customerId),
      blocker = await db.owner.connect();
    let announce!: (pid: number) => void;
    const waiting = new Promise<number>((resolve) => {
      announce = resolve;
    });
    await blocker.query('BEGIN');
    await blocker.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
      JSON.stringify([
        'invoice-evidence',
        actor.installationId,
        actor.authorityScopeId,
        input.target.id,
      ]),
    ]);
    class WaitingStore extends PostgresInvoiceEvidenceStore {
      override async lock(ctx: InvoiceEvidenceContext, id: string) {
        announce(
          (
            await transactionClient(ctx.transaction).query<{ pid: number }>(
              'SELECT pg_backend_pid() AS pid',
            )
          ).rows[0]!.pid,
        );
        await super.lock(ctx, id);
      }
    }
    const running = invoiceHarness(db, people.identity, { store: new WaitingStore() }).run(
      input,
      actor,
    );
    try {
      const pid = await Promise.race([
        waiting,
        delay(8000).then(() => {
          throw new Error('Evidence lock not reached');
        }),
      ]);
      await observedAdvisoryWait(db, pid);
      await db.owner.query(
        "DELETE FROM identity.role_grant WHERE actor_role='ACT-SALES' AND customer_scope='' ",
      );
    } finally {
      await blocker.query('ROLLBACK');
      blocker.release();
    }
    completed(await running, 'rejected', 'GUARD_ACTOR');
    assert.deepEqual(await invoiceCounts(db), {
      evidence: 0,
      outcomes: 2,
      audits: 2,
      foreignWrites: 0,
    });
  });
});

void test('revocation during actual evidence query prevents disclosure after the owner lookup', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      input = invoiceCommand(people.orderId, people.customerId);
    completed(await invoiceHarness(db, people.identity).run(input, actor), 'accepted');
    class RevokingStore extends PostgresInvoiceEvidenceStore {
      override async evidence(ctx: InvoiceEvidenceContext, id: string) {
        const value = await super.evidence(ctx, id);
        assert.ok(value);
        await db.owner.query(
          "DELETE FROM identity.role_grant WHERE actor_role='ACT-FIN' AND customer_scope='' ",
        );
        return value;
      }
    }
    const fin = await people.actor('ACT-FIN'),
      h = invoiceHarness(db, people.identity, { store: new RevokingStore() });
    await assert.rejects(
      readTransaction(db, fin, input, (ctx) => h.service.get(ctx, input.target.id)),
      guard('GUARD_ACTOR'),
    );
  });
});

void test('restricted runtime cannot mutate immutable evidence; database enforces scoped Sales/customer FK and documentary constraints', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db),
      actor = await people.actor(),
      input = invoiceCommand(people.orderId, people.customerId);
    completed(await invoiceHarness(db, people.identity).run(input, actor), 'accepted');
    for (const sql of [
      "UPDATE finance.invoice_evidence SET binding='changed'",
      'DELETE FROM finance.invoice_evidence',
      'TRUNCATE finance.invoice_evidence',
    ])
      await assert.rejects(db.runtime.query(sql), pgCode('42501'));
    for (const column of ['installation_id', 'authority_scope', 'sales_order_id', 'customer_id'])
      await assert.rejects(
        db.owner.query(`UPDATE finance.invoice_evidence SET ${column}=$1`, [randomUUID()]),
        pgCode('23503'),
      );
    for (const sql of [
      "UPDATE finance.invoice_evidence SET invoice_document_reference=''",
      "UPDATE finance.invoice_evidence SET invoice_document_reference=repeat('a',129)",
      "UPDATE finance.invoice_evidence SET invoice_document_reference=E'bad\\nreference'",
      "UPDATE finance.invoice_evidence SET issue_date=DATE '10000-01-01'",
      "UPDATE finance.invoice_evidence SET actor_role='ACT-FIN'",
    ])
      await assert.rejects(db.owner.query(sql), pgCode('23514'));
    assert.deepEqual(await invoiceCounts(db), {
      evidence: 1,
      outcomes: 2,
      audits: 2,
      foreignWrites: 0,
    });
  });
});

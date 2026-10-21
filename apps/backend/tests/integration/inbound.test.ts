import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { BusinessRejection, type CommandRequest } from '@navard/shared-kernel';
import { PostgresInboundStore } from '../../src/infrastructure/postgresql/inbound-store.js';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import {
  normalizeOrderReference,
  type InboundOrderProjection,
  type InboundStore,
} from '../../src/modules/procurement/index.js';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import { lostCommitProxy } from '../support/crash-child.js';
import {
  inboundPeople,
  inboundHarness,
  optionCommand,
  orderCommand,
  inboundCounts,
  completed,
  guard,
} from '../support/inbound-harness.js';

async function seed(db: DatabaseFixture) {
  const people = await inboundPeople(db),
    actor = await people.proc.actor();
  const h = inboundHarness(db, people.identity);
  const option = optionCommand();
  completed(await h.run(option, actor), 'accepted');
  return { people, actor, h, option, material: option.target.id };
}
function lines(r: CommandRequest) {
  return r.payload.lines as readonly Record<string, string>[];
}
function withPayload(r: CommandRequest, payload: CommandRequest['payload']): CommandRequest {
  return {
    ...r,
    idempotency_key: randomUUID(),
    target: { ...r.target, id: randomUUID() },
    payload,
  };
}
function rendezvous() {
  let n = 0,
    ready!: () => void,
    reject!: (error: Error) => void,
    unblock!: () => void;
  const arrived = new Promise<void>((resolve, fail) => {
      ready = resolve;
      reject = fail;
    }),
    released = new Promise<void>((resolve) => {
      unblock = resolve;
    });
  const timer = setTimeout(() => {
    reject(new Error('Both independent actors did not reach the owner lock'));
    unblock();
  }, 8000);
  return {
    arrived,
    release() {
      clearTimeout(timer);
      unblock();
    },
    async enter() {
      assert.ok(++n <= 2);
      if (n === 2) ready();
      await released;
    },
  };
}
function wrapper(store: PostgresInboundStore, changes: Partial<InboundStore>): InboundStore {
  return {
    lock: changes.lock ?? store.lock.bind(store),
    order: changes.order ?? store.order.bind(store),
    orderByReference: changes.orderByReference ?? store.orderByReference.bind(store),
    options: changes.options ?? store.options.bind(store),
    listOptions: changes.listOptions ?? store.listOptions.bind(store),
    insertOption: changes.insertOption ?? store.insertOption.bind(store),
    insertOrder: changes.insertOrder ?? store.insertOrder.bind(store),
  };
}

void test('A01/A04/A06/A07/A15/A16: complete immutable original, identical and unnumbered lines, exact units, huge count and no foreign effects', async () => {
  await withDatabase(async (db) => {
    const { people, actor, h, material } = await seed(db);
    const color = optionCommand('COLOR', 'آبی'),
      grade = optionCommand('QUALITY_GRADE', 'کیفیت آزمایشی');
    completed(await h.run(color, await people.wh.actor()), 'accepted');
    completed(await h.run(grade, actor), 'accepted');
    const r = orderCommand(material);
    const line = {
      ...lines(r)[0]!,
      itemNumber: 'آیتم-۱',
      colorOptionId: color.target.id,
      qualityGradeOptionId: grade.target.id,
      ralColorNumber: 'RAL descriptive',
      lengthM: '0.000000000000000001',
      unitWeightKg: '99999999999999999999',
      orderedUnitCount: '99999999999999999999',
    };
    const full = withPayload(r, { ...r.payload, lines: [line, line, { ...lines(r)[0]! }] });
    const before = await inboundCounts(db);
    completed(await h.run(full, actor), 'accepted');
    const after = await inboundCounts(db);
    assert.equal(after.orders - before.orders, 1);
    assert.equal(after.lines - before.lines, 3);
    assert.equal(after.foreign, before.foreign);
    const data = (await h.query(
      'GetOperationalPurchaseOrderByReference',
      { orderReference: 'po-١٢' },
      await people.wh.actor(),
    )) as InboundOrderProjection;
    assert.equal(data.orderReference, ' PO-۱۲ ');
    assert.equal(data.registrationDateJalali, '1403-12-30');
    assert.equal(data.calendar, 'jalali');
    assert.deepEqual(data.units, {
      widthM: 'm',
      thicknessMm: 'mm',
      lengthM: 'm',
      unitWeightKg: 'kg',
    });
    assert.equal(data.lines.length, 3);
    assert.equal(new Set(data.lines.map((x) => x.lineId)).size, 3);
    assert.deepEqual(
      data.lines.map((x) => x.position),
      [1, 2, 3],
    );
    assert.equal(data.lines[0]?.widthM, '1.200');
    assert.equal(data.lines[0]?.unitWeightKg, line.unitWeightKg);
    assert.equal(data.lines[0]?.orderedUnitCount, line.orderedUnitCount);
    assert.equal(data.lines[0]?.color?.label, 'آبی');
    assert.equal(data.lines[2]?.itemNumber, undefined);
    assert.deepEqual(
      await h.query('GetOperationalPurchaseOrder', { orderId: full.target.id }, actor),
      data,
    );
    assert.ok(
      !/binding|issuer|subject|idempotency|authority|recordedAt|orderReferenceKey|received|stock/u.test(
        JSON.stringify(data),
      ),
    );
    completed(await h.run(full, actor), 'accepted');
    assert.deepEqual(
      await h.query('GetOperationalPurchaseOrder', { orderId: full.target.id }, actor),
      data,
    );
  });
});
void test('A02/A20/R1-T01..T06/T09/T11: only finite approved PO equivalence; raw payload remains bound', async () => {
  await withDatabase(async (db) => {
    const { people, actor, h, material } = await seed(db);
    const r = orderCommand(material, {
      payload: { ...orderCommand(material).payload, orderReference: ' کالا-PO-۱۲ ' },
    });
    const first = completed(await h.run(r, actor), 'accepted');
    for (const raw of ['کالا-po-12', ' كالا-po-١٢ ', 'کالا-PO-۱۲']) {
      const x = withPayload(r, { ...r.payload, orderReference: raw });
      completed(await h.run(x, await people.proc2.actor()), 'rejected', 'GUARD_CONFLICT');
      const found = (await h.query(
        'GetOperationalPurchaseOrderByReference',
        { orderReference: raw },
        await people.wh.actor(),
      )) as InboundOrderProjection;
      assert.equal(found.orderId, r.target.id);
      assert.equal(found.orderReference, ' کالا-PO-۱۲ ');
      assert.equal(
        (await h.run({ ...r, payload: { ...r.payload, orderReference: raw } }, actor)).status,
        'conflict',
      );
    }
    const replay = completed(await h.run(r, actor), 'accepted');
    assert.equal(replay.executionId, first.executionId);
    for (const raw of [
      'کالا-PO-012',
      'کالاPO-12',
      'کالا_PO-12',
      'کالا-PO-1 2',
      'کالا-PO-12\u200c',
      '\u00a0کالا-PO-12',
      'کالا-ＰＯ-12',
      'کالا-PO–12',
    ]) {
      assert.notEqual(normalizeOrderReference(raw), normalizeOrderReference(' کالا-PO-۱۲ '));
      assert.equal(
        await h.query('GetOperationalPurchaseOrderByReference', { orderReference: raw }, actor),
        undefined,
      );
      completed(
        await h.run(withPayload(r, { ...r.payload, orderReference: raw }), actor),
        'accepted',
      );
    }
    const changedTarget = { ...r, target: { ...r.target, id: randomUUID() } };
    assert.equal((await h.run(changedTarget, actor)).status, 'conflict');
    completed(
      await h.run({ ...r, idempotency_key: randomUUID() }, actor),
      'rejected',
      'GUARD_IDEMPOTENT_DUP',
    );
    completed(
      await h.run(
        {
          ...r,
          idempotency_key: randomUUID(),
          payload: { ...r.payload, orderReference: 'کالا-po-12' },
        },
        actor,
      ),
      'rejected',
      'GUARD_CONFLICT',
    );
  });
});
void test('A05: all seven required fields and optional null/blank/wrong types reject durably without partial orders', async () => {
  await withDatabase(async (db) => {
    const { actor, h, material } = await seed(db);
    const template = orderCommand(material);
    let attempted = 0;
    for (const key of ['orderReference', 'registrationDateJalali']) {
      const p = { ...template.payload };
      delete p[key];
      const r = withPayload(template, p);
      completed(await h.run(r, actor), 'rejected', 'GUARD_INVARIANT');
      completed(await h.run(r, actor), 'rejected', 'GUARD_INVARIANT');
      attempted++;
    }
    for (const key of [
      'materialTypeOptionId',
      'widthM',
      'thicknessMm',
      'unitWeightKg',
      'orderedUnitCount',
    ]) {
      const line = { ...lines(template)[0]! };
      delete line[key];
      completed(
        await h.run(withPayload(template, { ...template.payload, lines: [line] }), actor),
        'rejected',
        'GUARD_INVARIANT',
      );
      attempted++;
    }
    for (const key of [
      'itemNumber',
      'colorOptionId',
      'ralColorNumber',
      'lengthM',
      'qualityGradeOptionId',
    ])
      for (const value of [null, '', 7]) {
        completed(
          await h.run(
            withPayload(template, {
              ...template.payload,
              lines: [{ ...lines(template)[0]!, [key]: value }],
            }),
            actor,
          ),
          'rejected',
          'GUARD_INVARIANT',
        );
        attempted++;
      }
    const count = await inboundCounts(db);
    assert.equal(count.orders, 0);
    assert.equal(count.lines, 0);
    assert.equal(count.outcomes, attempted + 1);
    const unknown = withPayload(template, {
      ...template.payload,
      lines: [{ ...lines(template)[0]!, driver: 'not-in-I1' }],
    });
    assert.equal((await h.run(unknown, actor)).status, 'admission-denied');
    assert.equal(
      (await h.run(withPayload(template, { ...template.payload, lines: {} }), actor)).status,
      'admission-denied',
    );
  });
});
void test('A05/A18: missing, wrong-kind and foreign catalogue selection share a safe state rejection', async () => {
  await withDatabase(async (db) => {
    const { actor, h, material } = await seed(db);
    const other = await inboundPeople(db, randomUUID());
    const oh = inboundHarness(db, other.identity),
      foreign = optionCommand();
    completed(await oh.run(foreign, await other.proc.actor()), 'accepted');
    const color = optionCommand('COLOR', 'other');
    completed(await h.run(color, actor), 'accepted');
    for (const id of [randomUUID(), foreign.target.id, color.target.id])
      completed(await h.run(orderCommand(id), actor), 'rejected', 'GUARD_STATE');
    completed(await h.run(orderCommand(material), actor), 'accepted');
  });
});
void test('A10/A11/A13/A28/R1-T12: both roles all three kinds, exact labels and separately durable reusable options', async () => {
  await withDatabase(async (db) => {
    const { people, actor, h, material } = await seed(db);
    for (const role of [people.proc, people.wh])
      for (const kind of ['MATERIAL_TYPE', 'QUALITY_GRADE', 'COLOR']) {
        const r = optionCommand(kind, kind + ' ' + role.id);
        completed(await h.run(r, await role.actor()), 'accepted');
        const other = role === people.proc ? people.wh : people.proc;
        const q = (await h.query(
          'ListInboundCatalogueOptions',
          { catalogue: kind, exactLabel: r.payload.label },
          await other.actor(),
        )) as { items: { optionId: string }[] };
        assert.equal(q.items[0]?.optionId, r.target.id);
      }
    for (const label of [
      'PO-12',
      ' po-۱۲ ',
      'PO-١٢',
      'كالا',
      'کالا',
      'ي',
      'ی',
      'é',
      'e\u0301',
      'الف\u200cب',
      '<script>"\\',
    ])
      completed(await h.run(optionCommand('COLOR', label), await people.wh.actor()), 'accepted');
    const unused = optionCommand('MATERIAL_TYPE', 'Unused succeeds');
    completed(await h.run(unused, actor), 'accepted');
    completed(
      await h.run(
        orderCommand(unused.target.id, {
          payload: { ...orderCommand(material).payload, registrationDateJalali: '1404-12-30' },
        }),
        actor,
      ),
      'rejected',
      'GUARD_INVARIANT',
    );
    const duplicate = optionCommand('MATERIAL_TYPE', 'Unused succeeds');
    completed(await h.run(duplicate, await people.wh.actor()), 'rejected', 'GUARD_IDEMPOTENT_DUP');
    assert.equal((await h.run(duplicate, actor)).status, 'conflict');
    completed(await h.run(duplicate, await people.wh.actor()), 'rejected', 'GUARD_IDEMPOTENT_DUP');
    const q = (await h.query(
      'ListInboundCatalogueOptions',
      { catalogue: 'MATERIAL_TYPE', exactLabel: 'Unused succeeds' },
      await people.wh.actor(),
    )) as { items: { optionId: string }[] };
    assert.equal(q.items[0]?.optionId, unused.target.id);
    const attribution = await db.owner.query<{
      issuer: string;
      subject: string;
      actor_role: string;
      recorded_at: Date;
    }>(
      'SELECT issuer,subject,actor_role,recorded_at FROM procurement.inbound_catalogue_option WHERE option_id=$1',
      [unused.target.id],
    );
    assert.equal(attribution.rows[0]?.subject, actor.principal.subject);
    assert.equal(attribution.rows[0]?.actor_role, 'ACT-PROC');
    assert.ok(attribution.rows[0]?.recorded_at instanceof Date);
  });
});
void test('A03/A12: distinct people race equivalent POs and exact catalogue values at real owner-lock barriers', async () => {
  await withDatabase(async (db) => {
    const { people, actor, h, material } = await seed(db);
    const second = await people.proc2.actor();
    for (const scenario of ['order', 'option']) {
      const gate = rendezvous();
      const store = new PostgresInboundStore();
      const s = wrapper(store, {
        lock: async (ctx, resources) => {
          await gate.enter();
          await store.lock(ctx, resources);
        },
      });
      const raced = inboundHarness(db, people.identity, { store: s });
      const one =
        scenario === 'order' ? orderCommand(material) : optionCommand('COLOR', 'same exact');
      const two =
        scenario === 'order'
          ? withPayload(one, { ...one.payload, orderReference: 'po-١٢' })
          : optionCommand('COLOR', 'same exact');
      const pending = Promise.all([raced.run(one, actor), raced.run(two, second)]);
      void pending.catch(() => undefined);
      const timer = setTimeout(() => gate.release(), 8000);
      try {
        await gate.arrived;
        gate.release();
        const result = await pending;
        assert.equal(
          result.filter((x) => x.status === 'completed' && x.result.outcome === 'accepted').length,
          1,
        );
        const rejected = result.find(
          (x) => x.status === 'completed' && x.result.outcome === 'rejected',
        )!;
        completed(
          rejected,
          'rejected',
          scenario === 'order' ? 'GUARD_CONFLICT' : 'GUARD_IDEMPOTENT_DUP',
        );
      } finally {
        clearTimeout(timer);
        gate.release();
        await pending;
      }
    }
    const c = await inboundCounts(db);
    assert.equal(c.orders, 1);
    assert.equal(c.lines, 1);
    assert.equal(c.options, 2);
    assert.equal(c.foreign, 0);
    completed(
      await h.run(
        orderCommand(material, {
          payload: { ...orderCommand(material).payload, orderReference: 'independent' },
        }),
        actor,
      ),
      'accepted',
    );
  });
});
void test('A18/A19/A20: deny forged, copied, unrelated and revoked identities; cross-role same-person catalogue replay retains creator', async () => {
  await withDatabase(async (db) => {
    const { people, actor, h, material } = await seed(db);
    const r = orderCommand(material);
    completed(await h.run(r, actor), 'accepted');
    for (const bad of [
      await people.wh.actor(),
      await people.sec.actor(),
      Object.freeze({ ...actor }),
      Object.freeze({ ...actor, customerScope: 'foreign' }),
    ])
      assert.equal((await h.run(r, bad)).status, 'admission-denied');
    await assert.rejects(
      h.query('GetOperationalPurchaseOrder', { orderId: r.target.id }, await people.sec.actor()),
      guard('GUARD_ACTOR'),
    );
    const customer = await people.person('ACT-CUST');
    await assert.rejects(
      h.query('ListInboundCatalogueOptions', { catalogue: 'COLOR' }, await customer.actor()),
      guard('GUARD_ACTOR'),
    );
    const other = await inboundPeople(db, randomUUID());
    assert.equal(
      await inboundHarness(db, other.identity).query(
        'GetOperationalPurchaseOrder',
        { orderId: r.target.id },
        await other.wh.actor(),
      ),
      undefined,
    );
    await db.owner.query(
      "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$1,'ACT-WH','')",
      [people.factory, people.proc.id],
    );
    const option = optionCommand('COLOR', 'same person role switch');
    const first = completed(await h.run(option, actor), 'accepted');
    const switched = await people.identity.context(people.proc.token, 'ACT-WH');
    const replay = completed(await h.run(option, switched), 'accepted');
    assert.equal(replay.executionId, first.executionId);
    await db.owner.query(
      "DELETE FROM identity.role_grant WHERE installation_id=$1 AND account_id=$2 AND actor_role='ACT-PROC'",
      [people.factory, people.proc.id],
    );
    assert.equal((await h.run(r, actor)).status, 'admission-denied');
    await assert.rejects(
      h.query('GetOperationalPurchaseOrder', { orderId: r.target.id }, actor),
      guard('GUARD_ACTOR'),
    );
  });
});
void test('A22/A23/A28: business failure after all tentative lines rolls back only the order and retains independent catalogue outcome', async () => {
  await withDatabase(async (db) => {
    const { people, actor, material } = await seed(db);
    const store = new PostgresInboundStore();
    const failed = inboundHarness(db, people.identity, {
      store: wrapper(store, {
        insertOrder: async (...args) => {
          await store.insertOrder(...args);
          throw new BusinessRejection({
            family: 'GUARD_STATE',
            message: 'Injected after tentative lines',
          });
        },
      }),
    });
    const r = orderCommand(material);
    completed(await failed.run(r, actor), 'rejected', 'GUARD_STATE');
    const c = await inboundCounts(db);
    assert.equal(c.orders, 0);
    assert.equal(c.lines, 0);
    assert.equal(c.options, 1);
    assert.equal(c.outcomes, 2);
    assert.equal(c.audits, 2);
    assert.equal(c.foreign, 0);
    const normal = inboundHarness(db, people.identity);
    completed(await normal.run(r, actor), 'rejected', 'GUARD_STATE');
    completed(await normal.run(orderCommand(material), actor), 'accepted');
  });
});
void test('A23: audit and outcome persistence failures roll back complete order bundle, original retry succeeds', async () => {
  await withDatabase(async (db) => {
    const { people, actor, material } = await seed(db);
    for (const failure of ['audits', 'outcomes'] as const) {
      const before = await inboundCounts(db);
      const ports =
        failure === 'audits'
          ? {
              audits: {
                append: () => Promise.reject(new Error('injected audit persistence failure')),
              },
            }
          : {
              outcomes: {
                find: db.outcomes.find.bind(db.outcomes),
                insert: () => Promise.reject(new Error('injected outcome persistence failure')),
              },
            };
      const h = inboundHarness(db, people.identity, { ports });
      const r = orderCommand(material, {
        payload: { ...orderCommand(material).payload, orderReference: failure },
      });
      assert.equal((await h.run(r, actor)).status, 'technical');
      assert.deepEqual(await inboundCounts(db), before);
      completed(await inboundHarness(db, people.identity).run(r, actor), 'accepted');
    }
  });
});
void test('A21: genuine lost PostgreSQL COMMIT reply recovers original PO command without duplicate source or effects', async () => {
  await withDatabase(async (db) => {
    const { people, actor, material } = await seed(db);
    const proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL!);
    const pool = new Pool({ connectionString: proxy.url, max: 2 });
    pool.on('error', () => undefined);
    try {
      const tx = new PostgresTransactions(pool);
      const h = inboundHarness(db, people.identity, { ports: { transactions: tx } });
      const r = orderCommand(material);
      const first = await h.run(r, actor);
      assert.equal(first.status, 'technical');
      if (first.status === 'technical') assert.equal(first.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      const after = await inboundCounts(db);
      assert.equal(after.orders, 1);
      assert.equal(after.lines, 1);
      const recovery = inboundHarness(db, people.identity);
      completed(await recovery.run(r, actor), 'accepted');
      const c = await inboundCounts(db);
      assert.equal(c.orders, 1);
      assert.equal(c.lines, 1);
      assert.equal(c.outcomes, 2);
      assert.equal(c.foreign, 0);
    } finally {
      await pool.end();
      await proxy.close();
    }
  });
});
void test('A21/A28: genuine lost catalogue COMMIT reply recovers independently before order registration', async () => {
  await withDatabase(async (db) => {
    const people = await inboundPeople(db),
      actor = await people.wh.actor();
    const proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL!);
    const pool = new Pool({ connectionString: proxy.url, max: 2 });
    pool.on('error', () => undefined);
    try {
      const h = inboundHarness(db, people.identity, {
        ports: { transactions: new PostgresTransactions(pool) },
      });
      const r = optionCommand();
      assert.equal((await h.run(r, actor)).status, 'technical');
      assert.equal(proxy.commitConfirmed(), true);
      const recovery = inboundHarness(db, people.identity);
      completed(await recovery.run(r, actor), 'accepted');
      completed(
        await recovery.run(orderCommand(r.target.id), await people.proc.actor()),
        'accepted',
      );
      const c = await inboundCounts(db);
      assert.equal(c.options, 1);
      assert.equal(c.orders, 1);
      assert.equal(c.foreign, 0);
    } finally {
      await pool.end();
      await proxy.close();
    }
  });
});
void test('A26: preflight full projection rejects before business-source persistence; 128 minimal lines remain readable', async () => {
  await withDatabase(async (db) => {
    const { actor, h, material } = await seed(db);
    const colors = optionCommand('COLOR', '😀'.repeat(128)),
      quality = optionCommand('QUALITY_GRADE', '😀'.repeat(128));
    completed(await h.run(colors, actor), 'accepted');
    completed(await h.run(quality, actor), 'accepted');
    const bigType = optionCommand('MATERIAL_TYPE', '😀'.repeat(128));
    completed(await h.run(bigType, actor), 'accepted');
    const base = orderCommand(material);
    const line = {
      ...lines(base)[0]!,
      materialTypeOptionId: bigType.target.id,
      colorOptionId: colors.target.id,
      qualityGradeOptionId: quality.target.id,
      itemNumber: '😀'.repeat(128),
      ralColorNumber: '😀'.repeat(128),
    };
    const r = withPayload(base, {
      ...base.payload,
      lines: Array.from({ length: 128 }, () => ({ ...line })),
    });
    const before = await inboundCounts(db);
    const rejected = completed(await h.run(r, actor), 'rejected', 'GUARD_INVARIANT');
    assert.equal(rejected.result.message, 'I1_ORDER_PROJECTION_LIMIT');
    const after = await inboundCounts(db);
    assert.equal(after.orders, before.orders);
    assert.equal(after.lines, before.lines);
    const good = withPayload(base, {
      ...base.payload,
      lines: Array.from({ length: 128 }, () => ({ ...lines(base)[0]! })),
    });
    completed(await h.run(good, actor), 'accepted');
    const projection = await h.query(
      'GetOperationalPurchaseOrder',
      { orderId: good.target.id },
      actor,
    );
    assert.ok(Buffer.byteLength(JSON.stringify({ data: projection })) <= 262144);
    assert.equal((projection as InboundOrderProjection).lines.length, 128);
    const bad = withPayload(base, {
      ...base.payload,
      lines: Array.from({ length: 129 }, () => ({ ...lines(base)[0]! })),
    });
    completed(await h.run(bad, actor), 'rejected', 'GUARD_INVARIANT');
  });
});

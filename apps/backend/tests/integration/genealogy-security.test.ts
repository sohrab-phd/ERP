import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import {
  BusinessRejection,
  type ExecutionContext,
  type TransactionContext,
} from '@navard/shared-kernel';
import { PostgresInventoryStore } from '../../src/infrastructure/postgresql/inventory-store.js';
import { PostgresIdentityStore } from '../../src/infrastructure/postgresql/identity-store.js';
import { transactionClient } from '../../src/infrastructure/postgresql/transaction.js';
import type { GenealogyReference, GenealogyTrace } from '../../src/modules/genealogy/index.js';
import type { HumanRole } from '../../src/modules/identity/index.js';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import { productionApp, productionCommand } from '../support/production-harness.js';
import { shippingApp } from '../support/shipping-harness.js';
import { completed, installation } from '../support/receipt-harness.js';
import { salesCommand, follow } from '../support/sales-harness.js';

type App = Awaited<ReturnType<typeof shippingApp>>;
const actorDenied = (error: unknown) =>
  error instanceof BusinessRejection && error.rejection.family === 'GUARD_ACTOR';

async function grant(h: App, token: string, role: HumanRole, enabled = true) {
  const self = await h.app.identity.session(token);
  await h.app.identity.setGrant(h.warehouse.tokens.get('ACT-SEC')!, {
    accountId: self.accountId,
    actorRole: role,
    customerScope: h.people.customerId,
    enabled,
  });
}

/** Digests detect changed values as well as new rows without exposing bindings or source payloads. */
async function durableSources(db: DatabaseFixture) {
  const tables = [
    'inventory.unit',
    'inventory.material_lot',
    'inventory.ledger',
    'inventory.balance',
    'inventory.reservation',
    'inventory.reservation_request',
    'inventory.production_issue',
    'inventory.production_origin',
    'procurement.goods_receipt',
    'production.production_order',
    'production.operation',
    'production.allocation',
    'production.source_fact',
    'production.product_batch',
    'production.route_snapshot',
    'shipping.package',
    'shipping.package_content',
    'shipping.shipment',
    'shipping.dispatch',
    'sales.customer',
    'sales.sales_order',
    'sales.fulfillment_assessment',
    'sales.make_reference',
    'kernel.audit_event',
    'kernel.command_outcome',
    'identity.security_event',
  ] as const;
  const result: Record<string, string> = {};
  for (const table of tables) {
    const rows = await db.owner.query<{ digest: string }>(
      `SELECT md5(COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text,'[]')) AS digest FROM ${table} t`,
    );
    assert.ok(rows.rows[0]);
    result[table] = rows.rows[0].digest;
  }
  return result;
}

async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Fixture barrier deadline')), 3000);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Instrument original methods only: every owner/identity SELECT still executes against PostgreSQL. */
function pauseUnitRead(t: TestContext, actor: ExecutionContext) {
  let entered: () => void = () => undefined;
  const reached = new Promise<void>((resolve) => {
    entered = resolve;
  });
  let resume: () => void = () => undefined;
  const continuation = new Promise<void>((resolve) => {
    resume = resolve;
  });
  let captured: TransactionContext | undefined;
  let released = false;
  const phases: string[] = [];
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Invoked below with the actual adapter as this via call.
  const unit = PostgresInventoryStore.prototype.traceUnit;
  t.mock.method(
    PostgresInventoryStore.prototype,
    'traceUnit',
    async function (this: PostgresInventoryStore, ...args: Parameters<typeof unit>) {
      const result = await unit.call(this, ...args);
      if (captured === undefined && args[0].actor === actor) {
        captured = args[0].transaction;
        const client = transactionClient(captured);
        const release = client.release.bind(client);
        t.mock.method(client, 'release', (...values: Parameters<typeof release>) => {
          released = true;
          release(...values);
        });
        entered();
        await continuation;
      }
      return result;
    },
  );
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Invoked below with the actual adapter as this via call.
  const current = PostgresIdentityStore.prototype.currentGrant;
  t.mock.method(
    PostgresIdentityStore.prototype,
    'currentGrant',
    function (this: PostgresIdentityStore, ...args: Parameters<typeof current>) {
      if (args[3] === actor.principal.subject) {
        assert.equal(args[5], undefined, 'Trace authority must use a fresh non-snapshot read');
        phases.push(
          captured === undefined ? 'before-snapshot' : released ? 'after-release' : 'held',
        );
      }
      return current.call(this, ...args);
    },
  );
  return {
    reached,
    resume,
    phases,
    context() {
      assert.ok(captured);
      return captured;
    },
    isReleased: () => released,
  };
}

async function readyShipment(h: App) {
  const unitId = await h.stock();
  const order = await h.order([unitId]);
  const reservation = await h.claim(order.orderId, order.itemId, unitId);
  return { unitId, ...(await h.ready(order.orderId, [reservation.target.id])) };
}

void test('Genealogy authenticates exact customer roles and rejects copied, unsupported, organizational and foreign actors without writes', async () => {
  await withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare();
      const c = h.complete(p.ops[0]!, p.source);
      completed(await h.run(c.input), 'accepted');
      const roots = (
        await db.owner.query<{ receiptId: string; lotId: string }>(
          'SELECT receipt_id AS "receiptId",lot_id AS "lotId" FROM inventory.material_lot WHERE unit_id=$1',
          [p.source],
        )
      ).rows[0];
      assert.ok(roots);
      const facts = (
        await db.owner.query<{ id: string; batchId: string }>(
          `SELECT fact_id AS id,data->>'productBatchId' AS "batchId" FROM production.source_fact WHERE kind='OUTPUT' AND operation_id=$1`,
          [p.ops[0]],
        )
      ).rows[0];
      assert.ok(facts);
      const whToken = h.warehouse.tokens.get('ACT-WH')!;
      const secToken = h.warehouse.tokens.get('ACT-SEC')!;
      await grant(h, whToken, 'ACT-WH');
      await grant(h, secToken, 'ACT-SEC');
      await grant(h, h.people.tokens.get('first')!, 'ACT-CUST');
      await grant(h, h.people.tokens.get('first')!, 'ACT-FIN');
      const wh = await h.app.identity.context(whToken, 'ACT-WH', h.people.customerId);
      const sec = await h.app.identity.context(secToken, 'ACT-SEC', h.people.customerId);
      const customer = await h.app.identity.context(
        h.people.tokens.get('first')!,
        'ACT-CUST',
        h.people.customerId,
      );
      const finance = await h.app.identity.context(
        h.people.tokens.get('first')!,
        'ACT-FIN',
        h.people.customerId,
      );
      const foreign = await h.app.identity.context(
        h.people.tokens.get('foreign')!,
        'ACT-SALES',
        h.people.otherCustomerId,
      );
      const orgSec = await h.app.identity.context(secToken, 'ACT-SEC');
      const references: GenealogyReference[] = [
        { kind: 'UNIT', id: p.source },
        { kind: 'UNIT', id: c.outId },
        { kind: 'LOT', id: roots.lotId },
        { kind: 'RECEIPT', id: roots.receiptId },
        { kind: 'FACT', id: facts.id },
        { kind: 'OPERATION', id: p.ops[0]! },
        { kind: 'ORDER', id: p.orderId },
        { kind: 'BATCH', id: facts.batchId },
        { kind: 'SALES_ORDER', id: p.salesOrderId },
      ];
      const before = await durableSources(db);
      for (const reader of [h.actor, wh, sec]) {
        const trace = await h.app.genealogyQuery(
          'TraceBackward',
          { kind: 'UNIT', id: c.outId },
          reader,
        );
        assert.ok(trace?.nodes.some((n) => n.id === p.source));
        assert.ok(trace?.nodes.some((n) => n.id === roots.receiptId));
        const text = JSON.stringify(trace);
        assert.doesNotMatch(
          text,
          /"(?:binding|orderBinding|actorIssuer|actorSubject|dispatchIssuer|dispatchSubject|command_key|token|password|customerScope)"/u,
        );
      }
      for (const ref of references) {
        assert.equal(await h.app.genealogyQuery('TraceForward', ref, foreign), undefined);
        assert.equal(await h.app.genealogyQuery('TraceBackward', ref, foreign), undefined);
      }
      for (const reader of [
        { ...h.actor },
        { ...h.actor, temporary: true },
        { ...h.actor, actorRole: 'ACT-QC' },
        { ...foreign, customerScope: h.people.customerId },
        { ...h.actor, principal: { ...h.actor.principal, subject: randomUUID() } },
        h.wh,
        orgSec,
        h.planner,
        h.operator,
        h.ship,
        customer,
        finance,
      ] as ExecutionContext[]) {
        await assert.rejects(
          h.app.genealogyQuery('TraceForward', { kind: 'UNIT', id: p.source }, reader),
          actorDenied,
        );
      }
      assert.equal(
        await h.app.genealogyQuery('TraceForward', { kind: 'UNIT', id: randomUUID() }, h.actor),
        undefined,
      );
      assert.deepEqual(await durableSources(db), before);
    } finally {
      await h.app.stop();
    }
  });
});

void test('Genealogy HTTP preserves scoped results and rejects selector, role, Origin, body, route and revoked-session attacks safely', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const ready = await readyShipment(h);
      await h.app.start();
      const address = h.app.server.address();
      assert.ok(address && typeof address !== 'string');
      const base = 'http://127.0.0.1:' + address.port;
      const path = '/genealogy/forward/unit/' + ready.unitId;
      const headers = {
        authorization: 'Bearer ' + h.people.tokens.get('first')!,
        'x-customer-id': h.people.customerId,
      };
      const call = (url = path, extra: Record<string, string> = {}, method = 'GET') =>
        fetch(base + url, { method, headers: { ...headers, ...extra } });
      const before = await durableSources(db);
      const visible = await call();
      assert.equal(visible.status, 200);
      assert.equal(visible.headers.get('cache-control'), 'no-store');
      assert.equal(visible.headers.get('x-content-type-options'), 'nosniff');
      const data = ((await visible.json()) as { data: GenealogyTrace }).data;
      assert.ok(data.nodes.some((n) => n.id === ready.pack.target.id));
      assert.ok(!data.nodes.some((n) => n.id === ready.shipment.target.id));
      assert.doesNotMatch(
        JSON.stringify(data),
        /"(?:binding|orderBinding|token|password|issuer|subject)"/u,
      );
      for (const [url, extra, method, expected] of [
        [path, { 'x-customer-id': h.people.otherCustomerId }, 'GET', 403],
        [
          path,
          {
            authorization: 'Bearer ' + h.people.tokens.get('foreign')!,
            'x-customer-id': h.people.otherCustomerId,
          },
          'GET',
          404,
        ],
        [path, { authorization: 'Bearer ' + h.warehouse.tokens.get('ACT-WH')! }, 'GET', 403],
        [path, { authorization: 'Bearer ' + h.warehouse.tokens.get('ACT-SEC')! }, 'GET', 403],
        [path, { authorization: 'Bearer ' + h.people.tokens.get('ship-first')! }, 'GET', 403],
        [path, { authorization: 'Bearer invalid' }, 'GET', 401],
        [path, { 'x-customer-id': '' }, 'GET', 403],
        [path, { 'x-customer-id': 'all' }, 'GET', 403],
        [path, { 'x-erp-role': 'ACT-SEC' }, 'GET', 403],
        [path, { origin: 'https://untrusted.invalid' }, 'GET', 403],
        [path + '?customerId=' + h.people.otherCustomerId, {}, 'GET', 404],
        ['/genealogy/backward/UNIT/' + ready.unitId, {}, 'GET', 404],
        ['/genealogy/forward/unit/not-a-uuid', {}, 'GET', 404],
        [path, {}, 'POST', 405],
      ] as [string, Record<string, string>, string, number][]) {
        const response = await call(url, extra, method);
        assert.equal(response.status, expected);
        const text = await response.text();
        assert.doesNotMatch(text, /(?:binding|password|token_digest|SELECT|postgresql:)/u);
        assert.ok(!text.includes(ready.unitId));
      }
      const raw = async (extra: string[], body?: string) => {
        return new Promise<number>((resolve, reject) => {
          const req = httpRequest(
            base + path,
            {
              method: 'GET',
              headers: [
                'host',
                new URL(base).host,
                'authorization',
                headers.authorization,
                'x-customer-id',
                headers['x-customer-id'],
                ...extra,
              ],
            },
            (response) => {
              response.resume();
              response.on('end', () => resolve(response.statusCode!));
            },
          );
          req.on('error', reject);
          req.end(body);
        });
      };
      assert.equal(await raw(['x-customer-id', h.people.otherCustomerId]), 403);
      assert.equal(await raw(['content-length', '1'], 'x'), 400);
      assert.deepEqual(await durableSources(db), before);
      const self = await h.app.identity.session(h.people.tokens.get('first')!);
      await h.app.identity.revokeSessions(h.warehouse.tokens.get('ACT-SEC')!, self.accountId);
      const revoked = await call();
      assert.equal(revoked.status, 401);
      assert.deepEqual(await revoked.json(), { error: 'unauthenticated' });
      await assert.rejects(
        h.app.genealogyQuery('TraceForward', { kind: 'UNIT', id: ready.unitId }, h.actor),
        actorDenied,
      );
    } finally {
      await h.app.stop();
    }
  });
});

void test('shared origin exposes only the selected customer branch before row bounds, even with 257 foreign facts', async () => {
  await withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const own = await h.prepare();
      const output = h.complete(own.ops[0]!, own.source);
      completed(await h.run(output.input), 'accepted');
      const foreignSales = await h.app.identity.context(
        h.people.tokens.get('foreign')!,
        'ACT-SALES',
        h.people.otherCustomerId,
      );
      const foreignSelf = await h.app.identity.session(h.people.tokens.get('foreign-op')!);
      await h.app.identity.setGrant(h.warehouse.tokens.get('ACT-SEC')!, {
        accountId: foreignSelf.accountId,
        actorRole: 'ACT-PLAN',
        customerScope: h.people.otherCustomerId,
        enabled: true,
      });
      const foreignPlanner = await h.app.identity.context(
        h.people.tokens.get('foreign-op')!,
        'ACT-PLAN',
        h.people.otherCustomerId,
      );
      const draft = salesCommand(h.people.otherCustomerId);
      const item = (draft.payload.items as { id: string }[])[0]!;
      const salesRun = async (input: Parameters<typeof h.app.command>[0]) =>
        h.app.command(input, foreignSales);
      completed(await salesRun(JSON.stringify(draft)), 'accepted');
      completed(await salesRun(JSON.stringify(follow(draft, 'SubmitSalesOrder'))), 'accepted');
      const assessment = {
        ...follow(draft, 'DraftFulfillmentAssessment', { orderId: draft.target.id }),
        target: { kind: 'fulfillment-assessment', id: randomUUID() },
      };
      completed(await salesRun(JSON.stringify(assessment)), 'accepted');
      completed(
        await salesRun(JSON.stringify(follow(assessment, 'RecordFulfillmentMake'))),
        'accepted',
      );
      completed(
        await salesRun(
          JSON.stringify(
            follow(draft, 'ConfirmSalesOrder', { assessmentId: assessment.target.id }),
          ),
        ),
        'accepted',
      );
      const foreignOrder = randomUUID(),
        foreignOperation = randomUUID();
      for (const command of [
        productionCommand('DraftProductionOrder', foreignOrder, {
          salesOrderId: draft.target.id,
          itemId: item.id,
        }),
        productionCommand('PlanProductionOrder', foreignOrder, {
          route: [{ id: foreignOperation, station: 'HEAVY_ROLL_OPENER' }],
        }),
        productionCommand('ReleaseProductionOrder', foreignOrder),
      ])
        completed(await h.app.command(JSON.stringify(command), foreignPlanner), 'accepted');
      completed(
        await h.app.command(
          JSON.stringify(productionCommand('StartProductionOrder', foreignOrder)),
          h.foreign,
        ),
        'accepted',
      );
      completed(
        await h.app.command(
          JSON.stringify(productionCommand('StartProductionOperation', foreignOperation)),
          h.foreign,
        ),
        'accepted',
      );
      const foreignChild = await h.stock('1');
      const foreignFacts = Array.from({ length: 257 }, () => randomUUID());
      // Diagnostic historical-source fixture, not a new posting policy: real customer/order/operation
      // bindings and IN_PROGRESS trigger checks remain enabled. It deliberately models shared-origin
      // evidence; no command bypass is asserted as an accepted production workflow.
      const insertForeign = (ids: string[]) =>
        db.owner.query(
          `INSERT INTO production.source_fact(installation_id,authority_scope,customer_id,fact_id,order_id,operation_id,kind,data,issuer,subject,command_key,actor_role)
         SELECT $1::uuid,$1::uuid,$2::uuid,entry.value::uuid,$3::uuid,$4::uuid,'OUTPUT',$7::jsonb,$8::text,$5::text,'fixture-shared-origin','ACT-OP'
         FROM jsonb_array_elements_text($6::jsonb) entry(value)`,
          [
            installation,
            h.people.otherCustomerId,
            foreignOrder,
            foreignOperation,
            h.foreign.principal.subject,
            JSON.stringify(ids),
            JSON.stringify({
              unitId: foreignChild,
              sourceUnitIds: [own.source],
              kg: '1',
              kind: 'COIL',
              locationId: randomUUID(),
              disposition: 'WIP',
            }),
            h.foreign.principal.issuer,
          ],
        );
      assert.equal((await insertForeign(foreignFacts.slice(0, 1))).rowCount, 1);
      const foreignTrace = await h.app.genealogyQuery(
        'TraceForward',
        { kind: 'UNIT', id: own.source },
        foreignSales,
      );
      assert.ok(foreignTrace?.nodes.some((n) => n.id === foreignChild));
      assert.ok(!foreignTrace?.nodes.some((n) => n.id === output.outId));
      assert.equal((await insertForeign(foreignFacts.slice(1))).rowCount, 256);
      const origin = (
        await db.owner.query<{ lotId: string; receiptId: string }>(
          'SELECT lot_id AS "lotId",receipt_id AS "receiptId" FROM inventory.material_lot WHERE unit_id=$1',
          [own.source],
        )
      ).rows[0];
      assert.ok(origin);
      const before = await durableSources(db);
      for (const ref of [
        { kind: 'UNIT', id: own.source },
        { kind: 'LOT', id: origin.lotId },
        { kind: 'RECEIPT', id: origin.receiptId },
      ] as const) {
        const trace = await h.app.genealogyQuery('TraceForward', ref, h.actor);
        assert.ok(trace?.nodes.some((n) => n.id === output.outId));
        const text = JSON.stringify(trace);
        for (const id of [
          foreignChild,
          foreignOrder,
          foreignOperation,
          draft.target.id,
          ...foreignFacts,
        ])
          assert.ok(!text.includes(id));
      }
      const backward = await h.app.genealogyQuery(
        'TraceBackward',
        { kind: 'UNIT', id: output.outId },
        h.actor,
      );
      assert.ok(backward?.nodes.some((n) => n.id === origin.receiptId));
      assert.ok(!JSON.stringify(backward).includes(foreignChild));
      assert.deepEqual(await durableSources(db), before);
    } finally {
      await h.app.stop();
    }
  });
});

void test('Genealogy returns one coherent old snapshot during real concurrent dispatch, then the complete new snapshot after release', async (t) => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    let barrier: ReturnType<typeof pauseUnitRead> | undefined;
    let pending: Promise<GenealogyTrace | undefined> | undefined;
    try {
      const ready = await readyShipment(h);
      const expectedOld = await h.app.genealogyQuery(
        'TraceForward',
        { kind: 'UNIT', id: ready.unitId },
        h.actor,
      );
      barrier = pauseUnitRead(t, h.actor);
      pending = h.app.genealogyQuery('TraceForward', { kind: 'UNIT', id: ready.unitId }, h.actor);
      void pending.catch(() => undefined);
      await bounded(barrier.reached);
      const readContext = barrier.context();
      const mode = await transactionClient(readContext).query<{
        isolation: string;
        readOnly: string;
      }>(
        `SELECT current_setting('transaction_isolation') AS isolation,current_setting('transaction_read_only') AS "readOnly"`,
      );
      assert.deepEqual(mode.rows[0], { isolation: 'repeatable read', readOnly: 'on' });
      completed(await h.run(ready.dispatch), 'accepted');
      const afterDispatch = await durableSources(db);
      barrier.resume();
      const old = await bounded(pending);
      assert.ok(old);
      assert.deepEqual(old, expectedOld);
      assert.ok(!old.edges.some((e) => e.kind === 'DISPATCH'));
      assert.ok(!old.nodes.some((n) => n.id === ready.shipment.target.id));
      assert.notEqual(old.nodes.find((n) => n.id === ready.unitId)?.state, 'SHIPPED');
      assert.equal(barrier.isReleased(), true);
      assert.deepEqual(barrier.phases.slice(-2), ['before-snapshot', 'after-release']);
      assert.throws(() => transactionClient(readContext));
      assert.deepEqual(await durableSources(db), afterDispatch);
      const fresh = await h.app.genealogyQuery(
        'TraceForward',
        { kind: 'UNIT', id: ready.unitId },
        h.actor,
      );
      assert.ok(fresh?.edges.some((e) => e.kind === 'DISPATCH'));
      assert.equal(fresh?.nodes.find((n) => n.id === ready.unitId)?.state, 'SHIPPED');
      assert.equal(
        fresh?.nodes.find((n) => n.id === ready.shipment.target.id)?.state,
        'DISPATCHED',
      );
      assert.deepEqual(await durableSources(db), afterDispatch);
    } finally {
      barrier?.resume();
      if (pending) await pending.catch(() => undefined);
      t.mock.restoreAll();
      await h.app.stop();
    }
  });
});

void test('Genealogy freshly denies grant revoked during its old read snapshot and releases before the final authority query', async (t) => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    let barrier: ReturnType<typeof pauseUnitRead> | undefined;
    let pending: Promise<GenealogyTrace | undefined> | undefined;
    try {
      const ready = await readyShipment(h);
      barrier = pauseUnitRead(t, h.actor);
      pending = h.app.genealogyQuery('TraceBackward', { kind: 'UNIT', id: ready.unitId }, h.actor);
      const denial = assert.rejects(pending, actorDenied);
      void denial.catch(() => undefined);
      await bounded(barrier.reached);
      const readContext = barrier.context();
      await grant(h, h.people.tokens.get('first')!, 'ACT-SALES', false);
      const beforeFinish = await durableSources(db);
      const stale = await transactionClient(readContext).query<{ present: boolean }>(
        `SELECT EXISTS(SELECT 1 FROM identity.role_grant g JOIN identity.account a USING(installation_id,account_id) WHERE g.installation_id=$1 AND a.person_id=$2 AND g.actor_role='ACT-SALES' AND g.customer_scope=$3) AS present`,
        [installation, h.actor.principal.subject, h.people.customerId],
      );
      assert.equal(
        stale.rows[0]?.present,
        true,
        'The old snapshot still sees the grant; publication must use a fresh check',
      );
      barrier.resume();
      await bounded(denial);
      assert.equal(barrier.isReleased(), true);
      assert.deepEqual(barrier.phases, ['before-snapshot', 'after-release']);
      assert.throws(() => transactionClient(readContext));
      assert.deepEqual(await durableSources(db), beforeFinish);
      await assert.rejects(
        h.app.genealogyQuery('TraceBackward', { kind: 'UNIT', id: ready.unitId }, h.actor),
        actorDenied,
      );
    } finally {
      barrier?.resume();
      if (pending) await pending.catch(() => undefined);
      t.mock.restoreAll();
      await h.app.stop();
    }
  });
});

void test('real source permission failure returns sanitized HTTP 503, releases the read capability and leaves all source state unchanged', async (t) => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    const role = '"' + db.runtimeRole.replaceAll('"', '""') + '"';
    let revoked = false;
    let captured: TransactionContext | undefined;
    let released = false;
    try {
      const ready = await readyShipment(h);
      await h.app.start();
      const address = h.app.server.address();
      assert.ok(address && typeof address !== 'string');
      // eslint-disable-next-line @typescript-eslint/unbound-method -- Invoked below with the actual adapter as this via call.
      const original = PostgresInventoryStore.prototype.traceUnit;
      t.mock.method(
        PostgresInventoryStore.prototype,
        'traceUnit',
        function (this: PostgresInventoryStore, ...args: Parameters<typeof original>) {
          captured = args[0].transaction;
          const client = transactionClient(captured);
          const release = client.release.bind(client);
          t.mock.method(client, 'release', (...values: Parameters<typeof release>) => {
            released = true;
            release(...values);
          });
          return original.call(this, ...args);
        },
      );
      const before = await durableSources(db);
      await db.owner.query('REVOKE SELECT ON inventory.unit FROM ' + role);
      revoked = true;
      const response = await fetch(
        'http://127.0.0.1:' + address.port + '/genealogy/forward/unit/' + ready.unitId,
        {
          headers: {
            authorization: 'Bearer ' + h.people.tokens.get('first')!,
            'x-customer-id': h.people.customerId,
          },
        },
      );
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: 'unavailable' });
      assert.ok(captured);
      const failedContext = captured;
      assert.equal(released, true);
      assert.throws(() => transactionClient(failedContext));
      assert.deepEqual(await durableSources(db), before);
      await db.owner.query('GRANT SELECT ON inventory.unit TO ' + role);
      revoked = false;
      t.mock.restoreAll();
      const recovered = await h.app.genealogyQuery(
        'TraceForward',
        { kind: 'UNIT', id: ready.unitId },
        h.actor,
      );
      assert.ok(recovered?.nodes.some((n) => n.id === ready.unitId));
      assert.deepEqual(await durableSources(db), before);
    } finally {
      if (revoked) await db.owner.query('GRANT SELECT ON inventory.unit TO ' + role);
      t.mock.restoreAll();
      await h.app.stop();
    }
  });
});

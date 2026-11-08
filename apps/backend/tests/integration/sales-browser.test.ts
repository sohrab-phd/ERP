import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import type { CommandRequest, JsonObject } from '@navard/shared-kernel';
import { withDatabase } from '../support/database-fixture.js';
import { salesBrowserHarness } from '../support/sales-browser-harness.js';
import { salesCommand, follow } from '../support/sales-harness.js';
import { installation, receiptCommand, completed } from '../support/receipt-harness.js';
import { PostgresSalesStore } from '../../src/infrastructure/postgresql/sales-store.js';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';

type Row = Record<string, unknown>;
const object = (v: unknown): Row => {
  assert.ok(v && typeof v === 'object' && !Array.isArray(v));
  return v as Row;
};
async function read(response: Response) {
  const body = object(await response.json());
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const observed = object(body.observation);
  assert.equal(observed.consistency, 'PAGE_SNAPSHOT');
  assert.ok(Date.parse(String(observed.respondedAt)) >= Date.parse(String(observed.snapshotAt)));
  return object(body.data);
}
void test('P4b real browser contracts, exact customer discovery, lifecycle, privacy and durable command compatibility', async (t) =>
  withDatabase(async (db) => {
    const h = await salesBrowserHarness(db);
    try {
      const a = h.client(),
        b = h.client('sales.foreign');
      const self = await a.login();
      await b.login();
      const call = (kind: string, input: unknown = {}, customer = h.people.customerId) =>
        a.call('/sales/v1/' + kind, input, customer);
      const execute = async (input: CommandRequest) => {
        const response = await call('commands', input);
        const body = (await response.json()) as Row;
        assert.equal(response.status, 200, JSON.stringify(body));
        return body;
      };
      await t.test(
        'customer-only Sales bootstrap has bounded marker, tuple and encryption key but no customer/grant array',
        () => {
          assert.deepEqual(self.grants, []);
          assert.equal(self.browser.hasCustomerSales, true);
          assert.equal(self.browser.installationId, installation);
          assert.equal(self.browser.authorityScopeId, installation);
          assert.ok(self.browser.recoveryKey);
          assert.equal(JSON.stringify(self).includes(h.people.customerId), false);
        },
      );
      const own = salesCommand(h.people.customerId);
      await t.test(
        'Sales read renews server idle lifetime before its read-only snapshot',
        async () => {
          await db.owner.query(
            "UPDATE identity.session SET created_at=clock_timestamp()-interval '30 minutes',last_seen_at=clock_timestamp()-interval '29 minutes 50 seconds' WHERE installation_id=$1 AND account_id=$2 AND revoked_at IS NULL",
            [installation, self.accountId],
          );
          const before = (
            await db.owner.query<{ seen: Date }>(
              'SELECT max(last_seen_at) AS seen FROM identity.session WHERE installation_id=$1 AND account_id=$2',
              [installation, self.accountId],
            )
          ).rows[0]!.seen;
          await read(await a.call('/sales/v1/customers/query', {}));
          const after = (
            await db.owner.query<{ seen: Date }>(
              'SELECT max(last_seen_at) AS seen FROM identity.session WHERE installation_id=$1 AND account_id=$2',
              [installation, self.accountId],
            )
          ).rows[0]!.seen;
          assert.ok(after.getTime() - before.getTime() >= 29 * 60 * 1000);
        },
      );
      await execute(own);
      await t.test(
        'Sales Identity admission contention obeys the approved read deadline and releases pending work',
        async () => {
          const blocker = await db.owner.connect();
          try {
            await blocker.query('BEGIN');
            await blocker.query(
              'SELECT 1 FROM identity.session WHERE installation_id=$1 AND account_id=$2 FOR UPDATE',
              [installation, self.accountId],
            );
            const start = performance.now();
            const response = await a.call('/sales/v1/customers/query', {});
            assert.equal(response.status, 503);
            assert.ok(
              performance.now() - start < 8000,
              'Identity admission exceeded whole-read deadline',
            );
            const waiting = await db.owner.query<{ n: number }>(
              "SELECT count(*)::int AS n FROM pg_stat_activity WHERE usename=$1 AND wait_event_type='Lock'",
              [decodeURIComponent(new URL(process.env.TEST_DATABASE_URL!).username)],
            );
            assert.equal(waiting.rows[0]!.n, 0);
          } finally {
            await blocker.query('ROLLBACK');
            blocker.release();
          }
          await read(await a.call('/sales/v1/customers/query', {}));
        },
      );
      const foreign = salesCommand(h.people.otherCustomerId);
      const foreignActor = await h.app.identity.context(
        h.people.tokens.get('foreign')!,
        'ACT-SALES',
        h.people.otherCustomerId,
      );
      completed(await h.app.command(JSON.stringify(foreign), foreignActor), 'accepted');
      await t.test(
        'roster is only granted configured intersection, with no org grant required',
        async () => {
          const roster = await read(await a.call('/sales/v1/customers/query', {}));
          assert.deepEqual(
            (roster.items as Row[]).map((r) => r.customerId),
            [h.people.customerId],
          );
          await db.owner.query(
            "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$1,'ACT-SALES',$3)",
            [installation, self.accountId, randomUUID()],
          );
          const unchanged = await read(await a.call('/sales/v1/customers/query', {}));
          assert.equal((unchanged.items as Row[]).length, 1);
          assert.equal(
            (await a.call('/sales/v1/customers/query', {}, h.people.customerId)).status,
            400,
          );
        },
      );
      await t.test(
        'order/detail and assessment detail disclose only current customer and omit bindings',
        async () => {
          const detail = await read(await call('orders/detail', { orderId: own.target.id }));
          assert.equal(detail.id, own.target.id);
          assert.equal(detail.commercialTerms, 'NOT_SUPPLIED');
          assert.equal('binding' in detail, false);
          assert.equal((await call('orders/detail', { orderId: foreign.target.id })).status, 404);
          assert.equal((await call('orders/detail', { orderId: randomUUID() })).status, 404);
          assert.equal(
            (
              await b.call(
                '/sales/v1/orders/detail',
                { orderId: own.target.id },
                h.people.otherCustomerId,
              )
            ).status,
            404,
          );
          assert.equal(
            (await call('orders/detail', { orderId: own.target.id }, h.people.otherCustomerId))
              .status,
            403,
          );
        },
      );
      await t.test(
        'all exact filters work and UUID pages have independent observation with bound cursors',
        async () => {
          for (let i = 0; i < 11; i++) await execute(salesCommand(h.people.customerId));
          const first = await read(await call('orders/query', { limit: 10 }));
          assert.equal((first.items as Row[]).length, 10);
          assert.equal(typeof first.nextCursor, 'string');
          const next = await read(
            await call('orders/query', { limit: 10, cursor: first.nextCursor }),
          );
          assert.equal((next.items as Row[]).length, 2);
          assert.equal(next.nextCursor, undefined);
          const ids = [...(first.items as Row[]), ...(next.items as Row[])].map((r) =>
            String(r.orderId),
          );
          assert.equal(new Set(ids).size, 12);
          assert.deepEqual(ids, [...ids].sort());
          const exact = await read(
            await call('orders/query', {
              filters: { orderId: own.target.id, state: 'DRAFT', itemType: 'COIL' },
            }),
          );
          assert.equal((exact.items as Row[]).length, 1);
          for (const input of [
            { limit: 25, cursor: first.nextCursor },
            { limit: 10, filters: { state: 'DRAFT' }, cursor: first.nextCursor },
            { limit: 10, cursor: String(first.nextCursor) + 'x' },
          ])
            assert.equal((await call('orders/query', input)).status, 400);
          const second = h.client('sales.second');
          await second.login();
          assert.equal(
            (
              await second.call(
                '/sales/v1/orders/query',
                { limit: 10, cursor: first.nextCursor },
                h.people.customerId,
              )
            ).status,
            400,
          );
        },
      );
      await t.test(
        'strict closed API rejects unknown fields, duplicated JSON, depth, bad limits, CSRF, role and bearer overrides',
        async () => {
          for (const input of [
            { limit: 11 },
            { filters: { customerId: h.people.customerId } },
            { filters: { state: 'CLOSED' } },
            { padding: 'x'.repeat(8200) },
          ])
            assert.equal((await call('orders/query', input)).status, 400);
          assert.equal((await call('orders/query', '{"limit":10,"limit":25}')).status, 400);
          assert.equal(
            (await call('orders/query', { filters: { state: { a: { b: { c: 1 } } } } })).status,
            400,
          );
          assert.equal((await a.call('/sales/v1/orders/query', {})).status, 403);
          for (const headers of [
            { 'x-erp-role': 'ACT-WH' },
            { 'x-erp-csrf': '' },
            { authorization: 'Bearer ' + h.people.tokens.get('first')! },
            { origin: 'http://evil.invalid' },
          ])
            assert.equal(
              (await a.call('/sales/v1/orders/query', {}, h.people.customerId, headers)).status,
              403,
            );
          assert.equal((await a.call('/sales/v1/arbitrary', {}, h.people.customerId)).status, 404);
          assert.equal(
            (await call('commands', { ...own, command: 'RequestReservation' })).status,
            400,
          );
          assert.equal((await call('commands', 'x'.repeat(4097))).status, 400);
          const dup = await new Promise<number>((resolve, reject) => {
            const body = '{}';
            const req = httpRequest(
              h.origin + '/ui-api/sales/v1/orders/query',
              {
                method: 'POST',
                headers: [
                  'Host',
                  new URL(h.origin).host,
                  'Origin',
                  h.origin,
                  'X-Erp-Browser',
                  '1',
                  'Sec-Fetch-Site',
                  'same-origin',
                  'X-Erp-Csrf',
                  a.csrf,
                  'Cookie',
                  a.cookie,
                  'Content-Type',
                  'application/json',
                  'Content-Length',
                  '2',
                  'X-Customer-Id',
                  h.people.customerId,
                  'X-Customer-Id',
                  h.people.customerId,
                ],
              },
              (res) => {
                res.resume();
                resolve(res.statusCode!);
              },
            );
            req.on('error', reject);
            req.end(body);
          });
          assert.equal(dup, 403);
        },
      );
      const assessment = {
        ...follow(own, 'DraftFulfillmentAssessment', { orderId: own.target.id }),
        target: { kind: 'fulfillment-assessment', id: randomUUID() },
      };
      const another = {
        ...assessment,
        idempotency_key: randomUUID(),
        target: { ...assessment.target, id: randomUUID() },
      };
      await t.test(
        'multiple DRAFT assessments remain independent and summaries do not report SQL default as recorded mode',
        async () => {
          await execute(assessment);
          await execute(another);
          const rows = (await read(await call('assessments/query', { orderId: own.target.id })))
            .items as Row[];
          assert.equal(rows.length, 2);
          for (const row of rows) {
            assert.equal(row.state, 'DRAFT');
            assert.equal(row.mode, undefined);
            assert.equal(row.observedAt, undefined);
          }
          const point = await read(
            await call('assessments/detail', { assessmentId: assessment.target.id }),
          );
          assert.equal(point.mode, 'STOCK');
          assert.equal(point.state, 'DRAFT');
          assert.equal('binding' in point, false);
          assert.equal('orderBinding' in point, false);
          assert.equal(
            (await call('assessments/query', { orderId: foreign.target.id })).status,
            404,
          );
        },
      );
      await t.test(
        'MAKE record/confirm preserves six-command semantics and creates no Production or reservation',
        async () => {
          await execute(follow(own, 'SubmitSalesOrder'));
          await execute(follow(assessment, 'RecordFulfillmentMake'));
          const confirm = follow(own, 'ConfirmSalesOrder', { assessmentId: assessment.target.id });
          await execute(confirm);
          const replay = await execute(confirm);
          assert.equal(replay.replayed, true);
          const detail = await read(await call('orders/detail', { orderId: own.target.id }));
          assert.equal(detail.state, 'CONFIRMED');
          assert.equal(detail.confirmedAssessmentId, assessment.target.id);
          assert.equal(
            (
              await call('commands', {
                ...own,
                idempotency_key: randomUUID(),
                payload: {
                  ...own.payload,
                  items: [{ ...(own.payload.items as JsonObject[])[0]!, demandedKg: '6' }],
                },
              })
            ).status,
            422,
          );
          for (const table of ['production.production_order', 'inventory.reservation_request'])
            assert.equal(
              (await db.owner.query<{ n: number }>('SELECT count(*)::int AS n FROM ' + table))
                .rows[0]!.n,
              0,
            );
        },
      );
      await t.test(
        'STOCK candidates use minimal safe-code-null whitelist and fresh existing command validation',
        async () => {
          const receipt = receiptCommand({
            payload: {
              internalCode: 'Customer-Secret-Contract-42',
              count: '1',
              measuredKg: '110',
              type: 'COIL',
              locationId: randomUUID(),
            },
          });
          const wh = await h.app.identity.context(h.warehouse.tokens.get('ACT-WH')!, 'ACT-WH');
          const posted = completed(await h.app.command(JSON.stringify(receipt), wh), 'accepted');
          const unitId = (posted.result.data as JsonObject).unitId;
          assert.ok(typeof unitId === 'string');
          const draft = salesCommand(h.people.customerId);
          await execute(draft);
          await execute(follow(draft, 'SubmitSalesOrder'));
          const itemId = (draft.payload.items as JsonObject[])[0]!.id;
          assert.ok(typeof itemId === 'string');
          const candidates = await read(
            await call('stock/query', { orderId: draft.target.id, itemId }),
          );
          const rows = candidates.items as Row[];
          assert.equal(rows.length, 1);
          assert.deepEqual(Object.keys(rows[0]!).sort(), [
            'availableKg',
            'internalCode',
            'kind',
            'state',
            'unitId',
          ]);
          assert.equal(rows[0]!.internalCode, null);
          assert.equal(rows[0]!.unitId, unitId);
          for (const internalCode of ['Customer-Secret-Contract-42', 'Does-Not-Exist'])
            assert.deepEqual(
              (
                await read(
                  await call('stock/query', {
                    orderId: draft.target.id,
                    itemId,
                    filters: { internalCode },
                  }),
                )
              ).items,
              [],
            );
          const assess = {
            ...follow(draft, 'DraftFulfillmentAssessment', { orderId: draft.target.id }),
            target: { kind: 'fulfillment-assessment', id: randomUUID() },
          };
          await execute(assess);
          await execute(
            follow(assess, 'RecordFulfillmentStock', {
              selections: [{ itemId, unitIds: [unitId] }],
            }),
          );
          await execute(follow(draft, 'ConfirmSalesOrder', { assessmentId: assess.target.id }));
          assert.equal(
            (await call('stock/query', { orderId: draft.target.id, itemId })).status,
            404,
          );
          assert.equal(
            (await db.owner.query<{ n: number }>('SELECT count(*)::int AS n FROM inventory.ledger'))
              .rows[0]!.n,
            1,
          );
        },
      );
      await t.test(
        'same person legitimately granted two customers still cannot cross replay or reuse a cursor',
        async () => {
          await db.owner.query(
            "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$1,'ACT-SALES',$3)",
            [installation, self.accountId, h.people.otherCustomerId],
          );
          assert.equal(
            (await call('orders/detail', { orderId: foreign.target.id }, h.people.otherCustomerId))
              .status,
            200,
          );
          assert.equal((await call('commands', own, h.people.otherCustomerId)).status, 403);
          const first = await read(await call('orders/query', { limit: 10 }));
          assert.equal(
            (
              await call(
                'orders/query',
                { limit: 10, cursor: first.nextCursor },
                h.people.otherCustomerId,
              )
            ).status,
            400,
          );
        },
      );
      await t.test(
        'fresh customer grant revocation denies existing browser data and durable replay',
        async () => {
          await db.owner.query(
            "DELETE FROM identity.role_grant WHERE installation_id=$1 AND account_id=$2 AND actor_role='ACT-SALES' AND customer_scope=$3",
            [installation, self.accountId, h.people.customerId],
          );
          assert.equal((await call('orders/detail', { orderId: own.target.id })).status, 403);
          assert.equal((await call('commands', own)).status, 403);
          const roster = await read(await a.call('/sales/v1/customers/query', {}));
          assert.deepEqual(
            (roster.items as Row[]).map((r) => r.customerId),
            [h.people.otherCustomerId],
          );
        },
      );
    } finally {
      await h.app.stop();
    }
  }));

void test('P4b real RR roster reauthorization rejects revoked returned and lookahead membership while another grant remains', async () =>
  withDatabase(async (db) => {
    const h = await salesBrowserHarness(db);
    try {
      const principal = await h.app.identity.salesReader(h.people.tokens.get('first')!);
      for (let i = 0; i < 12; i++) {
        const customer = randomUUID();
        await db.owner.query(
          'INSERT INTO sales.customer(installation_id,authority_scope,customer_id,display_name) VALUES($1,$1,$2,$3)',
          [installation, customer, 'Private roster label'],
        );
        await db.owner.query(
          "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$1,'ACT-SALES',$3)",
          [installation, principal.accountId, customer],
        );
      }
      // Page size10, authorized take11: position10 is the actual lookahead.
      for (const position of [0, 10]) {
        const tx = await new PostgresTransactions(db.runtime).begin('read-snapshot');
        let rows: readonly { customerId: string; displayName: string }[] = [];
        try {
          rows = await new PostgresSalesStore().customers(principal, tx.context, undefined, 11);
          assert.equal(rows.length, 11);
          await db.owner.query(
            "DELETE FROM identity.role_grant WHERE installation_id=$1 AND account_id=$2 AND actor_role='ACT-SALES' AND customer_scope=$3",
            [installation, principal.accountId, rows[position]!.customerId],
          );
          assert.equal(
            (await new PostgresSalesStore().customers(principal, tx.context, undefined, 11)).length,
            11,
          );
          await tx.commit();
        } finally {
          await tx.release();
        }
        await assert.rejects(
          () =>
            h.app.identity.authorizeSalesReader(
              principal,
              rows.map((r) => r.customerId),
            ),
          { kind: 'forbidden' },
        );
        await h.app.identity.authorizeSalesReader(principal, [rows[1]!.customerId]);
        await db.owner.query(
          "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$1,'ACT-SALES',$3)",
          [installation, principal.accountId, rows[position]!.customerId],
        );
      }
      const forged = { ...principal };
      await assert.rejects(
        () => h.app.identity.authorizeSalesReader(forged, [h.people.customerId]),
        { kind: 'forbidden' },
      );
    } finally {
      await h.app.stop();
    }
  }));

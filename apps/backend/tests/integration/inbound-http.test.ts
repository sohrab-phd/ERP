import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { request as httpRequest, type ClientRequest } from 'node:http';
import type { CommandRequest, ExecutionResult, JsonObject } from '@navard/shared-kernel';
import { compose } from '../../src/composition-root.js';
import type { InboundOrderProjection } from '../../src/modules/procurement/index.js';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import { installation, operators } from '../support/receipt-harness.js';
import { purchaseCommand } from '../support/purchase-harness.js';
import { request } from '../support/synthetic-command.js';

const paths = {
  orders: '/purchasing/operational-orders',
  options: '/purchasing/inbound-catalogues',
  lookup: '/purchasing/operational-orders/lookup',
  selection: '/purchasing/inbound-catalogues/query',
};
const line = (materialTypeOptionId: string, extra: JsonObject = {}): JsonObject => ({
  materialTypeOptionId,
  widthM: '1.200',
  thicknessMm: '0.35',
  unitWeightKg: '2000',
  orderedUnitCount: '5',
  ...extra,
});
const order = (lines: JsonObject[], orderReference = ' PO-۱۲ '): CommandRequest =>
  request({
    command: 'RegisterOperationalPurchaseOrder',
    target: { kind: 'operational-purchase-order', id: randomUUID() },
    payload: { orderReference, registrationDateJalali: '1403-12-30', lines },
    preconditions: {},
  });
const option = (catalogue: string, label: string): CommandRequest =>
  request({
    command: 'AddInboundCatalogueOption',
    target: { kind: 'inbound-catalogue-option', id: randomUUID() },
    payload: { catalogue, label },
    preconditions: {},
  });

async function server(db: DatabaseFixture, commandAdmissionReconciled = true) {
  const people = await operators(db);
  await db.owner.query(
    'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
    [installation],
  );
  const app = compose({
    nodeEnv: 'production',
    host: '127.0.0.1',
    port: 0,
    databaseUrl: process.env.TEST_DATABASE_URL!,
    installationId: installation,
    logLevel: 'error',
    commandAdmissionReconciled,
  });
  await app.start();
  const address = app.server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const call = (
    path: string,
    input?: unknown,
    role: 'ACT-PROC' | 'ACT-WH' | 'ACT-SEC' | 'ACT-CUST' = 'ACT-PROC',
    extra: Record<string, string> = {},
  ) =>
    fetch(base + path, {
      method: input === undefined ? 'GET' : 'POST',
      headers: {
        authorization: `Bearer ${people.tokens.get(role)!}`,
        'x-erp-role': role,
        ...(input === undefined ? {} : { 'content-type': 'application/json; charset=utf-8' }),
        ...extra,
      },
      ...(input === undefined
        ? {}
        : { body: typeof input === 'string' ? input : JSON.stringify(input) }),
    });
  return { people, app, base, call };
}

void test('I1 composed HTTP: both roles create/reuse three catalogues; immutable independent order lines and equivalent authorized lookup', async () => {
  await withDatabase(async (db) => {
    const { people, app, call } = await server(db);
    try {
      const material = option('MATERIAL_TYPE', 'ورق کارخانه');
      const quality = option('QUALITY_GRADE', 'کیفیت نمونه');
      const color = option('COLOR', 'آبی');
      for (const [command, role] of [
        [material, 'ACT-WH'],
        [quality, 'ACT-PROC'],
        [color, 'ACT-WH'],
      ] as const) {
        const result = await call(paths.options, command, role);
        assert.equal(result.status, 200);
        const accepted = (await result.json()) as ExecutionResult;
        assert.equal(accepted.status, 'completed');
        const replay = await call(paths.options, command, role);
        assert.equal(replay.status, 200);
        assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
        for (const reader of ['ACT-PROC', 'ACT-WH'] as const) {
          const selection = await call(
            paths.selection,
            { catalogue: command.payload.catalogue, exactLabel: command.payload.label },
            reader,
          );
          assert.equal(selection.status, 200);
          const selected = (await selection.json()) as {
            data: { items: { optionId: string; catalogue: string; label: string }[] };
          };
          assert.deepEqual(selected.data.items, [
            {
              optionId: command.target.id,
              catalogue: command.payload.catalogue,
              label: command.payload.label,
            },
          ]);
        }
      }
      const plain = line(material.target.id);
      const command = order([
        plain,
        plain,
        line(material.target.id, {
          itemNumber: 'آیتم اختیاری',
          colorOptionId: color.target.id,
          ralColorNumber: 'RAL sample',
          lengthM: '12.000',
          qualityGradeOptionId: quality.target.id,
        }),
      ]);
      const result = await call(paths.orders, command);
      assert.equal(result.status, 200);
      const accepted = (await result.json()) as ExecutionResult;
      assert.equal(accepted.status, 'completed');
      if (accepted.status !== 'completed') throw new Error('Expected completed I1 command');
      assert.equal(accepted.result.event, 'OperationalPurchaseOrderRegistered');
      assert.deepEqual(accepted.result.data, { orderId: command.target.id, lineCount: 3 });
      const replay = await call(paths.orders, command);
      assert.equal(replay.status, 200);
      assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
      for (const role of ['ACT-PROC', 'ACT-WH'] as const) {
        for (const reference of ['po-12', ' PO-١٢ ', 'PO-۱۲']) {
          const response = await call(paths.lookup, { orderReference: reference }, role);
          assert.equal(response.status, 200);
          const raw = await response.text();
          for (const secret of ['binding', 'orderReferenceKey', 'issuer', 'subject', 'recordedAt'])
            assert.ok(!raw.includes(secret));
          assert.ok(!raw.includes(people.tokens.get(role)!));
          const projection = (JSON.parse(raw) as { data: InboundOrderProjection }).data;
          assert.equal(projection.orderReference, ' PO-۱۲ ');
          assert.equal(projection.registrationDateJalali, '1403-12-30');
          assert.equal(projection.calendar, 'jalali');
          assert.equal(projection.lines.length, 3);
          assert.equal(new Set(projection.lines.map((item) => item.lineId)).size, 3);
          assert.deepEqual(
            projection.lines.map((item) => item.position),
            [1, 2, 3],
          );
          assert.equal(projection.lines[0]!.itemNumber, undefined);
          assert.equal(projection.lines[1]!.itemNumber, undefined);
          assert.equal(projection.lines[0]!.widthM, '1.200');
          assert.equal(projection.lines[0]!.unitWeightKg, '2000');
          assert.equal(projection.lines[0]!.orderedUnitCount, '5');
          assert.equal(projection.lines[2]!.qualityGrade!.label, 'کیفیت نمونه');
          assert.deepEqual(projection.units, {
            widthM: 'm',
            thicknessMm: 'mm',
            lengthM: 'm',
            unitWeightKg: 'kg',
          });
          assert.equal(response.headers.get('cache-control'), 'no-store');
          assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        }
        const byId = await call(`${paths.orders}/${command.target.id}`, undefined, role);
        assert.equal(byId.status, 200);
      }
      const equivalentNewKey = order([plain], 'po-١٢');
      const conflict = await call(paths.orders, equivalentNewKey);
      assert.equal(conflict.status, 422);
      assert.equal(
        ((await conflict.json()) as { result: { family: string } }).result.family,
        'GUARD_CONFLICT',
      );
      assert.equal(
        (
          await call(paths.orders, {
            ...command,
            payload: { ...command.payload, orderReference: 'po-12' },
          })
        ).status,
        409,
      );
      assert.equal((await call(paths.lookup, { orderReference: 'PO-012' }, 'ACT-WH')).status, 404);
      assert.equal((await call(paths.lookup, { orderReference: 'PO12' }, 'ACT-WH')).status, 404);
      const unused = option('COLOR', 'گزینه بدون سفارش');
      assert.equal((await call(paths.options, unused, 'ACT-WH')).status, 200);
      const invalidOrder = order([line(material.target.id, { widthM: '0' })], 'INVALID');
      assert.equal((await call(paths.orders, invalidOrder)).status, 422);
      const unusedRead = await call(paths.selection, {
        catalogue: 'COLOR',
        exactLabel: unused.payload.label,
      });
      assert.equal(unusedRead.status, 200);
      assert.equal(
        ((await unusedRead.json()) as { data: { items: unknown[] } }).data.items.length,
        1,
      );
      const foreign = await db.owner.query<{ total: string }>(
        'SELECT ((SELECT count(*) FROM inventory.unit)+(SELECT count(*) FROM inventory.material_lot)+(SELECT count(*) FROM inventory.ledger)+(SELECT count(*) FROM inventory.balance)+(SELECT count(*) FROM procurement.goods_receipt)+(SELECT count(*) FROM finance.invoice_evidence)+(SELECT count(*) FROM production.production_order)+(SELECT count(*) FROM shipping.dispatch))::text AS total',
      );
      assert.equal(foreign.rows[0]!.total, '0');
      assert.equal(
        (await db.owner.query('SELECT * FROM procurement.operational_purchase_order')).rowCount,
        1,
      );
    } finally {
      await app.stop();
    }
  });
});

void test('I1 HTTP closes routes, bodies, role selection, query injection, revocation and documentary access', async () => {
  await withDatabase(async (db) => {
    const { people, app, base, call } = await server(db);
    try {
      const material = option('MATERIAL_TYPE', 'material');
      assert.equal((await call(paths.options, material)).status, 200);
      const command = order([line(material.target.id)], 'scope-safe');
      assert.equal((await call(paths.orders, command)).status, 200);
      assert.equal(
        (await call(paths.orders, order([line(material.target.id)], 'WH'), 'ACT-WH')).status,
        403,
      );
      assert.equal((await call(paths.orders, command, 'ACT-WH')).status, 403);
      for (const role of ['ACT-SEC', 'ACT-CUST'] as const) {
        for (const [path, input] of [
          [paths.orders, command],
          [paths.options, option('COLOR', 'forbidden')],
          [paths.lookup, { orderReference: 'scope-safe' }],
          [paths.selection, { catalogue: 'COLOR' }],
          [`${paths.orders}/${command.target.id}`, undefined],
        ] as const)
          assert.equal((await call(path, input, role)).status, 403);
      }
      const missingRole = await fetch(base + paths.lookup, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${people.tokens.get('ACT-PROC')!}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ orderReference: 'scope-safe' }),
      });
      assert.equal(missingRole.status, 403);
      assert.equal(
        (
          await call(paths.lookup, { orderReference: 'scope-safe' }, 'ACT-PROC', {
            origin: 'https://example.invalid',
          })
        ).status,
        403,
      );
      assert.equal(
        (await call(paths.lookup, { orderReference: 'scope-safe' }, 'ACT-PROC', { origin: '' }))
          .status,
        403,
      );
      assert.equal(
        (
          await call(paths.lookup, { orderReference: 'scope-safe' }, 'ACT-PROC', {
            authorization: 'Bearer invalid',
          })
        ).status,
        401,
      );
      assert.equal(
        (await call(paths.lookup, { orderReference: 'scope-safe', installationId: randomUUID() }))
          .status,
        400,
      );
      assert.equal(
        (await call(paths.lookup, { orderReference: 'scope-safe', actor: {} })).status,
        400,
      );
      assert.equal((await call(paths.selection, { catalogue: 'COLOR', limit: 101 })).status, 400);
      assert.equal(
        (
          await call(paths.selection, {
            catalogue: 'COLOR',
            exactLabel: 'x',
            afterId: randomUUID(),
          })
        ).status,
        400,
      );
      assert.equal((await call(paths.selection, { catalogue: 'COLOR', label: 'x' })).status, 400);
      assert.equal(
        (await call(`${paths.orders}/${command.target.id}?installationId=${randomUUID()}`)).status,
        404,
      );
      assert.equal((await call(`${paths.orders}/${randomUUID()}`)).status, 404);
      assert.equal((await call(paths.orders, material)).status, 400);
      assert.equal((await call(paths.options, command)).status, 400);
      assert.equal((await call(paths.orders, { ...command, contract_version: 2 })).status, 403);
      assert.equal(
        (
          await call(paths.orders, {
            ...command,
            payload: { ...command.payload, orderReferenceKey: 'injected' },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call(
            paths.orders,
            '{"command":"RegisterOperationalPurchaseOrder","command":"RegisterOperationalPurchaseOrder"}',
          )
        ).status,
        400,
      );
      assert.equal((await call(paths.orders, 'x'.repeat(262145))).status, 400);
      assert.equal((await call(paths.options, 'x'.repeat(4097))).status, 400);
      assert.equal(
        (
          await call(paths.orders, command, 'ACT-PROC', {
            'content-type': 'application/json; charset=latin1',
          })
        ).status,
        400,
      );
      assert.equal(
        (await call(paths.orders, command, 'ACT-PROC', { 'content-encoding': 'gzip' })).status,
        400,
      );
      const mutation = await fetch(base + `${paths.orders}/${command.target.id}`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${people.tokens.get('ACT-WH')!}`,
          'x-erp-role': 'ACT-WH',
        },
      });
      assert.equal(mutation.status, 405);
      assert.equal(mutation.headers.get('allow'), 'GET');
      const duplicateRole = await new Promise<number>((resolve, reject) => {
        const req = httpRequest(
          base + `${paths.orders}/${command.target.id}`,
          {
            headers: [
              'host',
              new URL(base).host,
              'authorization',
              `Bearer ${people.tokens.get('ACT-PROC')!}`,
              'x-erp-role',
              'ACT-PROC',
              'x-erp-role',
              'ACT-PROC',
            ],
          },
          (response) => {
            response.resume();
            response.once('end', () => resolve(response.statusCode!));
          },
        );
        req.once('error', reject);
        req.end();
      });
      assert.equal(duplicateRole, 403);
      assert.equal((await call('/purchasing/purchases', purchaseCommand(), 'ACT-WH')).status, 403);
      assert.equal((await call('/purchasing/purchases', 'x'.repeat(4097))).status, 400);
      await app.identity.logout(people.tokens.get('ACT-WH')!);
      assert.equal(
        (await call(paths.lookup, { orderReference: 'scope-safe' }, 'ACT-WH')).status,
        401,
      );
      assert.equal((await call(paths.options, option('COLOR', 'revoked'), 'ACT-WH')).status, 401);
    } finally {
      await app.stop();
    }
  });
});

void test('I1 HTTP larger order bodies retain exact strings and full responses; aggregate projection failure is durable before source persistence', async () => {
  await withDatabase(async (db) => {
    const { app, call } = await server(db);
    try {
      const selections = ['MATERIAL_TYPE', 'QUALITY_GRADE', 'COLOR'].map((kind) =>
        option(kind, '𐀀'.repeat(128)),
      );
      for (const selection of selections)
        assert.equal((await call(paths.options, selection, 'ACT-WH')).status, 200);
      const input = order(
        Array.from({ length: 48 }, () => line(selections[0]!.target.id)),
        'large-body',
      );
      assert.ok(Buffer.byteLength(JSON.stringify(input)) > 4096);
      assert.equal((await call(paths.orders, input)).status, 200);
      const read = await call(`${paths.orders}/${input.target.id}`, undefined, 'ACT-WH');
      assert.equal(read.status, 200);
      const body = await read.text();
      assert.ok(Buffer.byteLength(body) <= 262144);
      assert.equal((JSON.parse(body) as { data: InboundOrderProjection }).data.lines.length, 48);
      const enormous = order(
        Array.from({ length: 128 }, () =>
          line(selections[0]!.target.id, {
            colorOptionId: selections[2]!.target.id,
            qualityGradeOptionId: selections[1]!.target.id,
            itemNumber: '"'.repeat(128),
            ralColorNumber: '\\'.repeat(128),
          }),
        ),
        'projection-too-large',
      );
      assert.ok(Buffer.byteLength(JSON.stringify(enormous)) < 262144);
      const rejected = await call(paths.orders, enormous);
      assert.equal(rejected.status, 422);
      const result = (await rejected.json()) as ExecutionResult;
      assert.equal(result.status, 'completed');
      if (result.status !== 'completed') throw new Error('Expected durable capacity rejection');
      assert.equal(result.result.family, 'GUARD_INVARIANT');
      assert.ok(JSON.stringify(result).includes('I1_ORDER_PROJECTION_LIMIT'));
      assert.equal(
        (
          await db.owner.query(
            'SELECT * FROM procurement.operational_purchase_order WHERE order_id=$1',
            [enormous.target.id],
          )
        ).rowCount,
        0,
      );
      assert.equal(
        (
          await db.owner.query(
            'SELECT * FROM procurement.operational_purchase_order_line WHERE order_id=$1',
            [enormous.target.id],
          )
        ).rowCount,
        0,
      );
      const replay = await call(paths.orders, enormous);
      assert.equal(replay.status, 422);
      assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
      assert.equal(
        (await call(paths.lookup, { orderReference: 'projection-too-large' })).status,
        404,
      );
    } finally {
      await app.stop();
    }
  });
});

void test('I1 composed admission fence and customer-bound grants remain effective', async () => {
  await withDatabase(async (db) => {
    const { app, call } = await server(db, false);
    try {
      assert.equal((await call(paths.options, option('MATERIAL_TYPE', 'fenced'))).status, 503);
      assert.equal(
        (await db.owner.query('SELECT * FROM procurement.inbound_catalogue_option')).rowCount,
        0,
      );
      await db.owner.query(
        "UPDATE identity.role_grant SET customer_scope=$1 WHERE actor_role IN ('ACT-PROC','ACT-WH')",
        [randomUUID()],
      );
      assert.equal((await call(paths.selection, { catalogue: 'MATERIAL_TYPE' })).status, 403);
      assert.equal((await call(paths.lookup, { orderReference: 'fenced' }, 'ACT-WH')).status, 403);
    } finally {
      await app.stop();
    }
  });
});

void test('I1 HTTP reader concurrency cap and five-second incomplete-body deadline are enforced on actual sockets', async () => {
  await withDatabase(async (db) => {
    const { app, people, base, call } = await server(db);
    const pending: ClientRequest[] = [];
    try {
      let observed = 0;
      let releaseRequests: () => void = () => undefined;
      const received = new Promise<void>((resolve) => {
        releaseRequests = resolve;
      });
      const observer = (incoming: { url?: string }) => {
        if (incoming.url === paths.orders && ++observed === 16) releaseRequests();
      };
      app.server.on('request', observer);
      for (let index = 0; index < 16; index++) {
        const req = httpRequest(base + paths.orders, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${people.tokens.get('ACT-PROC')!}`,
            'x-erp-role': 'ACT-PROC',
            'content-type': 'application/json',
            'content-length': '2',
          },
        });
        req.on('error', () => undefined);
        req.on('response', (response) => response.resume());
        req.flushHeaders();
        pending.push(req);
      }
      await received;
      const saturated = await call(paths.lookup, { orderReference: 'absent' });
      assert.equal(saturated.status, 503);
      assert.deepEqual(await saturated.json(), { error: 'unavailable' });
      app.server.off('request', observer);
      for (const req of pending) req.destroy();
      // A separate connection proves the reader deadline, independently of the cap.
      // Wait until all aborted request handlers have completed their actual cleanup.
      await new Promise<void>((resolve) => setImmediate(resolve));
      let status = 503;
      const cleanupDeadline = Date.now() + 8000;
      while (status === 503 && Date.now() < cleanupDeadline) {
        const response = await call(paths.lookup, { orderReference: 'absent' });
        status = response.status;
        await response.arrayBuffer();
        if (status === 503) await new Promise<void>((resolve) => setTimeout(resolve, 10));
      }
      assert.equal(status, 404);
      const deadline = await new Promise<number>((resolve, reject) => {
        const req = httpRequest(
          base + paths.orders,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${people.tokens.get('ACT-PROC')!}`,
              'x-erp-role': 'ACT-PROC',
              'content-type': 'application/json',
              'content-length': '2',
            },
          },
          (response) => {
            response.resume();
            response.once('end', () => {
              req.destroy();
              resolve(response.statusCode!);
            });
          },
        );
        req.once('error', reject);
        req.flushHeaders();
        pending.push(req);
      });
      assert.equal(deadline, 400);
      assert.equal(
        (await db.owner.query('SELECT * FROM procurement.operational_purchase_order')).rowCount,
        0,
      );
    } finally {
      for (const req of pending) req.destroy();
      await app.stop();
    }
  });
});

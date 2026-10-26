import assert from 'node:assert/strict';
import test from 'node:test';
import { request as httpRequest } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { ExecutionResult } from '@navard/shared-kernel';
import { withDatabase } from '../support/database-fixture.js';
import { browserHarness } from '../support/browser-harness.js';
import { optionCommand, orderCommand } from '../support/inbound-harness.js';
import type { InboundOrderProjection } from '../../src/modules/procurement/index.js';
import { seedBrowserScenarios } from '../support/browser-scenarios.js';

void test('P1 browser admission, cookies, CSRF, security headers, closed files/routes and legacy compatibility', async () => {
  await withDatabase(async (db) => {
    const h = await browserHarness(db);
    try {
      const c = h.client();
      const { response, self } = await c.login();
      assert.match(response.headers.get('set-cookie')!, /HttpOnly; SameSite=Strict/u);
      assert.ok(self.browser.recoveryKey);
      assert.match(response.headers.get('content-security-policy')!, /frame-ancestors 'none'/u);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
      assert.equal(response.headers.get('access-control-allow-origin'), null);
      for (const origin of [
        'https://evil.example',
        'null',
        h.origin.replace('127.0.0.1', 'localhost'),
      ])
        assert.equal(
          (await c.call('/purchasing/inbound-catalogues/query', { catalogue: 'COLOR' }, { origin }))
            .status,
          403,
        );
      for (const headers of [
        { 'x-erp-csrf': '' },
        { 'x-erp-csrf': 'é'.repeat(43) },
        { 'sec-fetch-site': 'same-site' },
        { 'sec-fetch-site': 'cross-site' },
        { authorization: 'Bearer ' + h.people.tokens.get('ACT-PROC')! },
        { cookie: c.cookie + '; ' + c.cookie },
      ])
        assert.ok(
          [401, 403].includes(
            (await c.call('/purchasing/inbound-catalogues/query', { catalogue: 'COLOR' }, headers))
              .status,
          ),
        );
      assert.equal((await c.call('/identity/accounts', {})).status, 404);
      assert.equal((await c.call('/purchasing/receiving/confirm', {})).status, 403);
      assert.equal((await c.call('/purchasing/receiving/arrivals/query', {})).status, 403);
      assert.equal((await c.call('/purchasing/inbound-catalogues/query', '{bad')).status, 400);
      assert.equal(
        (
          await c.call('/purchasing/inbound-catalogues/query', {
            catalogue: 'COLOR',
            padding: 'x'.repeat(5000),
          })
        ).status,
        400,
      );
      for (const path of [
        '/',
        '/operator/app.js',
        '/operator/intent.js',
        '/operator/display.js',
        '/operator/styles.css',
      ]) {
        const asset = await fetch(h.origin + path);
        assert.equal(asset.status, 200);
        assert.equal(asset.headers.get('cache-control'), 'no-store');
      }
      for (const path of [
        '/operator/app.js.map',
        '/operator/app.ts',
        '/operator/../config.ts',
        '/.env.local',
        '/src/config.ts',
      ])
        assert.equal((await fetch(h.origin + path)).status, 404);
      assert.equal(
        (await fetch(h.origin + '/identity/session', { headers: { cookie: c.cookie } })).status,
        401,
      );
      assert.equal((await h.legacy('/identity/session')).status, 200);
      assert.equal(
        (
          await fetch(h.origin + '/identity/session', {
            headers: {
              origin: h.origin,
              authorization: 'Bearer ' + h.people.tokens.get('ACT-PROC')!,
            },
          })
        ).status,
        403,
      );
      assert.equal((await c.call('/identity/logout', {})).status, 200);
      assert.equal((await c.call('/identity/session')).status, 401);
    } finally {
      await h.app.stop();
    }
  });
});
void test('P1 real I1 all fields exact canonical readback, stable line identities, optional omission and replay', async () => {
  await withDatabase(async (db) => {
    const h = await browserHarness(db);
    try {
      const c = h.client();
      await c.login();
      const m = optionCommand('MATERIAL_TYPE', '<img src=x onerror=alert(1)>');
      const q = optionCommand('QUALITY_GRADE', 'کیفیت');
      const color = optionCommand('COLOR', 'آبی');
      for (const option of [m, q, color])
        assert.equal((await c.call('/purchasing/inbound-catalogues', option)).status, 200);
      const r = orderCommand(m.target.id);
      const plain = {
        materialTypeOptionId: m.target.id,
        widthM: '99999999999999999999.123456789012345678',
        thicknessMm: '0.000000000000000001',
        unitWeightKg: '99999999999999999999',
        orderedUnitCount: '99999999999999999999',
      };
      const command = {
        ...r,
        payload: {
          ...r.payload,
          lines: [
            plain,
            plain,
            {
              ...plain,
              itemNumber: 'اصل ۱۲',
              colorOptionId: color.target.id,
              ralColorNumber: ' RAL-۱۲ ',
              lengthM: '12.000',
              qualityGradeOptionId: q.target.id,
            },
          ],
        },
      };
      assert.equal((await c.call('/purchasing/operational-orders', command)).status, 200);
      const replay = await c.call('/purchasing/operational-orders', command);
      assert.equal(replay.status, 200);
      assert.equal(
        ((await replay.json()) as ExecutionResult & { replayed: boolean }).replayed,
        true,
      );
      const read = await c.call('/purchasing/operational-orders/' + command.target.id);
      const order = ((await read.json()) as { data: InboundOrderProjection }).data;
      assert.equal(order.orderReference, ' PO-۱۲ ');
      assert.equal(order.registrationDateJalali, '1403-12-30');
      assert.equal(order.lines.length, 3);
      assert.equal(new Set(order.lines.map((l) => l.lineId)).size, 3);
      assert.deepEqual(
        order.lines.map((l) => l.position),
        [1, 2, 3],
      );
      assert.equal(order.lines[0]!.itemNumber, undefined);
      assert.equal(order.lines[0]!.color, undefined);
      assert.equal(order.lines[0]!.widthM, plain.widthM);
      for (const line of order.lines) {
        assert.equal(line.widthM, plain.widthM);
        assert.equal(line.thicknessMm, plain.thicknessMm);
        assert.equal(line.unitWeightKg, plain.unitWeightKg);
        assert.equal(line.orderedUnitCount, plain.orderedUnitCount);
        assert.equal(line.materialType.optionId, m.target.id);
      }
      for (const line of order.lines.slice(0, 2))
        for (const field of ['itemNumber', 'color', 'ralColorNumber', 'lengthM', 'qualityGrade'])
          assert.equal(Object.hasOwn(line, field), false);
      assert.equal(order.lines[2]!.itemNumber, 'اصل ۱۲');
      assert.equal(order.lines[2]!.ralColorNumber, ' RAL-۱۲ ');
      assert.equal(order.lines[2]!.color!.optionId, color.target.id);
      assert.equal(order.lines[2]!.qualityGrade!.optionId, q.target.id);
      assert.equal(order.lines[2]!.qualityGrade!.label, q.payload.label);
      assert.equal(order.lines[2]!.color!.label, color.payload.label);
      assert.equal(order.lines[2]!.lengthM, '12.000');
      assert.equal(order.lines[2]!.materialType.label, m.payload.label);
      const lookup = await c.call('/purchasing/operational-orders/lookup', {
        orderReference: 'po-12',
      });
      assert.deepEqual(((await lookup.json()) as { data: unknown }).data, order);
      assert.equal(
        (
          await c.call('/purchasing/operational-orders', {
            ...command,
            payload: { ...command.payload, registrationDateJalali: '1404-01-01' },
          })
        ).status,
        409,
      );
      for (const registrationDateJalali of ['1404-12-30', '1205-12-29', '1499-01-01']) {
        const bad = orderCommand(m.target.id, {
          payload: { ...r.payload, orderReference: randomUUID(), registrationDateJalali },
        });
        assert.equal((await c.call('/purchasing/operational-orders', bad)).status, 422);
      }
      const count = await db.owner.query<{ count: string }>(
        'SELECT count(*) FROM procurement.operational_purchase_order',
      );
      assert.equal(count.rows[0]!.count, '1');
    } finally {
      await h.app.stop();
    }
  });
});
void test('P1 Warehouse read/catalogues, Customer/Security denial, current grant revocation and expiration', async () => {
  await withDatabase(async (db) => {
    const h = await browserHarness(db);
    try {
      const proc = h.client();
      await proc.login();
      const wh = h.client('ACT-WH');
      const warehouseSession = await wh.login();
      const material = optionCommand();
      assert.equal((await wh.call('/purchasing/inbound-catalogues', material)).status, 200);
      const order = orderCommand(material.target.id);
      assert.equal(
        (await wh.call('/purchasing/operational-orders', order, { 'x-erp-role': 'ACT-PROC' }))
          .status,
        403,
      );
      assert.equal((await proc.call('/purchasing/operational-orders', order)).status, 200);
      assert.equal(
        (await wh.call('/purchasing/operational-orders/' + order.target.id)).status,
        200,
      );
      for (const role of ['ACT-SEC', 'ACT-CUST'] as const) {
        const c = h.client(role);
        const login = await c.login();
        assert.equal(login.self.browser.recoveryKey, undefined);
        assert.deepEqual(login.self.grants, []);
        assert.equal(
          (
            await c.call('/purchasing/operational-orders/' + order.target.id, undefined, {
              'x-erp-role': 'ACT-PROC',
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await c.call(
              '/purchasing/receiving/orders/query',
              { orderId: order.target.id, view: 'RECEIVED_UNITS' },
              { 'x-erp-role': 'ACT-PROC' },
            )
          ).status,
          403,
        );
      }
      await db.owner.query("DELETE FROM identity.role_grant WHERE actor_role='ACT-PROC'");
      assert.equal(
        (await proc.call('/purchasing/operational-orders/' + order.target.id)).status,
        403,
      );
      const session = await proc.call('/identity/session');
      assert.equal(
        ((await session.json()) as { browser: { recoveryKey?: string } }).browser.recoveryKey,
        undefined,
      );
      await h.app.identity.revokeSessions(
        h.people.tokens.get('ACT-SEC')!,
        warehouseSession.self.accountId,
      );
      assert.equal((await wh.call('/identity/session')).status, 401);
      await wh.login();
      await db.owner.query(
        "UPDATE identity.session SET created_at=clock_timestamp()-interval '9 hours',last_seen_at=clock_timestamp()-interval '1 minute',expires_at=clock_timestamp()-interval '1 hour'",
      );
      assert.equal((await wh.call('/identity/session')).status, 401);
    } finally {
      await h.app.stop();
    }
  });
});
void test('P1 stale-tab CSRF cannot submit actor A intent with actor B cookie; current actor recovery keys differ', async () => {
  await withDatabase(async (db) => {
    const h = await browserHarness(db);
    try {
      const a = h.client();
      const sa = await a.login();
      const b = h.client('ACT-WH');
      const sb = await b.login();
      assert.notEqual(sa.self.browser.recoveryKey, sb.self.browser.recoveryKey);
      assert.equal(
        (await a.call('/purchasing/inbound-catalogues', optionCommand(), { cookie: b.cookie }))
          .status,
        403,
      );
      assert.equal(
        (
          await a.call(
            '/purchasing/inbound-catalogues/query',
            { catalogue: 'COLOR' },
            { cookie: b.cookie },
          )
        ).status,
        403,
      );
      assert.equal((await a.login()).self.browser.recoveryKey, sa.self.browser.recoveryKey);
      const count = await db.owner.query<{ count: string }>(
        'SELECT count(*) FROM procurement.inbound_catalogue_option',
      );
      assert.equal(count.rows[0]!.count, '0');
    } finally {
      await h.app.stop();
    }
  });
});
void test('P1 independently durable catalogues and concurrent exact duplicates resolve through selection', async () => {
  await withDatabase(async (db) => {
    const h = await browserHarness(db);
    try {
      const proc = h.client();
      await proc.login();
      const wh = h.client('ACT-WH');
      await wh.login();
      for (const kind of ['MATERIAL_TYPE', 'QUALITY_GRADE', 'COLOR']) {
        const first = optionCommand(kind, 'دقیق ' + kind);
        const second = optionCommand(kind, first.payload.label as string);
        const responses = await Promise.all([
          proc.call('/purchasing/inbound-catalogues', first),
          wh.call('/purchasing/inbound-catalogues', second),
        ]);
        assert.deepEqual(responses.map((r) => r.status).sort(), [200, 422]);
        const selected = await wh.call('/purchasing/inbound-catalogues/query', {
          catalogue: kind,
          exactLabel: first.payload.label,
        });
        const data = (await selected.json()) as { data: { items: { optionId: string }[] } };
        assert.equal(data.data.items.length, 1);
        assert.ok([first.target.id, second.target.id].includes(data.data.items[0]!.optionId));
      }
      assert.equal(
        (await proc.call('/purchasing/operational-orders', orderCommand(randomUUID()))).status,
        422,
      );
      const counts = await db.owner.query<{ count: string }>(
        'SELECT count(*) FROM procurement.inbound_catalogue_option',
      );
      assert.equal(counts.rows[0]!.count, '3');
    } finally {
      await h.app.stop();
    }
  });
});
void test('P1 lost HTTP response after real COMMIT recovers same command once after reauthentication', async () => {
  await withDatabase(async (db) => {
    const h = await browserHarness(db);
    try {
      const c = h.client();
      const original = await c.login();
      const material = optionCommand();
      assert.equal((await c.call('/purchasing/inbound-catalogues', material)).status, 200);
      const order = orderCommand(material.target.id);
      h.loseNextOrderResponse();
      await assert.rejects(c.call('/purchasing/operational-orders', order));
      assert.equal((await c.login()).self.browser.recoveryKey, original.self.browser.recoveryKey);
      const responses = await Promise.all([
        c.call('/purchasing/operational-orders', order),
        c.call('/purchasing/operational-orders', order),
      ]);
      for (const response of responses) {
        assert.equal(response.status, 200);
        assert.equal(((await response.json()) as { replayed: boolean }).replayed, true);
      }
      const count = await db.owner.query<{ count: string }>(
        'SELECT count(*) FROM procurement.operational_purchase_order',
      );
      assert.equal(count.rows[0]!.count, '1');
      assert.equal((await c.call('/purchasing/operational-orders/' + order.target.id)).status, 200);
    } finally {
      await h.app.stop();
    }
  });
});
void test('P1 scoped receiving pages preserve original/progress/actual/shared headers without sibling or unlinked leakage', async () => {
  await withDatabase(async (db) => {
    const h = await browserHarness(db);
    try {
      const fixture = await seedBrowserScenarios(h);
      const c = h.client();
      await c.login();
      for (const view of ['LINES', 'RECEIVED_UNITS']) {
        let afterId: string | undefined;
        const rows: Record<string, unknown>[] = [];
        let pages = 0;
        do {
          const response = await c.call('/purchasing/receiving/orders/query', {
            orderId: fixture.order.orderId,
            view,
            limit: 7,
            ...(afterId ? { afterId } : {}),
          });
          assert.equal(response.status, 200);
          const raw = await response.text();
          for (const secret of [
            'SIBLING-CARGO-PRIVATE',
            'SIBLING-DOC-PRIVATE',
            'SIBLING-RECEIPT-PRIVATE',
            'UNLINKED-CARGO-PRIVATE',
            fixture.sibling.orderId,
          ])
            assert.ok(!raw.includes(secret));
          const page = JSON.parse(raw) as {
            data: { items: Record<string, unknown>[]; nextAfterId?: string };
          };
          rows.push(...page.data.items);
          afterId = page.data.nextAfterId;
          pages++;
          assert.ok(pages < 10);
        } while (afterId);
        assert.ok(pages > 1);
        assert.equal(rows.length, view === 'LINES' ? 25 : 24);
        assert.equal(new Set(rows.map((r) => r.lineId ?? r.receivedUnitId)).size, rows.length);
        if (view === 'LINES') {
          const first = rows.find((r) => r.position === 1)!;
          assert.equal(first.unitWeightKg, '2000');
          assert.equal(first.orderedUnitCount, '30');
          assert.equal(first.acceptedUnitCount, '23');
          assert.equal(first.remainingUnitCount, '7');
        } else {
          assert.equal(
            new Set(rows.map((r) => (r.arrival as { arrivalId: string }).arrivalId)).size,
            1,
          );
          for (const row of rows) {
            const header = row.arrival as { originNetKg: string; destinationNetKg: string };
            assert.equal(header.originNetKg, '06000.12500');
            assert.equal(header.destinationNetKg, '6000.1200');
          }
          const changed = rows.find(
            (r) => (r.actual as { unitWeightKg: string }).unitWeightKg === '2100',
          )!;
          assert.equal((changed.original as { unitWeightKg: string }).unitWeightKg, '2000');
          assert.equal((changed.acceptance as { changedW1: boolean }).changedW1, true);
        }
      }
    } finally {
      await h.app.stop();
    }
  });
});
void test('P1 raw duplicate security headers fail closed and browser/legacy login failures share one budget', async () => {
  await withDatabase(async (db) => {
    const h = await browserHarness(db);
    try {
      const c = h.client();
      await c.login();
      const body = JSON.stringify({ catalogue: 'COLOR' });
      const headers = {
        Host: new URL(h.origin).host,
        Origin: h.origin,
        'X-Erp-Browser': '1',
        'Sec-Fetch-Site': 'same-origin',
        'X-Erp-Role': 'ACT-PROC',
        'X-Erp-Csrf': c.csrf,
        Cookie: c.cookie,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
      };
      for (const duplicate of [
        'Host',
        'Origin',
        'X-Erp-Browser',
        'X-Erp-Role',
        'X-Erp-Csrf',
        'Cookie',
      ] as const) {
        const raw = [...Object.entries(headers).flat(), duplicate, headers[duplicate]];
        const status = await new Promise<number>((resolve, reject) => {
          const request = httpRequest(
            h.origin + '/ui-api/purchasing/inbound-catalogues/query',
            { method: 'POST', headers: raw },
            (response) => {
              response.resume();
              resolve(response.statusCode!);
            },
          );
          request.on('error', reject);
          request.end(body);
        });
        assert.ok([400, 401, 403].includes(status), duplicate + ' must fail closed');
      }
      const denied = {
        username: 'receipt.act-proc',
        password: 'deliberately incorrect synthetic password',
      };
      for (let i = 0; i < 3; i++)
        assert.equal(
          (
            await fetch(h.origin + '/identity/login', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(denied),
            })
          ).status,
          401,
        );
      for (let i = 0; i < 2; i++)
        assert.equal((await c.call('/identity/login', denied)).status, 401);
      const limited = await c.call('/identity/login', denied);
      assert.equal(limited.status, 503);
      assert.equal(limited.headers.get('retry-after'), '60');
      assert.equal(
        (
          await fetch(h.origin + '/identity/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(denied),
          })
        ).status,
        503,
      );
    } finally {
      await h.app.stop();
    }
  });
});

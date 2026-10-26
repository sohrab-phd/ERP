import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import type { CommandRequest, JsonValue } from '@navard/shared-kernel';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import { browserHarness, browserReceivingLocation } from '../support/browser-harness.js';
import { optionCommand, orderCommand } from '../support/inbound-harness.js';
import { request } from '../support/synthetic-command.js';

const confirm = '/purchasing/receiving/confirm',
  arrival = '/purchasing/receiving/arrivals/query',
  progress = '/purchasing/receiving/orders/query';
type Row = Record<string, unknown>;
type Mutable = { [key: string]: JsonValue };
type MutableCommand = Omit<CommandRequest, 'payload' | 'preconditions'> & {
  payload: Mutable;
  preconditions: Mutable;
};
async function data(response: Response): Promise<Row> {
  assert.equal(response.status, 200);
  return ((await response.json()) as { data: Row }).data;
}
async function setup(db: DatabaseFixture) {
  const h = await browserHarness(db),
    proc = h.client(),
    wh = h.client('ACT-WH');
  const p = await proc.login(),
    w = await wh.login();
  assert.equal(p.self.browser.receivingLocation, undefined);
  assert.deepEqual(w.self.browser.receivingLocation, browserReceivingLocation);
  const material = optionCommand('MATERIAL_TYPE', 'COIL');
  assert.equal((await proc.call('/purchasing/inbound-catalogues', material)).status, 200);
  async function order() {
    const template = orderCommand(material.target.id);
    const command = {
      ...template,
      payload: { ...template.payload, orderReference: 'P2-' + randomUUID() },
    };
    assert.equal((await proc.call('/purchasing/operational-orders', command)).status, 200);
    const original = await data(
      await wh.call('/purchasing/operational-orders/' + command.target.id),
    );
    return {
      orderId: command.target.id,
      lineId: String((original.lines as Row[])[0]!.lineId),
      original,
    };
  }
  const original = await order();
  function command(count = 1, expected = '0', linked = original): MutableCommand {
    const waybillId = randomUUID(),
      receiptId = randomUUID();
    const line = (linked.original.lines as Row[])[0]!;
    return request({
      command: 'ConfirmPurchaseReceiving',
      target: { kind: 'inbound-arrival', id: randomUUID() },
      payload: {
        arrivalDateJalali: '1403-12-30',
        originNetKg: '09007199254740993.12500',
        destinationNetKg: '9007199254740993.1200',
        weightSourceWaybillId: waybillId,
        truckNumber: 'کامیون ۱۲',
        originatingCompany: 'مبدأ واقعی آزمون',
        driverName: 'راننده آزمون',
        waybills: [
          { waybillId, reference: 'WB-' + randomUUID(), yellowCopyReference: 'برگ زرد ۱۲' },
        ],
        warehouseReceipts: [{ receiptId, reference: 'WR-' + randomUUID() }],
        units: Array.from({ length: count }, () => ({
          receivedUnitId: randomUUID(),
          waybillId,
          receiptId,
          internalSystemCode: 'P2-' + randomUUID(),
          productNumber: 'محصول مستقل',
          association: { kind: 'ORDER_LINE', orderId: linked.orderId, lineId: linked.lineId },
          actual: {
            materialTypeOptionId: material.target.id,
            widthM: String(line.widthM),
            thicknessMm: String(line.thicknessMm),
            unitWeightKg: String(line.unitWeightKg),
          },
          acceptance: { confirmed: true },
          locationId: browserReceivingLocation.id,
        })),
      },
      preconditions: {
        lineProgress: [
          { orderId: linked.orderId, lineId: linked.lineId, expectedAcceptedUnitCount: expected },
        ],
      },
    });
  }
  return { ...h, proc, wh, order, original, command };
}
async function counts(db: DatabaseFixture) {
  return (
    await db.owner.query<{
      arrivals: number;
      units: number;
      ledger: number;
      origins: number;
    }>(`SELECT
    (SELECT count(*)::int FROM procurement.inbound_arrival) arrivals,
    (SELECT count(*)::int FROM procurement.inbound_received_unit) units,
    (SELECT count(*)::int FROM inventory.ledger) ledger,
    (SELECT count(*)::int FROM inventory.inbound_unit_origin) origins`)
  ).rows[0]!;
}
void test('P2 browser routes retain exact admission, current roles, CSRF, expiry and legacy compatibility', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const c = h.command();
      for (const role of ['ACT-PROC', 'ACT-SEC', 'ACT-CUST'] as const) {
        const user = h.client(role);
        await user.login();
        for (const path of [confirm, arrival])
          assert.equal(
            (await user.call(path, path === confirm ? c : { arrivalId: c.target.id })).status,
            403,
          );
        assert.equal((await user.call(confirm, c, { 'x-erp-role': 'ACT-WH' })).status, 403);
      }
      for (const headers of [
        { origin: 'https://evil.invalid' },
        { 'x-erp-csrf': '' },
        { 'sec-fetch-site': 'same-site' },
      ])
        assert.equal((await h.wh.call(confirm, c, headers)).status, 403);
      assert.equal((await h.wh.call(confirm, '{bad')).status, 400);
      assert.equal((await h.wh.call('/purchasing/receiving/not-a-route', {})).status, 404);
      assert.equal(
        (await h.wh.call(confirm, { ...c, payload: { ...c.payload, padding: 'x'.repeat(262144) } }))
          .status,
        400,
      );
      assert.equal((await h.legacy(confirm, c, 'ACT-WH')).status, 200);
      assert.equal((await h.wh.call(confirm, c)).status, 200);
      await db.owner.query("DELETE FROM identity.role_grant WHERE actor_role='ACT-WH'");
      assert.equal((await h.wh.call(arrival, { arrivalId: c.target.id })).status, 403);
      await db.owner.query(
        "UPDATE identity.session SET created_at=clock_timestamp()-interval '9 hours',last_seen_at=clock_timestamp()-interval '1 hour',expires_at=clock_timestamp()-interval '1 second'",
      );
      assert.equal((await h.wh.call(confirm, c)).status, 401);
    } finally {
      await h.app.stop();
    }
  });
});
void test('P2 all eleven fields preserve exact header/unit originals; stock uses W1 only', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const c = h.command(2);
      assert.equal((await h.wh.call(confirm, c)).status, 200);
      const canonical = await data(await h.wh.call(arrival, { arrivalId: c.target.id }));
      const header = canonical.arrival as Row,
        units = canonical.items as Row[];
      for (const name of [
        'arrivalDateJalali',
        'originNetKg',
        'destinationNetKg',
        'truckNumber',
        'originatingCompany',
        'driverName',
      ])
        assert.equal(header[name], c.payload[name]);
      assert.equal(units.length, 2);
      const input = c.payload.units as Mutable[];
      for (let i = 0; i < units.length; i++) {
        const u = units[i]!,
          entered = input.find((v) => v.receivedUnitId === u.receivedUnitId)!;
        assert.equal(u.internalSystemCode, entered.internalSystemCode);
        assert.equal(u.productNumber, entered.productNumber);
        assert.equal((u.waybill as Row).reference, (c.payload.waybills as Mutable[])[0]!.reference);
        assert.equal((u.waybill as Row).yellowCopyReference, 'برگ زرد ۱۲');
        assert.equal(
          (u.warehouseReceipt as Row).reference,
          (c.payload.warehouseReceipts as Mutable[])[0]!.reference,
        );
        assert.equal((u.actual as Row).widthM, (entered.actual as Mutable).widthM);
        assert.ok((u.inventory as Row).unitId);
        assert.ok((u.original as Row).lineId);
      }
      const stock = await db.owner.query<{ kg: string }>(
        'SELECT on_hand_delta::text kg FROM inventory.ledger ORDER BY unit_id',
      );
      assert.deepEqual(
        stock.rows.map((r) => r.kg),
        input.map((u) => (u.actual as { unitWeightKg: string }).unitWeightKg),
      );
      const read = await data(
        await h.wh.call('/purchasing/operational-orders/' + h.original.orderId),
      );
      assert.deepEqual(read, h.original.original);
    } finally {
      await h.app.stop();
    }
  });
});
void test('P2 optional omission, subsequent partial arrival and stale progress rejection are durable', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const first = h.command();
      for (const name of ['destinationNetKg', 'truckNumber', 'originatingCompany', 'driverName'])
        delete first.payload[name];
      delete (first.payload.waybills as Mutable[])[0]!.yellowCopyReference;
      assert.equal((await h.wh.call(confirm, first)).status, 200);
      const one = await data(await h.wh.call(arrival, { arrivalId: first.target.id }));
      for (const name of ['destinationNetKg', 'truckNumber', 'originatingCompany', 'driverName'])
        assert.equal(Object.hasOwn(one.arrival as Row, name), false);
      const second = h.command(1, '1');
      assert.equal((await h.wh.call(confirm, second)).status, 200);
      const p = await data(
        await h.wh.call(progress, { orderId: h.original.orderId, view: 'LINES' }),
      );
      assert.equal((p.items as Row[])[0]!.acceptedUnitCount, '2');
      const stale = h.command(1, '0'),
        before = await counts(db);
      assert.equal((await h.wh.call(confirm, stale)).status, 422);
      assert.deepEqual(await counts(db), before);
      assert.equal((await h.wh.call(confirm, stale)).status, 422);
    } finally {
      await h.app.stop();
    }
  });
});
void test('P2 shared multi-order arrival pagination keeps sibling/unlinked cargo scoped and W2 once per header', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const other = await h.order(),
        c = h.command(3),
        units = c.payload.units as Mutable[];
      units[1]!.association = { kind: 'ORDER_LINE', orderId: other.orderId, lineId: other.lineId };
      units[2]!.association = { kind: 'UNLINKED' };
      units[2]!.acceptance = { confirmed: true, unordered: true };
      c.preconditions.lineProgress = [
        { orderId: h.original.orderId, lineId: h.original.lineId, expectedAcceptedUnitCount: '0' },
        { orderId: other.orderId, lineId: other.lineId, expectedAcceptedUnitCount: '0' },
      ];
      assert.equal((await h.wh.call(confirm, c)).status, 200);
      const ids: string[] = [];
      let afterId: string | undefined;
      do {
        const p = await data(
          await h.wh.call(arrival, {
            arrivalId: c.target.id,
            limit: 1,
            ...(afterId ? { afterId } : {}),
          }),
        );
        assert.ok(p.snapshotAt);
        assert.equal((p.arrival as Row).originNetKg, c.payload.originNetKg);
        ids.push(...(p.items as Row[]).map((u) => String(u.receivedUnitId)));
        afterId = p.nextAfterId as string | undefined;
      } while (afterId);
      assert.deepEqual(ids, units.map((u) => u.receivedUnitId).sort());
      assert.equal(new Set(ids).size, 3);
      const scoped = await data(
        await h.proc.call(progress, {
          orderId: h.original.orderId,
          view: 'RECEIVED_UNITS',
          limit: 1,
        }),
      );
      assert.equal((scoped.items as Row[]).length, 1);
      assert.equal((scoped.items as Row[])[0]!.receivedUnitId, units[0]!.receivedUnitId);
      assert.equal(scoped.nextAfterId, undefined);
      assert.equal((await h.proc.call(arrival, { arrivalId: c.target.id })).status, 403);
    } finally {
      await h.app.stop();
    }
  });
});
void test('P2 post-COMMIT lost response, concurrent repeats and changed-payload conflict create one bundle', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const c = h.command();
      h.loseNextReceivingResponse();
      await assert.rejects(h.wh.call(confirm, c));
      const committed = await counts(db);
      assert.deepEqual(committed, { arrivals: 1, units: 1, ledger: 1, origins: 1 });
      const replies = await Promise.all([h.wh.call(confirm, c), h.wh.call(confirm, c)]);
      for (const reply of replies) {
        assert.equal(reply.status, 200);
        assert.equal(((await reply.json()) as { replayed: boolean }).replayed, true);
      }
      assert.deepEqual(await counts(db), committed);
      assert.equal(
        (await h.wh.call(confirm, { ...c, payload: { ...c.payload, driverName: 'changed' } }))
          .status,
        409,
      );
      assert.deepEqual(await counts(db), committed);
    } finally {
      await h.app.stop();
    }
  });
});
void test('P2 audit failure rolls back receiving/IPS/outcome and immutable browser retry succeeds', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const c = h.command(),
        before = await counts(db);
      await db.owner.query(
        "CREATE FUNCTION envelope_test.p2_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.command='ConfirmPurchaseReceiving' THEN RAISE EXCEPTION 'injected audit failure'; END IF; RETURN NEW; END $$",
      );
      await db.owner.query(
        'CREATE TRIGGER p2_audit_failure BEFORE INSERT ON kernel.audit_event FOR EACH ROW EXECUTE FUNCTION envelope_test.p2_audit_failure()',
      );
      try {
        assert.equal((await h.wh.call(confirm, c)).status, 503);
        assert.deepEqual(await counts(db), before);
        for (const table of ['command_outcome', 'audit_event']) {
          const rows = await db.owner.query<{ count: number }>(
            `SELECT count(*)::int count FROM kernel.${table} WHERE command='ConfirmPurchaseReceiving'`,
          );
          assert.equal(rows.rows[0]!.count, 0);
        }
      } finally {
        await db.owner.query('DROP TRIGGER p2_audit_failure ON kernel.audit_event');
        await db.owner.query('DROP FUNCTION envelope_test.p2_audit_failure()');
      }
      assert.equal((await h.wh.call(confirm, c)).status, 200);
      assert.deepEqual(await counts(db), { arrivals: 1, units: 1, ledger: 1, origins: 1 });
    } finally {
      await h.app.stop();
    }
  });
});

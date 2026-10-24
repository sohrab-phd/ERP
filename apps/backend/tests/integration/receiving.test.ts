import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { compose } from '../../src/composition-root.js';
import {
  type CommandRequest,
  type ExecutionResult,
  type JsonObject,
  type JsonValue,
} from '@navard/shared-kernel';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import {
  inboundPeople,
  optionCommand,
  orderCommand,
  completed,
} from '../support/inbound-harness.js';
import { receiptCommand } from '../support/receipt-harness.js';
import { request } from '../support/synthetic-command.js';
import { PostgresInventoryInboundReceivingStore } from '../../src/infrastructure/postgresql/inventory-receiving-store.js';
import { lostCommitProxy } from '../support/crash-child.js';

const routes = {
  confirm: '/purchasing/receiving/confirm',
  arrival: '/purchasing/receiving/arrivals/query',
  progress: '/purchasing/receiving/orders/query',
  order: '/purchasing/operational-orders',
  option: '/purchasing/inbound-catalogues',
};
type MutableRecord = { [key: string]: JsonValue };
type MutableCommand = Omit<CommandRequest, 'payload' | 'preconditions'> & {
  payload: MutableRecord;
  preconditions: MutableRecord;
};
type Role = 'ACT-PROC' | 'ACT-WH' | 'ACT-SEC' | 'ACT-CUST';
interface Reply {
  status: number;
  body: Record<string, unknown>;
  raw: string;
}
function object(value: unknown): Record<string, unknown> {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}
function items(value: unknown): Record<string, unknown>[] {
  assert.ok(Array.isArray(value));
  return value.map(object);
}
async function setup(db: DatabaseFixture, databaseUrl = process.env.TEST_DATABASE_URL!) {
  const people = await inboundPeople(db);
  const app = compose({
    nodeEnv: 'production',
    host: '127.0.0.1',
    port: 0,
    databaseUrl,
    installationId: people.factory,
    logLevel: 'error',
    commandAdmissionReconciled: true,
  });
  await app.start();
  const address = app.server.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  const tokens = new Map<Role, string>([
    ['ACT-PROC', people.proc.token],
    ['ACT-WH', people.wh.token],
    ['ACT-SEC', people.sec.token],
  ]);
  const customer = await people.person('ACT-CUST');
  tokens.set('ACT-CUST', customer.token);
  async function call(
    path: string,
    input: unknown,
    role: Role = 'ACT-WH',
    token?: string,
  ): Promise<Reply> {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token ?? tokens.get(role)!}`,
        'x-erp-role': role,
        'content-type': 'application/json; charset=utf-8',
      },
      body: typeof input === 'string' ? input : JSON.stringify(input),
    });
    const raw = await response.text();
    return { status: response.status, body: object(JSON.parse(raw)), raw };
  }
  async function accept(path: string, command: CommandRequest, role: Role = 'ACT-WH') {
    const response = await call(path, command, role);
    assert.equal(response.status, 200, response.raw);
    completed(response.body as unknown as ExecutionResult, 'accepted');
    return response;
  }
  const material = optionCommand('MATERIAL_TYPE', 'COIL');
  await accept(routes.option, material, 'ACT-PROC');
  async function order(count = '5', weight = '2000', optionalFields: MutableRecord = {}) {
    const template = orderCommand(material.target.id);
    const command = {
      ...template,
      payload: {
        ...template.payload,
        orderReference: 'PO-' + randomUUID(),
        lines: [
          {
            materialTypeOptionId: material.target.id,
            widthM: '1.200',
            thicknessMm: '0.35',
            unitWeightKg: weight,
            orderedUnitCount: count,
            ...optionalFields,
          },
        ],
      },
    };
    await accept(routes.order, command, 'ACT-PROC');
    const lookup = await fetch(`http://127.0.0.1:${port}${routes.order}/${command.target.id}`, {
      headers: { authorization: `Bearer ${people.wh.token}`, 'x-erp-role': 'ACT-WH' },
    });
    assert.equal(lookup.status, 200);
    const projection = object(object(await lookup.json()).data);
    const first = items(projection.lines)[0]!;
    return { command, orderId: command.target.id, lineId: first.lineId as string, projection };
  }
  return { people, app, call, accept, material: material.target.id, order };
}
type Server = Awaited<ReturnType<typeof setup>>;
type Original = Awaited<ReturnType<Server['order']>>;
function arrival(h: Server, original?: Original, count = 1, expected = '0'): MutableCommand {
  const waybillId = randomUUID(),
    receiptId = randomUUID();
  return request({
    command: 'ConfirmPurchaseReceiving',
    target: { kind: 'inbound-arrival', id: randomUUID() },
    payload: {
      arrivalDateJalali: '1403-12-30',
      originNetKg: '06000.12500',
      destinationNetKg: '6000.1200',
      weightSourceWaybillId: waybillId,
      waybills: [{ waybillId, reference: 'WB-' + randomUUID() }],
      warehouseReceipts: [{ receiptId, reference: 'WR-' + randomUUID() }],
      units: Array.from({ length: count }, () => ({
        receivedUnitId: randomUUID(),
        waybillId,
        receiptId,
        internalSystemCode: 'UNIT-' + randomUUID(),
        productNumber: 'محصول مشترک',
        association: original
          ? { kind: 'ORDER_LINE', orderId: original.orderId, lineId: original.lineId }
          : { kind: 'UNLINKED' },
        actual: {
          materialTypeOptionId: h.material,
          widthM: '1.200',
          thicknessMm: '0.35',
          unitWeightKg: '2000',
        },
        acceptance: { confirmed: true, ...(original ? {} : { unordered: true }) },
        locationId: randomUUID(),
      })),
    },
    preconditions: {
      lineProgress: original
        ? [
            {
              orderId: original.orderId,
              lineId: original.lineId,
              expectedAcceptedUnitCount: expected,
            },
          ]
        : [],
    },
  });
}
function sourceUnits(command: CommandRequest): MutableRecord[] {
  return command.payload.units as MutableRecord[];
}
function replace(command: CommandRequest, payload: JsonObject): CommandRequest {
  return {
    ...command,
    idempotency_key: randomUUID(),
    target: { ...command.target, id: randomUUID() },
    payload,
  };
}
async function counts(db: DatabaseFixture) {
  return (
    await db.owner.query<{
      arrivals: number;
      sources: number;
      origins: number;
      units: number;
      ledger: number;
      kg: string;
    }>(
      `SELECT (SELECT count(*)::int FROM procurement.inbound_arrival) AS arrivals,
      (SELECT count(*)::int FROM procurement.inbound_received_unit) AS sources,
      (SELECT count(*)::int FROM inventory.inbound_unit_origin) AS origins,
      (SELECT count(*)::int FROM inventory.unit) AS units,
      (SELECT count(*)::int FROM inventory.ledger) AS ledger,
      (SELECT COALESCE(sum(on_hand_delta),0)::text FROM inventory.ledger) AS kg`,
    )
  ).rows[0]!;
}
async function reject(h: Server, command: CommandRequest, family?: string) {
  const response = await h.call(routes.confirm, command);
  assert.equal(response.status, 422, response.raw);
  completed(response.body as unknown as ExecutionResult, 'rejected', family);
  return response;
}

/** Both distinct authenticated transactions must wait on the same real identity lock. */
async function receivingIdentityRace(
  db: DatabaseFixture,
  resource: string,
  first: () => Promise<Reply>,
  second: () => Promise<Reply>,
): Promise<Reply[]> {
  const blocker = await db.owner.connect();
  let running: Promise<Reply>[] = [];
  try {
    await blocker.query('BEGIN');
    const pid = (await blocker.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!
      .pid;
    await blocker.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [resource]);
    running = [first(), second()];
    for (const operation of running) void operation.catch(() => undefined);
    let observed = false;
    try {
      for (let n = 0; n < 400; n++) {
        const waiters = (
          await db.owner.query<{ count: number }>(
            "SELECT count(DISTINCT pid)::int AS count FROM pg_locks WHERE locktype='advisory' AND NOT granted AND $1=ANY(pg_blocking_pids(pid))",
            [pid],
          )
        ).rows[0]!.count;
        if (waiters >= 2) {
          observed = true;
          break;
        }
        await delay(25);
      }
      assert.equal(observed, true, 'Both real transactions must contend for the shared identity');
    } finally {
      await blocker.query('ROLLBACK');
    }
    return await Promise.all(running);
  } finally {
    await blocker.query('ROLLBACK');
    blocker.release();
    await Promise.allSettled(running);
  }
}

void test('I2-A01/A03/A10/A14/A20: five ordered units, three separately coded received units post exactly 6000kg and leave two outstanding', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const original = await h.order();
      const command = arrival(h, original, 3);
      const result = await h.accept(routes.confirm, command);
      assert.equal(object(result.body.result).event, 'PurchaseReceivingConfirmed');
      assert.deepEqual(await counts(db), {
        arrivals: 1,
        sources: 3,
        origins: 3,
        units: 3,
        ledger: 3,
        kg: '6000',
      });
      const progress = await h.call(
        routes.progress,
        { orderId: original.orderId, view: 'LINES' },
        'ACT-PROC',
      );
      assert.equal(progress.status, 200, progress.raw);
      assert.ok(progress.raw.includes('2'), 'remaining count must be present');
      const lines = items(object(progress.body.data).items);
      assert.equal(lines[0]!.acceptedUnitCount, '3');
      assert.equal(lines[0]!.remainingUnitCount, '2');
      const order = await db.owner.query(
        'SELECT unit_weight_kg_text AS kg,ordered_unit_count_text AS count FROM procurement.operational_purchase_order_line WHERE line_id=$1',
        [original.lineId],
      );
      assert.deepEqual(order.rows, [{ kg: '2000', count: '5' }]);
      const rawCodes = sourceUnits(command).map((u) => u.internalSystemCode);
      assert.equal(new Set(rawCodes).size, 3);
      const stored = await db.owner.query('SELECT DISTINCT source_fact_id FROM inventory.ledger');
      assert.equal(stored.rowCount, 3);
      const origins = (
        await db.owner.query(
          'SELECT unit_id,lot_id,received_unit_id FROM inventory.inbound_unit_origin ORDER BY received_unit_id',
        )
      ).rows as { unit_id: string; lot_id: string; received_unit_id: string }[];
      const tx = await db.transactions.begin('read-snapshot');
      try {
        const adapter = new PostgresInventoryInboundReceivingStore();
        const actor = await h.people.wh.actor();
        for (const source of origins) {
          for (const [kind, id] of [
            ['UNIT', source.unit_id],
            ['LOT', source.lot_id],
            ['RECEIVING_UNIT', source.received_unit_id],
          ] as const) {
            const facts = await adapter.traceSources(
              { actor, transaction: tx.context, customerId: randomUUID() },
              kind,
              id,
            );
            assert.equal(facts.length, 1);
            assert.equal(facts[0]!.receivedUnitId, source.received_unit_id);
            assert.equal(facts[0]!.acceptedUnitWeightKg, '2000');
            assert.equal(facts[0]!.originKind, 'WH_ACCEPTED_RECEIVING_UNIT');
          }
        }
        const absent = await adapter.traceSources(
          { actor, transaction: tx.context, customerId: randomUUID() },
          'RECEIVING_UNIT',
          randomUUID(),
        );
        assert.equal(absent.length, 0);
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally {
        await tx.release();
      }
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A01/A11: two arrivals increment only their actual received physical units and preserve order history', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const original = await h.order();
      await h.accept(routes.confirm, arrival(h, original, 3));
      await h.accept(routes.confirm, arrival(h, original, 1, '3'));
      assert.deepEqual(await counts(db), {
        arrivals: 2,
        sources: 4,
        origins: 4,
        units: 4,
        ledger: 4,
        kg: '8000',
      });
      const q = await h.call(
        routes.progress,
        { orderId: original.orderId, view: 'LINES' },
        'ACT-PROC',
      );
      assert.equal(q.status, 200, q.raw);
      const line = items(object(q.body.data).items)[0]!;
      assert.equal(line.acceptedUnitCount, '4');
      assert.equal(line.remainingUnitCount, '1');
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A02/A12/A14: one shared multi-PO consignment owns weights once and PROC sees driver but no unrelated PO or units', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const a = await h.order(),
        b = await h.order();
      const command = arrival(h, a, 2);
      const units = sourceUnits(command);
      units[1]!.association = { kind: 'ORDER_LINE', orderId: b.orderId, lineId: b.lineId };
      command.payload.driverName = 'راننده مستند';
      command.payload.truckNumber = 'کامیون مشترک';
      command.payload.originatingCompany = 'مبدأ مستند';
      (command.payload.waybills as MutableRecord[])[0]!.yellowCopyReference = 'برگ زرد';
      command.preconditions.lineProgress = [
        { orderId: a.orderId, lineId: a.lineId, expectedAcceptedUnitCount: '0' },
        { orderId: b.orderId, lineId: b.lineId, expectedAcceptedUnitCount: '0' },
      ];
      await h.accept(routes.confirm, command);
      const header = await db.owner.query(
        'SELECT origin_net_kg_text AS origin_net_kg,destination_net_kg_text AS destination_net_kg FROM procurement.inbound_arrival',
      );
      assert.deepEqual(header.rows, [
        { origin_net_kg: '06000.12500', destination_net_kg: '6000.1200' },
      ]);
      assert.equal((await db.owner.query('SELECT * FROM procurement.inbound_waybill')).rowCount, 1);
      for (const [own, unrelated] of [
        [a, b],
        [b, a],
      ]) {
        const q = await h.call(
          routes.progress,
          { orderId: own!.orderId, view: 'RECEIVED_UNITS' },
          'ACT-PROC',
        );
        assert.equal(q.status, 200, q.raw);
        assert.ok(q.raw.includes('راننده مستند'));
        assert.ok(q.raw.includes('06000.12500'));
        assert.ok(q.raw.includes('برگ زرد'));
        assert.ok(!q.raw.includes(unrelated!.orderId));
        const ownIndex = own === a ? 0 : 1,
          otherIndex = ownIndex === 0 ? 1 : 0;
        assert.ok(q.raw.includes(sourceUnits(command)[ownIndex]!.internalSystemCode as string));
        assert.ok(!q.raw.includes(sourceUnits(command)[otherIndex]!.internalSystemCode as string));
      }
      assert.equal(
        (await h.call(routes.arrival, { arrivalId: command.target.id }, 'ACT-PROC')).status,
        403,
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A06/A07: accepted changed W1 and actual dimensions retain immutable ordered facts and trusted approval', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const original = await h.order(),
        command = arrival(h, original);
      const unit = sourceUnits(command)[0]!;
      unit.actual = { ...object(unit.actual), widthM: '1.250', unitWeightKg: '2100' };
      unit.acceptance = { confirmed: true, changedW1: true, specificationMismatch: true };
      unit.weightEvidenceReference = 'تایید شخصی انباردار';
      await h.accept(routes.confirm, command);
      assert.equal((await counts(db)).kg, '2100');
      const row = (
        await db.owner.query<Record<string, unknown>>(
          'SELECT original,actual,comparison,subject,actor_role FROM procurement.inbound_received_unit',
        )
      ).rows[0]!;
      assert.ok(JSON.stringify(row.original).includes('2000'));
      assert.ok(JSON.stringify(row.actual).includes('2100'));
      assert.ok(JSON.stringify(row.comparison).includes('unitWeightKg'));
      assert.equal(row.actor_role, 'ACT-WH');
      assert.ok(row.subject);
      const unapproved = arrival(h, original, 1, '1');
      sourceUnits(unapproved)[0]!.actual = unit.actual;
      await reject(h, unapproved);
      assert.equal((await counts(db)).units, 1);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A08/A09: explicitly accepted excess, ORDER_ONLY and UNLINKED goods neither invent nor modify order lines', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const original = await h.order('1'),
        command = arrival(h, original, 3);
      sourceUnits(command)[0]!.acceptance = { confirmed: true };
      sourceUnits(command)[1]!.association = { kind: 'ORDER_ONLY', orderId: original.orderId };
      sourceUnits(command)[1]!.acceptance = { confirmed: true, unordered: true };
      sourceUnits(command)[2]!.association = { kind: 'UNLINKED' };
      sourceUnits(command)[2]!.acceptance = { confirmed: true, unordered: true };
      await h.accept(routes.confirm, command);
      const excess = arrival(h, original, 1, '1');
      sourceUnits(excess)[0]!.acceptance = { confirmed: true, excess: true };
      await h.accept(routes.confirm, excess);
      assert.equal((await counts(db)).units, 4);
      assert.equal(
        (await db.owner.query('SELECT * FROM procurement.operational_purchase_order_line'))
          .rowCount,
        1,
      );
      const q = await h.call(
        routes.progress,
        { orderId: original.orderId, view: 'LINES' },
        'ACT-PROC',
      );
      const line = items(object(q.body.data).items)[0]!;
      assert.equal(line.acceptedUnitCount, '2');
      assert.equal(line.remainingUnitCount, '0');
      assert.equal(line.excessUnitCount, '1');
      const q2 = await h.call(
        routes.progress,
        { orderId: original.orderId, view: 'RECEIVED_UNITS' },
        'ACT-PROC',
      );
      assert.ok(q2.raw.includes(sourceUnits(command)[1]!.internalSystemCode as string));
      assert.ok(!q2.raw.includes(sourceUnits(command)[2]!.internalSystemCode as string));
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A07/A13/A14: ordered optional specifications remain immutable while actual selected, absent and not-recorded attributes are independently visible', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const red = optionCommand('COLOR', 'رنگ سفارش قرمز'),
        gradeA = optionCommand('QUALITY_GRADE', 'کیفیت سفارش الف'),
        blue = optionCommand('COLOR', 'رنگ دریافتی آبی'),
        gradeB = optionCommand('QUALITY_GRADE', 'کیفیت دریافتی ب'),
        sheet = optionCommand('MATERIAL_TYPE', 'SHEET');
      for (const option of [red, gradeA]) await h.accept(routes.option, option, 'ACT-PROC');
      for (const option of [blue, gradeB, sheet]) await h.accept(routes.option, option, 'ACT-WH');
      const original = await h.order('2', '2000', {
        itemNumber: 'آیتم اصلی',
        colorOptionId: red.target.id,
        qualityGradeOptionId: gradeA.target.id,
        ralColorNumber: 'RAL-3000',
        lengthM: '2.000',
      });
      const input = arrival(h, original, 2);
      const [first, second] = sourceUnits(input);
      first!.actual = {
        ...object(first!.actual),
        materialTypeOptionId: sheet.target.id,
        widthM: '1.2',
        thicknessMm: '0.350',
        colorOptionId: blue.target.id,
        qualityGradeOptionId: gradeB.target.id,
        ralColorNumber: null,
        lengthM: '2.0',
      };
      first!.acceptance = { confirmed: true, specificationMismatch: true };
      second!.actual = { ...object(second!.actual), colorOptionId: null, lengthM: null };
      second!.acceptance = { confirmed: true, specificationMismatch: true };
      await h.accept(routes.confirm, input);
      const persisted = await db.owner.query(
        'SELECT color_option_id,quality_grade_option_id,ral_color_number,length_m_text,item_number FROM procurement.operational_purchase_order_line WHERE line_id=$1',
        [original.lineId],
      );
      assert.deepEqual(persisted.rows, [
        {
          color_option_id: red.target.id,
          quality_grade_option_id: gradeA.target.id,
          ral_color_number: 'RAL-3000',
          length_m_text: '2.000',
          item_number: 'آیتم اصلی',
        },
      ]);
      const reply = await h.call(
        routes.progress,
        { orderId: original.orderId, view: 'RECEIVED_UNITS' },
        'ACT-PROC',
      );
      assert.equal(reply.status, 200, reply.raw);
      const byId = new Map(
        items(object(reply.body.data).items).map((row) => [row.receivedUnitId, row]),
      );
      assert.equal(byId.size, 2);
      for (const row of byId.values()) {
        const old = object(row.original);
        assert.equal(object(old.color).optionId, red.target.id);
        assert.equal(object(old.qualityGrade).optionId, gradeA.target.id);
        assert.equal(old.ralColorNumber, 'RAL-3000');
        assert.equal(old.lengthM, '2.000');
        assert.equal(object(row.receivingActor).role, 'ACT-WH');
      }
      const receivedFirst = byId.get(first!.receivedUnitId)!;
      const observed = object(receivedFirst.actual),
        comparison = object(receivedFirst.comparison);
      assert.equal(object(observed.materialType).optionId, sheet.target.id);
      assert.equal(object(observed.color).optionId, blue.target.id);
      assert.equal(object(observed.qualityGrade).optionId, gradeB.target.id);
      assert.equal(observed.ralColorNumber, null);
      assert.equal(observed.lengthM, '2.0');
      for (const attribute of ['widthM', 'thicknessMm', 'lengthM'])
        assert.equal(object(comparison[attribute]).state, 'SAME');
      for (const attribute of ['materialType', 'color', 'qualityGrade'])
        assert.equal(object(comparison[attribute]).state, 'CHANGED');
      assert.equal(object(comparison.ralColorNumber).state, 'CONFIRMED_ABSENT');
      const receivedSecond = byId.get(second!.receivedUnitId)!;
      const actualSecond = object(receivedSecond.actual),
        comparisonSecond = object(receivedSecond.comparison);
      assert.equal(actualSecond.color, null);
      assert.equal(actualSecond.lengthM, null);
      assert.equal(Object.hasOwn(actualSecond, 'qualityGrade'), false);
      assert.equal(Object.hasOwn(actualSecond, 'ralColorNumber'), false);
      for (const attribute of ['color', 'lengthM'])
        assert.equal(object(comparisonSecond[attribute]).state, 'CONFIRMED_ABSENT');
      for (const attribute of ['qualityGrade', 'ralColorNumber'])
        assert.equal(object(comparisonSecond[attribute]).state, 'NOT_RECORDED');
      assert.deepEqual(
        (await db.owner.query('SELECT kind FROM inventory.unit ORDER BY kind')).rows,
        [{ kind: 'COIL' }, { kind: 'SHEET' }],
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A10: missing mandatory fields reject atomically while every absent optional receiving field remains permitted', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      for (const field of ['arrivalDateJalali', 'originNetKg', 'weightSourceWaybillId']) {
        const input = arrival(h);
        delete input.payload[field];
        await reject(h, input);
      }
      for (const field of ['internalSystemCode', 'productNumber']) {
        const input = arrival(h);
        delete sourceUnits(input)[0]![field];
        await reject(h, input);
      }
      for (const field of ['waybills', 'warehouseReceipts']) {
        const input = arrival(h);
        input.payload[field] = [];
        await reject(h, input);
      }
      assert.equal((await counts(db)).units, 0);
      const input = arrival(h);
      delete input.payload.destinationNetKg;
      await h.accept(routes.confirm, input);
      assert.equal((await counts(db)).units, 1);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A11/A12: finite Jalali profile and exact documented decimal kilograms are validated without whole-W1 coercion', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      for (const date of ['1205-12-29', '1499-01-01', '1402-12-30', '1403-07-31', '1403-00-01']) {
        const input = arrival(h);
        input.payload.arrivalDateJalali = date;
        await reject(h, input);
      }
      for (const kg of ['-1', '+1', '1e3', '۱۲۰۰', '1,200', 'NaN']) {
        const input = arrival(h);
        input.payload.originNetKg = kg;
        await reject(h, input);
      }
      const input = arrival(h);
      input.payload.originNetKg = '0000.00000000000000000001';
      input.payload.destinationNetKg = '0000.00000';
      await h.accept(routes.confirm, input);
      const row = (
        await db.owner.query<Record<string, unknown>>(
          'SELECT origin_net_kg_text AS origin_net_kg,destination_net_kg_text AS destination_net_kg FROM procurement.inbound_arrival',
        )
      ).rows[0];
      assert.deepEqual(row, {
        origin_net_kg: '0000.00000000000000000001',
        destination_net_kg: '0000.00000',
      });
      assert.equal((await counts(db)).kg, '2000');
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A04/A05: duplicate code, waybill and external receipt numbers are rejected; identities do not inherit PO normalization', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const first = arrival(h);
      await h.accept(routes.confirm, first);
      for (const field of ['internalSystemCode', 'waybill', 'receipt']) {
        const next = arrival(h);
        if (field === 'internalSystemCode')
          sourceUnits(next)[0]!.internalSystemCode = sourceUnits(first)[0]!.internalSystemCode!;
        else if (field === 'waybill')
          (next.payload.waybills as MutableRecord[])[0]!.reference = (
            first.payload.waybills as MutableRecord[]
          )[0]!.reference!;
        else
          (next.payload.warehouseReceipts as MutableRecord[])[0]!.reference = (
            first.payload.warehouseReceipts as MutableRecord[]
          )[0]!.reference!;
        await reject(h, next);
      }
      const distinct = arrival(h);
      sourceUnits(distinct)[0]!.internalSystemCode =
        ' ' + (sourceUnits(first)[0]!.internalSystemCode as string) + ' ';
      (distinct.payload.waybills as MutableRecord[])[0]!.reference =
        ' ' + ((first.payload.waybills as MutableRecord[])[0]!.reference as string) + ' ';
      (distinct.payload.warehouseReceipts as MutableRecord[])[0]!.reference = (
        (first.payload.warehouseReceipts as MutableRecord[])[0]!.reference as string
      ).toLowerCase();
      await h.accept(routes.confirm, distinct);
      assert.equal((await counts(db)).units, 2);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A04/A18: independent concurrent requests sharing a code admit exactly one source and stock effect', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const a = arrival(h),
        b = arrival(h);
      sourceUnits(b)[0]!.internalSystemCode = sourceUnits(a)[0]!.internalSystemCode!;
      const secondWh = await h.people.person('ACT-WH');
      const replies = await Promise.all([
        h.call(routes.confirm, a),
        h.call(routes.confirm, b, 'ACT-WH', secondWh.token),
      ]);
      assert.deepEqual(replies.map((r) => r.status).sort(), [200, 422]);
      assert.deepEqual(await counts(db), {
        arrivals: 1,
        sources: 1,
        origins: 1,
        units: 1,
        ledger: 1,
        kg: '2000',
      });
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A08/A18: concurrent stale partial-delivery intents cannot silently become excess acceptance', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const original = await h.order('1'),
        a = arrival(h, original),
        b = arrival(h, original);
      const replies = await Promise.all([h.call(routes.confirm, a), h.call(routes.confirm, b)]);
      assert.deepEqual(replies.map((r) => r.status).sort(), [200, 422]);
      const rejected = replies.find((r) => r.status === 422)!;
      assert.equal(object(rejected.body.result).family, 'GUARD_CONFLICT');
      assert.equal((await counts(db)).units, 1);
    } finally {
      await h.app.stop();
    }
  });
});
for (const pair of ['legacy/legacy', 'legacy/I2'] as const)
  void test(`I2-A04/A18/A22: ${pair} confirmations contend on one physical code and cannot leave duplicate stock or orphan claims`, async () => {
    await withDatabase(async (db) => {
      const h = await setup(db);
      try {
        const first = receiptCommand();
        const code = 'cross-path-' + randomUUID();
        const legacy = { ...first, payload: { ...first.payload, internalCode: code } };
        const otherWh = await h.people.person('ACT-WH');
        let second: CommandRequest;
        if (pair === 'legacy/legacy') {
          const template = receiptCommand();
          second = { ...template, payload: { ...template.payload, internalCode: code } };
        } else {
          second = arrival(h);
          sourceUnits(second)[0]!.internalSystemCode = code;
        }
        const replies = await receivingIdentityRace(
          db,
          `procurement-physical-code/${h.people.factory}/${code}`,
          () => h.call('/receipts/post', legacy),
          () =>
            h.call(
              pair === 'legacy/legacy' ? '/receipts/post' : routes.confirm,
              second,
              'ACT-WH',
              otherWh.token,
            ),
        );
        assert.deepEqual(replies.map((reply) => reply.status).sort(), [200, 422]);
        assert.equal(
          object(replies.find((reply) => reply.status === 422)!.body.result).family,
          'GUARD_CONFLICT',
        );
        const state = await counts(db);
        const i2Won = pair === 'legacy/I2' && replies[1]!.status === 200;
        assert.equal(state.units, 1);
        assert.equal(state.ledger, 1);
        assert.equal(state.kg, i2Won ? '2000' : '11');
        assert.equal(state.sources, i2Won ? 1 : 0);
        assert.equal(state.origins, i2Won ? 1 : 0);
        const claims = await db.owner.query<{
          raw_code: string;
          legacy_receipt_id: string | null;
          received_unit_id: string | null;
        }>(
          'SELECT raw_code,legacy_receipt_id,received_unit_id FROM procurement.inbound_physical_code_claim',
        );
        assert.equal(claims.rowCount, 1);
        assert.equal(claims.rows[0]!.raw_code, code);
        assert.equal(claims.rows[0]!.legacy_receipt_id, i2Won ? null : legacy.target.id);
        assert.equal(
          claims.rows[0]!.received_unit_id,
          i2Won ? sourceUnits(second)[0]!.receivedUnitId : null,
        );
        assert.equal(
          (await db.owner.query('SELECT * FROM procurement.goods_receipt')).rowCount,
          i2Won ? 0 : 1,
        );
      } finally {
        await h.app.stop();
      }
    });
  });
for (const document of ['waybill', 'warehouseReceipt'] as const)
  void test(`I2-A05/A18: independent receivers racing the same ${document} reference commit one shared consignment only`, async () => {
    await withDatabase(async (db) => {
      const h = await setup(db);
      try {
        const first = arrival(h),
          second = arrival(h),
          otherWh = await h.people.person('ACT-WH');
        const field = document === 'waybill' ? 'waybills' : 'warehouseReceipts';
        const raw = (first.payload[field] as MutableRecord[])[0]!.reference as string;
        (second.payload[field] as MutableRecord[])[0]!.reference = raw;
        assert.notEqual(
          sourceUnits(first)[0]!.internalSystemCode,
          sourceUnits(second)[0]!.internalSystemCode,
        );
        const replies = await receivingIdentityRace(
          db,
          `${document === 'waybill' ? 'i2-waybill' : 'i2-receipt'}/${h.people.factory}/${raw}`,
          () => h.call(routes.confirm, first),
          () => h.call(routes.confirm, second, 'ACT-WH', otherWh.token),
        );
        assert.deepEqual(replies.map((reply) => reply.status).sort(), [200, 422]);
        assert.equal(
          object(replies.find((reply) => reply.status === 422)!.body.result).family,
          'GUARD_CONFLICT',
        );
        assert.deepEqual(await counts(db), {
          arrivals: 1,
          sources: 1,
          origins: 1,
          units: 1,
          ledger: 1,
          kg: '2000',
        });
        assert.equal(
          (await db.owner.query('SELECT * FROM procurement.inbound_physical_code_claim')).rowCount,
          1,
        );
      } finally {
        await h.app.stop();
      }
    });
  });
for (const count of [129, 257])
  void test(`I2-A16/A21: ${count} physical units use several IPS invocations in one atomic commit without a false document cap`, async () => {
    await withDatabase(async (db) => {
      const h = await setup(db);
      try {
        const original = await h.order(String(count)),
          input = arrival(h, original, count);
        assert.ok(Buffer.byteLength(JSON.stringify(input), 'utf8') < 256 * 1024);
        await h.accept(routes.confirm, input);
        assert.deepEqual(await counts(db), {
          arrivals: 1,
          sources: count,
          origins: count,
          units: count,
          ledger: count,
          kg: String(count * 2000),
        });
        assert.equal(
          (
            await db.owner.query(
              "SELECT * FROM kernel.command_outcome WHERE command='ConfirmPurchaseReceiving'",
            )
          ).rowCount,
          1,
        );
        if (count === 257) {
          const expected = new Set(sourceUnits(input).map((unit) => unit.receivedUnitId));
          const received = new Set<string>(),
            stockUnits = new Set<string>();
          let cursor: string | undefined;
          for (let page = 0; page <= count; page++) {
            const reply = await h.call(
              routes.progress,
              {
                orderId: original.orderId,
                view: 'RECEIVED_UNITS',
                limit: 100,
                ...(cursor === undefined ? {} : { afterId: cursor }),
              },
              'ACT-PROC',
            );
            assert.equal(reply.status, 200, reply.raw.slice(0, 200));
            assert.ok(Buffer.byteLength(reply.raw, 'utf8') <= 256 * 1024);
            const data = object(reply.body.data);
            const units = items(data.items);
            assert.ok(units.length > 0 && units.length <= 100);
            for (const unit of units) {
              const id = unit.receivedUnitId as string;
              assert.ok(expected.has(id));
              assert.ok(!received.has(id), 'Pagination must never repeat or omit source units');
              received.add(id);
              const inventory = object(unit.inventory);
              stockUnits.add(inventory.unitId as string);
              assert.ok(inventory.lotId && inventory.materialId && inventory.effectId);
              assert.ok(unit.internalSystemCode && unit.productNumber);
              assert.equal(object(unit.actual).unitWeightKg, '2000');
              assert.equal(object(unit.original).lineId, original.lineId);
              assert.equal(object(unit.arrival).originNetKg, input.payload.originNetKg);
              assert.equal(object(unit.arrival).destinationNetKg, input.payload.destinationNetKg);
            }
            if (data.nextAfterId === undefined) break;
            assert.equal(typeof data.nextAfterId, 'string');
            assert.notEqual(data.nextAfterId, cursor);
            cursor = data.nextAfterId as string;
          }
          assert.equal(received.size, count);
          assert.equal(stockUnits.size, count);
        }
      } finally {
        await h.app.stop();
      }
    });
  });
void test('I2-A16/A19: real late stock failure rolls back every source, claim, origin and previous IPS batch', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const original = await h.order('129'),
        input = arrival(h, original, 129);
      await db.owner.query(
        `CREATE FUNCTION envelope_test.reject_stock_129() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.command_id='ConfirmPurchaseReceiving' AND (SELECT count(*) FROM inventory.ledger)>=128 THEN RAISE EXCEPTION 'injected late stock failure'; END IF; RETURN NEW; END $$`,
      );
      await db.owner.query(
        'CREATE TRIGGER i2_test_late_failure BEFORE INSERT ON inventory.ledger FOR EACH ROW EXECUTE FUNCTION envelope_test.reject_stock_129()',
      );
      try {
        assert.equal((await h.call(routes.confirm, input)).status, 503);
      } finally {
        await db.owner.query('DROP TRIGGER i2_test_late_failure ON inventory.ledger');
        await db.owner.query('DROP FUNCTION envelope_test.reject_stock_129()');
      }
      assert.deepEqual(await counts(db), {
        arrivals: 0,
        sources: 0,
        origins: 0,
        units: 0,
        ledger: 0,
        kg: '0',
      });
      assert.equal(
        (await db.owner.query('SELECT * FROM procurement.inbound_physical_code_claim')).rowCount,
        0,
      );
      await h.accept(routes.confirm, input);
      assert.equal((await counts(db)).units, 129);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A16/A17: audit failure rolls back stock and outcome; original identity retries successfully', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const input = arrival(h);
      await db.owner.query(
        `CREATE FUNCTION envelope_test.reject_i2_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.command='ConfirmPurchaseReceiving' THEN RAISE EXCEPTION 'injected audit failure'; END IF; RETURN NEW; END $$`,
      );
      await db.owner.query(
        'CREATE TRIGGER i2_test_audit_failure BEFORE INSERT ON kernel.audit_event FOR EACH ROW EXECUTE FUNCTION envelope_test.reject_i2_audit()',
      );
      try {
        assert.equal((await h.call(routes.confirm, input)).status, 503);
      } finally {
        await db.owner.query('DROP TRIGGER i2_test_audit_failure ON kernel.audit_event');
        await db.owner.query('DROP FUNCTION envelope_test.reject_i2_audit()');
      }
      assert.equal((await counts(db)).units, 0);
      assert.equal(
        (
          await db.owner.query(
            "SELECT * FROM kernel.command_outcome WHERE command='ConfirmPurchaseReceiving'",
          )
        ).rowCount,
        0,
      );
      await h.accept(routes.confirm, input);
      assert.equal((await counts(db)).units, 1);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A17: accepted and rejected durable replay preserve original identity and changed raw payload conflicts', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const input = arrival(h),
        first = await h.accept(routes.confirm, input);
      const replay = await h.accept(routes.confirm, input);
      assert.equal(replay.body.executionId, first.body.executionId);
      assert.equal(replay.body.replayed, true);
      const changed = {
        ...input,
        payload: { ...input.payload, driverName: 'different original binding' },
      };
      assert.equal((await h.call(routes.confirm, changed)).status, 409);
      const invalid = arrival(h);
      delete invalid.payload.originNetKg;
      const rejected = await reject(h, invalid),
        again = await reject(h, invalid);
      assert.equal(rejected.body.executionId, again.body.executionId);
      assert.equal((await counts(db)).units, 1);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A15/A17: revoked individual cannot execute, read or disclose a prior outcome', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const original = await h.order(),
        input = arrival(h, original);
      await h.accept(routes.confirm, input);
      await h.people.identity.logout(h.people.wh.token);
      for (const [path, value] of [
        [routes.confirm, input],
        [routes.arrival, { arrivalId: input.target.id }],
        [routes.progress, { orderId: original.orderId, view: 'LINES' }],
      ] as const) {
        const r = await h.call(path, value);
        assert.ok(r.status === 401 || r.status === 403, r.raw);
      }
      assert.equal((await counts(db)).units, 1);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A15: PROC, SEC, customer and forged payload actors cannot acquire receiving confirmation authority', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const input = arrival(h);
      for (const role of ['ACT-PROC', 'ACT-SEC', 'ACT-CUST'] as const) {
        const r = await h.call(routes.confirm, input, role);
        assert.equal(r.status, 403, r.raw);
      }
      const forged = replace(input, {
        ...input.payload,
        actorRole: 'ACT-WH',
        subject: h.people.wh.id,
      });
      assert.equal((await h.call(routes.confirm, forged)).status, 403);
      assert.equal((await counts(db)).units, 0);
      for (const role of ['ACT-SEC', 'ACT-CUST'] as const) {
        assert.equal(
          (await h.call(routes.progress, { orderId: randomUUID(), view: 'LINES' }, role)).status,
          403,
        );
        assert.equal((await h.call(routes.arrival, { arrivalId: randomUUID() }, role)).status, 403);
      }
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A15: foreign-installation sessions cannot disclose orders or arrivals and scope fields cannot be forged', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const original = await h.order(),
        input = arrival(h, original);
      await h.accept(routes.confirm, input);
      const foreign = await inboundPeople(db, randomUUID());
      for (const [path, value] of [
        [routes.progress, { orderId: original.orderId, view: 'RECEIVED_UNITS' }],
        [routes.arrival, { arrivalId: input.target.id }],
        [routes.confirm, arrival(h)],
      ] as const) {
        const reply = await h.call(path, value, 'ACT-WH', foreign.wh.token);
        assert.ok(reply.status === 401 || reply.status === 403, reply.raw);
        assert.ok(!reply.raw.includes(sourceUnits(input)[0]!.internalSystemCode as string));
      }
      const forged = arrival(h);
      forged.payload.installationId = foreign.factory;
      assert.equal((await h.call(routes.confirm, forged)).status, 403);
      assert.equal((await counts(db)).units, 1);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A13: catalogue creation by WH is reusable, unsupported business types are not silently admitted as OTHER', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const unsupported = optionCommand('MATERIAL_TYPE', 'unsupported-custom-material');
      await h.accept(routes.option, unsupported, 'ACT-WH');
      const input = arrival(h);
      object(sourceUnits(input)[0]!.actual).materialTypeOptionId = unsupported.target.id;
      const rejection = await reject(h, input);
      assert.ok(rejection.raw.includes(unsupported.target.id));
      assert.ok(rejection.raw.includes('1'));
      assert.equal((await counts(db)).units, 0);
      const supported = arrival(h);
      await h.accept(routes.confirm, supported);
      assert.deepEqual((await db.owner.query('SELECT DISTINCT kind FROM inventory.unit')).rows, [
        { kind: 'COIL' },
      ]);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A04/A22: new receiving codes conflict with existing standalone codes, without changing legacy evidence', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const legacy = receiptCommand();
      const r = await h.call('/receipts/post', legacy);
      assert.equal(r.status, 200, r.raw);
      const next = arrival(h);
      sourceUnits(next)[0]!.internalSystemCode = legacy.payload.internalCode!;
      await reject(h, next);
      assert.equal((await db.owner.query('SELECT * FROM procurement.goods_receipt')).rowCount, 1);
      assert.equal((await db.owner.query('SELECT * FROM procurement.inbound_arrival')).rowCount, 0);
      assert.equal((await h.call('/receipts/post', legacy)).status, 200);
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A03/A13/A20/A22: received SHEET units share opaque product numbers without legacy productCode or fabricated Coil ancestry', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const sheet = optionCommand('MATERIAL_TYPE', 'SHEET');
      await h.accept(routes.option, sheet, 'ACT-WH');
      const input = arrival(h, undefined, 2);
      for (const unit of sourceUnits(input)) {
        object(unit.actual).materialTypeOptionId = sheet.target.id;
        unit.productNumber = 'شماره محصول مشترک';
        assert.equal(Object.hasOwn(unit, 'productCode'), false);
      }
      await h.accept(routes.confirm, input);
      assert.deepEqual(
        (await db.owner.query('SELECT kind FROM inventory.unit ORDER BY unit_id')).rows,
        [{ kind: 'SHEET' }, { kind: 'SHEET' }],
      );
      assert.equal((await counts(db)).kg, '4000');
      assert.equal((await db.owner.query('SELECT * FROM inventory.material_lot')).rowCount, 0);
      const origins = (
        await db.owner.query<{ unit_id: string; received_unit_id: string }>(
          'SELECT unit_id,received_unit_id FROM inventory.inbound_unit_origin',
        )
      ).rows;
      assert.equal(origins.length, 2);
      const tx = await db.transactions.begin('read-snapshot');
      try {
        const adapter = new PostgresInventoryInboundReceivingStore();
        const actor = await h.people.wh.actor();
        for (const origin of origins) {
          const facts = await adapter.traceSources(
            { actor, transaction: tx.context, customerId: randomUUID() },
            'UNIT',
            origin.unit_id,
          );
          assert.equal(facts.length, 1);
          assert.equal(facts[0]!.receivedUnitId, origin.received_unit_id);
          assert.equal(facts[0]!.originKind, 'WH_ACCEPTED_RECEIVING_UNIT');
        }
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally {
        await tx.release();
      }
      const products = await db.owner.query<{ product_number: string }>(
        'SELECT product_number FROM procurement.inbound_received_unit',
      );
      assert.deepEqual(
        products.rows.map((row) => row.product_number),
        ['شماره محصول مشترک', 'شماره محصول مشترک'],
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A21: Unicode scalar and byte limits reject without truncation; 128 Persian scalars remain readable', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      for (const value of ['ی'.repeat(129), '😀'.repeat(129)]) {
        const input = arrival(h);
        input.payload.driverName = value;
        await reject(h, input);
      }
      const input = arrival(h);
      input.payload.driverName = 'ی'.repeat(128);
      await h.accept(routes.confirm, input);
      const q = await h.call(routes.arrival, { arrivalId: input.target.id });
      assert.equal(q.status, 200, q.raw);
      assert.ok(q.raw.includes('ی'.repeat(128)));
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A15/A18: expiry during a verified real owner-lock wait rejects before any receiving or stock persistence', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db),
      blocker = await db.owner.connect();
    try {
      const input = arrival(h);
      await blocker.query('BEGIN');
      await blocker.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
        `i2-arrival/${h.people.factory}/${input.target.id}`,
      ]);
      await db.owner.query(
        "UPDATE identity.session SET expires_at=clock_timestamp()+interval '2000 milliseconds' WHERE installation_id=$1 AND account_id=$2",
        [h.people.factory, h.people.wh.id],
      );
      const running = h.call(routes.confirm, input);
      void running.catch(() => undefined);
      try {
        let observed = false;
        for (let n = 0; n < 160; n++) {
          const row = (
            await db.owner.query<{ waiting: boolean }>(
              "SELECT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted) AS waiting",
            )
          ).rows[0]!;
          if (row.waiting) {
            observed = true;
            break;
          }
          await delay(25);
        }
        assert.equal(observed, true, 'command must reach real PostgreSQL owner lock');
        for (let n = 0; n < 120; n++) {
          const row = (
            await db.owner.query<{ expired: boolean }>(
              'SELECT bool_and(expires_at<=clock_timestamp()) AS expired FROM identity.session WHERE installation_id=$1 AND account_id=$2',
              [h.people.factory, h.people.wh.id],
            )
          ).rows[0]!;
          if (row.expired) break;
          await delay(25);
        }
      } finally {
        await blocker.query('ROLLBACK');
      }
      const response = await running;
      assert.ok(response.status === 403 || response.status === 422, response.raw);
      assert.equal(object(response.body.result ?? response.body).family, 'GUARD_ACTOR');
      assert.equal((await counts(db)).units, 0);
    } finally {
      await blocker.query('ROLLBACK');
      blocker.release();
      await h.app.stop();
    }
  });
});
void test('I2-A15/A18: grant revocation committed during an observed owner-lock wait denies the original command and its recovery', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db),
      blocker = await db.owner.connect();
    try {
      const input = arrival(h);
      await blocker.query('BEGIN');
      await blocker.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
        `i2-arrival/${h.people.factory}/${input.target.id}`,
      ]);
      const running = h.call(routes.confirm, input);
      void running.catch(() => undefined);
      try {
        let observed = false;
        for (let n = 0; n < 160; n++) {
          const row = (
            await db.owner.query<{ waiting: boolean }>(
              "SELECT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted) AS waiting",
            )
          ).rows[0]!;
          if (row.waiting) {
            observed = true;
            break;
          }
          await delay(25);
        }
        assert.equal(observed, true, 'command must reach actual owner lock before revocation');
        const revoked = await db.owner.query(
          "DELETE FROM identity.role_grant WHERE installation_id=$1 AND account_id=$2 AND actor_role='ACT-WH'",
          [h.people.factory, h.people.wh.id],
        );
        assert.equal(revoked.rowCount, 1);
      } finally {
        await blocker.query('ROLLBACK');
      }
      const response = await running;
      assert.ok(response.status === 403 || response.status === 422, response.raw);
      assert.equal(object(response.body.result ?? response.body).family, 'GUARD_ACTOR');
      assert.equal((await counts(db)).units, 0);
      assert.equal((await h.call(routes.confirm, input)).status, 403);
      assert.equal((await h.call(routes.arrival, { arrivalId: input.target.id })).status, 403);
    } finally {
      await blocker.query('ROLLBACK');
      blocker.release();
      await h.app.stop();
    }
  });
});
void test('I2-A18: an actual owner-lock timeout is technical, leaves no outcome or stock and original-key retry succeeds', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db),
      blocker = await db.owner.connect();
    try {
      const input = arrival(h);
      await blocker.query('BEGIN');
      await blocker.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
        `i2-arrival/${h.people.factory}/${input.target.id}`,
      ]);
      try {
        const reply = await h.call(routes.confirm, input);
        assert.equal(reply.status, 503, reply.raw);
      } finally {
        await blocker.query('ROLLBACK');
      }
      assert.equal((await counts(db)).units, 0);
      assert.equal(
        (
          await db.owner.query(
            "SELECT * FROM kernel.command_outcome WHERE command='ConfirmPurchaseReceiving'",
          )
        ).rowCount,
        0,
      );
      await h.accept(routes.confirm, input);
      assert.equal((await counts(db)).units, 1);
    } finally {
      await blocker.query('ROLLBACK');
      blocker.release();
      await h.app.stop();
    }
  });
});
void test('I2-A18: opposite multi-PO unit ordering serializes one progress intent without deadlock or partial arrival', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const a = await h.order(),
        b = await h.order();
      const first = arrival(h, a, 2),
        second = arrival(h, b, 2);
      sourceUnits(first)[1]!.association = {
        kind: 'ORDER_LINE',
        orderId: b.orderId,
        lineId: b.lineId,
      };
      sourceUnits(second)[1]!.association = {
        kind: 'ORDER_LINE',
        orderId: a.orderId,
        lineId: a.lineId,
      };
      for (const command of [first, second])
        command.preconditions.lineProgress = [
          { orderId: a.orderId, lineId: a.lineId, expectedAcceptedUnitCount: '0' },
          { orderId: b.orderId, lineId: b.lineId, expectedAcceptedUnitCount: '0' },
        ];
      const secondWh = await h.people.person('ACT-WH');
      const result = await Promise.all([
        h.call(routes.confirm, first),
        h.call(routes.confirm, second, 'ACT-WH', secondWh.token),
      ]);
      assert.deepEqual(result.map((x) => x.status).sort(), [200, 422]);
      assert.equal(
        object(result.find((x) => x.status === 422)!.body.result).family,
        'GUARD_CONFLICT',
      );
      assert.deepEqual(await counts(db), {
        arrivals: 1,
        sources: 2,
        origins: 2,
        units: 2,
        ledger: 2,
        kg: '4000',
      });
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A21: actual complete response budget is enforced before persistence, accepted large evidence stays fully readable', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    try {
      const original = await h.order(),
        tooLarge = arrival(h, original);
      tooLarge.payload.originNetKg = '0.' + '1'.repeat(65500);
      tooLarge.payload.destinationNetKg = '0.' + '2'.repeat(65500);
      assert.ok(Buffer.byteLength(JSON.stringify(tooLarge), 'utf8') < 256 * 1024);
      await reject(h, tooLarge);
      assert.equal((await counts(db)).units, 0);
      const accepted = arrival(h, original);
      accepted.payload.originNetKg = '0.' + '1'.repeat(60000);
      accepted.payload.destinationNetKg = '0.' + '2'.repeat(60000);
      await h.accept(routes.confirm, accepted);
      for (const [path, value, role] of [
        [routes.arrival, { arrivalId: accepted.target.id }, 'ACT-WH'],
        [routes.progress, { orderId: original.orderId, view: 'RECEIVED_UNITS' }, 'ACT-PROC'],
      ] as const) {
        const reply = await h.call(path, value, role);
        assert.equal(reply.status, 200, reply.raw.slice(0, 500));
        assert.ok(Buffer.byteLength(reply.raw, 'utf8') <= 256 * 1024);
        assert.ok(reply.raw.includes(accepted.payload.originNetKg));
        assert.ok(reply.raw.includes(accepted.payload.destinationNetKg));
      }
    } finally {
      await h.app.stop();
    }
  });
});
void test('I2-A17: actual child-process crash after uncommitted sources leaves no partial stock and original-key recovery succeeds', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    const child = fork(
      fileURLToPath(new URL('../support/receiving-crash-child.js', import.meta.url)),
      [],
      { env: process.env, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] },
    );
    let exited = false;
    const exit = new Promise<void>((resolve) => {
      child.once('exit', () => {
        exited = true;
        resolve();
      });
    });
    try {
      const original = await h.order(),
        input = arrival(h, original, 3);
      const checkpoint = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Child did not reach real uncommitted source checkpoint')),
          10000,
        );
        child.once('message', (message: unknown) => {
          clearTimeout(timer);
          if (object(message).stage === 'uncommitted-source-before-ips') resolve();
          else reject(new Error('Child failed before checkpoint'));
        });
        child.once('error', reject);
      });
      child.send({ token: h.people.wh.token, factory: h.people.factory, command: input });
      await checkpoint;
      assert.deepEqual(await counts(db), {
        arrivals: 0,
        sources: 0,
        origins: 0,
        units: 0,
        ledger: 0,
        kg: '0',
      });
      child.kill('SIGKILL');
      await exit;
      assert.deepEqual(await counts(db), {
        arrivals: 0,
        sources: 0,
        origins: 0,
        units: 0,
        ledger: 0,
        kg: '0',
      });
      await h.accept(routes.confirm, input);
      assert.deepEqual(await counts(db), {
        arrivals: 1,
        sources: 3,
        origins: 3,
        units: 3,
        ledger: 3,
        kg: '6000',
      });
    } finally {
      if (!exited) {
        child.kill('SIGKILL');
        await exit;
      }
      await h.app.stop();
    }
  });
});
void test('I2-A17: unknown-COMMIT through real PostgreSQL transport is resolved by original input, with exactly-once stock', async () => {
  await withDatabase(async (db) => {
    const h = await setup(db);
    const proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL!, { armed: false });
    let app: ReturnType<typeof compose> | undefined;
    try {
      const input = arrival(h);
      app = compose({
        nodeEnv: 'production',
        host: '127.0.0.1',
        port: 0,
        databaseUrl: proxy.url,
        installationId: h.people.factory,
        logLevel: 'error',
        commandAdmissionReconciled: true,
      });
      await app.start();
      const actor = await app.identity.context(h.people.wh.token, 'ACT-WH');
      proxy.arm();
      const response = await app.command(JSON.stringify(input), actor);
      assert.equal(response.status, 'technical');
      if (response.status === 'technical') assert.equal(response.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      const recovered = await h.accept(routes.confirm, input);
      assert.equal(recovered.body.replayed, true);
      assert.deepEqual(await counts(db), {
        arrivals: 1,
        sources: 1,
        origins: 1,
        units: 1,
        ledger: 1,
        kg: '2000',
      });
    } finally {
      await app?.stop();
      await proxy.close();
      await h.app.stop();
    }
  });
});

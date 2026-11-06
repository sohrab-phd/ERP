import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { request as httpRequest } from 'node:http';
import type { CommandRequest, JsonObject } from '@navard/shared-kernel';
import { compose } from '../../src/composition-root.js';
import { IdentityService } from '../../src/modules/identity/index.js';
import { PostgresIdentityStore } from '../../src/infrastructure/postgresql/identity-store.js';
import type { DatabaseFixture } from './database-fixture.js';
import { productionApp } from './production-harness.js';
import { optionCommand, orderCommand } from './inbound-harness.js';
import { completed, installation, receiptCommand, receiptHarness } from './receipt-harness.js';
import { browserTestPassword } from './browser-harness.js';
import { request } from './synthetic-command.js';

export type Row = Record<string, unknown>;
export const inventoryRoutes = {
  list: '/inventory/v1/units/query',
  detail: '/inventory/v1/units/detail',
  lot: '/inventory/v1/lots/units/query',
} as const;

export function object(value: unknown): Row {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Row;
}
export async function responseData(response: Response): Promise<Row> {
  const body = object(await response.json());
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Object.keys(body), ['data']);
  return object(body.data);
}
export function rows(data: Row): Row[] {
  assert.ok(Array.isArray(data.items));
  return data.items.map(object);
}

/** Two real composed applications share the one verified disposable database.
 * The command fixture creates accepted business facts; the browser app is the
 * ordinary cookie/CSRF/Identity/Inventory stack, without a synthetic auth adapter.
 */
export async function inventoryDiscoveryHarness(
  db: DatabaseFixture,
  options: { receivingLocation?: { id: string; label: string } } = {},
) {
  const fixture = await productionApp(db);
  const reservation = createServer();
  await new Promise<void>((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const origin = `http://127.0.0.1:${port}`;
  const secret = randomBytes(32).toString('base64url');
  const app = compose({
    nodeEnv: 'test',
    host: '127.0.0.1',
    port,
    databaseUrl: process.env.TEST_DATABASE_URL!,
    installationId: installation,
    logLevel: 'error',
    commandAdmissionReconciled: true,
    browser: {
      origin,
      secret,
      ...(options.receivingLocation ? { receivingLocation: options.receivingLocation } : {}),
    },
  });
  try {
    await app.start();
  } catch (error) {
    await Promise.all([app.stop(), fixture.app.stop()]);
    throw error;
  }

  function client(role = 'ACT-WH', username = `receipt.${role.toLowerCase()}`) {
    let cookie = '',
      csrf = '';
    let self: Row | undefined;
    const call = (route: string, body?: unknown, headers: Record<string, string> = {}) =>
      fetch(origin + '/ui-api' + route, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          'x-erp-browser': '1',
          'sec-fetch-site': 'same-origin',
          'x-erp-role': role,
          cookie,
          'x-erp-csrf': csrf,
          ...(body === undefined ? {} : { origin, 'content-type': 'application/json' }),
          ...headers,
        },
        ...(body === undefined
          ? {}
          : {
              body: typeof body === 'string' ? body : JSON.stringify(body),
            }),
      });
    return {
      call,
      get cookie() {
        return cookie;
      },
      get csrf() {
        return csrf;
      },
      get self() {
        return self;
      },
      async rawCall(
        route: string,
        body: unknown,
        overrides: Record<string, string | string[]> = {},
      ) {
        const encoded = typeof body === 'string' ? body : JSON.stringify(body);
        return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
          const request = httpRequest(
            origin + '/ui-api' + route,
            {
              method: 'POST',
              headers: {
                host: new URL(origin).host,
                origin,
                'x-erp-browser': '1',
                'sec-fetch-site': 'same-origin',
                'x-erp-role': role,
                cookie,
                'x-erp-csrf': csrf,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(encoded),
                ...overrides,
              },
            },
            (response) => {
              const chunks: Buffer[] = [];
              response.on('data', (value: Buffer) => chunks.push(value));
              response.once('error', reject);
              response.once('end', () => {
                try {
                  resolve({
                    status: response.statusCode!,
                    body: JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown,
                  });
                } catch (error) {
                  reject(error instanceof Error ? error : new Error('Invalid raw HTTP response'));
                }
              });
            },
          );
          request.once('error', reject);
          request.end(encoded);
        });
      },
      async login(password = browserTestPassword) {
        const response = await call('/identity/login', { username, password });
        assert.equal(response.status, 200);
        cookie = response.headers.get('set-cookie')!.split(';')[0]!;
        const login = object(await response.json());
        assert.equal(login.token, undefined);
        const session = await call('/identity/session');
        assert.equal(session.status, 200);
        self = object(await session.json());
        csrf = String(object(self.browser).csrf);
        return self;
      },
    };
  }
  const wh = client();
  await wh.login();

  async function legacy(kg = '11', code = 'P4A-' + randomUUID(), kind = 'COIL') {
    const input = receiptCommand({
      payload: {
        internalCode: code,
        count: '2',
        measuredKg: kg,
        type: kind,
        locationId: randomUUID(),
        ...(kind === 'SHEET' ? { productCode: 'SHEET-' + randomUUID() } : {}),
      },
    });
    const result = completed(
      await fixture.app.command(JSON.stringify(input), fixture.wh),
      'accepted',
    );
    const data = object(result.result.data);
    return {
      unitId: String(data.unitId),
      lotId: String(data.lotId),
      receiptId: input.target.id,
      code,
    };
  }

  async function i2() {
    const proc = await fixture.app.identity.context(
      fixture.warehouse.tokens.get('ACT-PROC')!,
      'ACT-PROC',
    );
    const material = optionCommand('MATERIAL_TYPE', 'COIL');
    completed(await fixture.app.command(JSON.stringify(material), proc), 'accepted');
    const purchase = orderCommand(material.target.id, {
      payload: {
        orderReference: 'P4A-PO-' + randomUUID(),
        registrationDateJalali: '1403-12-30',
        lines: [
          {
            materialTypeOptionId: material.target.id,
            widthM: '1.2',
            thicknessMm: '0.35',
            unitWeightKg: '2000',
            orderedUnitCount: '5',
          },
        ],
      },
    });
    completed(await fixture.app.command(JSON.stringify(purchase), proc), 'accepted');
    const original = object(
      await fixture.app.inboundQuery(
        'GetOperationalPurchaseOrder',
        { orderId: purchase.target.id },
        proc,
      ),
    );
    assert.ok(Array.isArray(original.lines));
    const lineId = String(object(original.lines[0]).lineId);
    const waybillId = randomUUID(),
      receiptId = randomUUID();
    const codes = ['P4A-I2-LINE-', 'P4A-I2-ORDER-', 'P4A-I2-UNLINKED-'].map(
      (s) => s + randomUUID(),
    );
    const sourceIds = codes.map(() => randomUUID());
    const arrival: CommandRequest = request({
      command: 'ConfirmPurchaseReceiving',
      target: { kind: 'inbound-arrival', id: randomUUID() },
      payload: {
        arrivalDateJalali: '1403-12-30',
        originNetKg: '06000.12500',
        destinationNetKg: '6000.1200',
        weightSourceWaybillId: waybillId,
        driverName: 'PRIVATE DRIVER MUST NOT APPEAR',
        originatingCompany: 'PRIVATE COMPANY MUST NOT APPEAR',
        waybills: [{ waybillId, reference: 'P4A-WB-' + randomUUID() }],
        warehouseReceipts: [{ receiptId, reference: 'P4A-WR-' + randomUUID() }],
        units: codes.map((code, index): JsonObject => ({
          receivedUnitId: sourceIds[index]!,
          waybillId,
          receiptId,
          internalSystemCode: code,
          productNumber: 'محصول مستقل ۱۲',
          association:
            index === 0
              ? { kind: 'ORDER_LINE', orderId: purchase.target.id, lineId }
              : index === 1
                ? { kind: 'ORDER_ONLY', orderId: purchase.target.id }
                : { kind: 'UNLINKED' },
          actual: {
            materialTypeOptionId: material.target.id,
            widthM: '1.2',
            thicknessMm: '0.35',
            unitWeightKg: '2000',
          },
          acceptance: { confirmed: true, ...(index === 0 ? {} : { unordered: true }) },
          locationId: randomUUID(),
        })),
      },
      preconditions: {
        lineProgress: [{ orderId: purchase.target.id, lineId, expectedAcceptedUnitCount: '0' }],
      },
    });
    completed(await fixture.app.command(JSON.stringify(arrival), fixture.wh), 'accepted');
    const origins = (
      await db.owner.query<{ unit_id: string; lot_id: string; received_unit_id: string }>(
        'SELECT unit_id,lot_id,received_unit_id FROM inventory.inbound_unit_origin WHERE installation_id=$1 AND authority_scope=$1 AND arrival_id=$2 ORDER BY internal_system_code COLLATE "C"',
        [installation, arrival.target.id],
      )
    ).rows;
    assert.equal(origins.length, 3);
    return { arrivalId: arrival.target.id, origins, codes, sourceIds, orderId: purchase.target.id };
  }

  async function stockSnapshot() {
    return (
      await db.owner.query<{ snapshot: string }>(`
      SELECT jsonb_build_object(
        'units',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY installation_id,authority_scope,unit_id),'[]') FROM inventory.unit t),
        'ledger',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY installation_id,authority_scope,ledger_id),'[]') FROM inventory.ledger t),
        'balance',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY installation_id,authority_scope,unit_id),'[]') FROM inventory.balance t),
        'claims',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY installation_id,authority_scope,reservation_id),'[]') FROM inventory.reservation t),
        'issues',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY installation_id,authority_scope,unit_id,production_order_id),'[]') FROM inventory.production_issue t),
        'legacy',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY installation_id,authority_scope,lot_id),'[]') FROM inventory.material_lot t),
        'i2',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY installation_id,authority_scope,unit_id),'[]') FROM inventory.inbound_unit_origin t),
        'production',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY installation_id,authority_scope,unit_id),'[]') FROM inventory.production_origin t),
        'outcomes',(SELECT count(*) FROM kernel.command_outcome),
        'audits',(SELECT count(*) FROM kernel.audit_event)
      )::text AS snapshot
    `)
    ).rows[0]!.snapshot;
  }

  async function differentlyScopedStock(factory: string, authority = factory) {
    const account = randomUUID(),
      person = randomUUID(),
      username = 'p4a-scope-' + randomUUID();
    // Reuse only the known synthetic password hash; authentication still goes
    // through the genuine Identity service and issued, branded actor context.
    await db.owner.query(
      "INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) SELECT $1,$2,$3,$4,password_hash FROM identity.account WHERE installation_id=$5 AND username='receipt.act-wh'",
      [factory, account, person, username, installation],
    );
    await db.owner.query(
      "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,'ACT-WH','')",
      [factory, account, authority],
    );
    const identity = new IdentityService(
      new PostgresIdentityStore(db.runtime),
      db.transactions,
      factory,
      authority,
    );
    const token = (await identity.login(username, browserTestPassword)).token;
    const actor = await identity.context(token, 'ACT-WH');
    const owner = receiptHarness(db, identity);
    const command = receiptCommand();
    const result = completed(await owner.run(command, actor), 'accepted');
    const value = object(result.result.data);
    assert.equal(typeof command.payload.internalCode, 'string');
    return {
      unitId: String(value.unitId),
      lotId: String(value.lotId),
      code: command.payload.internalCode as string,
    };
  }

  return {
    app,
    fixture,
    wh,
    client,
    origin,
    secret,
    legacy,
    i2,
    stockSnapshot,
    differentlyScopedStock,
    async stop() {
      await Promise.all([app.stop(), fixture.app.stop()]);
    },
  };
}

/** Barrier timeout fails the test instead of disguising a missed synchronization
 * point as a successful concurrent execution. Always release/restore in finally.
 */
export function readBarrier() {
  let reached!: () => void, release!: () => void, fail!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    reached = resolve;
    fail = reject;
  });
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const timer = setTimeout(
    () => fail(new Error('Inventory read did not reach actual database barrier')),
    5000,
  );
  return {
    ready,
    async enter() {
      reached();
      await released;
    },
    release() {
      clearTimeout(timer);
      release();
    },
  };
}

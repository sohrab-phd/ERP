import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';
import { canonicalJson } from '@navard/shared-kernel';
import { PostgresInventoryDiscoveryStore } from '../../src/infrastructure/postgresql/inventory-discovery-store.js';
import {
  PostgresTransactions,
  transactionClient,
} from '../../src/infrastructure/postgresql/transaction.js';
import { InventoryDiscoveryService } from '../../src/modules/inventory/index.js';
import { withDatabase } from '../support/database-fixture.js';
import { completed, installation } from '../support/receipt-harness.js';
import { reservationCommand } from '../support/reservation-harness.js';
import { productionCommand } from '../support/production-harness.js';
import {
  inventoryDiscoveryHarness,
  inventoryRoutes,
  object,
  responseData,
  rows,
  readBarrier,
  type Row,
} from '../support/inventory-discovery-harness.js';

const summaryKeys = [
  'unitId',
  'lotId',
  'kind',
  'locationId',
  'state',
  'stockClass',
  'origin',
  'internalCode',
  'productCode',
  'productNumber',
  'materialId',
  'quantities',
].sort();
function summary(row: Row, detail = false) {
  assert.deepEqual(Object.keys(row).sort(), [...summaryKeys, ...(detail ? ['source'] : [])].sort());
  assert.deepEqual(Object.keys(object(row.quantities)).sort(), [
    'onHandKg',
    'reservedKg',
    'unreservedKg',
  ]);
  for (const quantity of Object.values(object(row.quantities)))
    assert.match(String(quantity), /^(?:0|[1-9][0-9]{0,19})(?:\.[0-9]{0,17}[1-9])?$/u);
}
function freshness(data: Row) {
  const value = object(data.freshness);
  assert.deepEqual(Object.keys(value).sort(), [
    'consistency',
    'observedAt',
    'quantityBasis',
    'respondedAt',
  ]);
  assert.equal(value.consistency, 'PAGE_SNAPSHOT');
  assert.equal(value.quantityBasis, 'LEDGER_VERIFIED_BALANCE');
  assert.ok(Number.isFinite(Date.parse(String(value.observedAt))));
  assert.ok(
    Date.parse(String(value.respondedAt)) >= Date.parse(String(value.observedAt)),
    JSON.stringify(value),
  );
}

void test('P4a real PostgreSQL browser reads preserve source, quantity, lifecycle, privacy and paging contracts', async (t) =>
  withDatabase(async (db) => {
    const h = await inventoryDiscoveryHarness(db);
    const fixture = h.fixture;
    try {
      const free = await h.legacy('11', ' کد-۱۲_exact_% ');
      const big = await h.legacy('9007199254740993');
      const sheet = await h.legacy('9', 'P4A-SHEET-' + randomUUID(), 'SHEET');
      const inbound = await h.i2();
      const reserved = await h.legacy();
      const reservedOrder = await fixture.order([reserved.unitId], {
        demandedKg: '5',
        partial: true,
      });
      await fixture.claim(reservedOrder.orderId, reservedOrder.itemId, reserved.unitId, '5');
      const packed = await h.legacy();
      const packedOrder = await fixture.order([packed.unitId]);
      const packedClaim = await fixture.claim(
        packedOrder.orderId,
        packedOrder.itemId,
        packed.unitId,
      );
      const packedDocuments = await fixture.ready(packedOrder.orderId, [packedClaim.target.id]);
      const shipped = await h.legacy();
      const shipmentOrder = await fixture.order([shipped.unitId]);
      const shipmentClaim = await fixture.claim(
        shipmentOrder.orderId,
        shipmentOrder.itemId,
        shipped.unitId,
      );
      const shipment = await fixture.ready(shipmentOrder.orderId, [shipmentClaim.target.id]);
      completed(
        await fixture.app.command(JSON.stringify(shipment.dispatch), fixture.ship),
        'accepted',
      );
      const issued = await fixture.prepare();
      const partial = await fixture.prepare({ steps: 2 });
      const wip = fixture.complete(partial.ops[0]!, partial.source, '70', '50', {
        residual: '10',
        scrap: '10',
      });
      completed(await fixture.run(wip.input, fixture.manager), 'accepted');
      const complete = await fixture.prepare();
      const final = fixture.complete(complete.ops[0]!, complete.source);
      completed(await fixture.run(final.input), 'accepted');
      const beam = await h.legacy('110', 'P4A-BEAM-' + randomUUID(), 'BEAM');
      const fractionalPlan = await fixture.prepare({ source: beam.unitId });
      const fractional = fixture.complete(fractionalPlan.ops[0]!, beam.unitId, '70.5', '70.50');
      completed(await fixture.run(fractional.input), 'accepted');
      const detail = async (unitId: string) =>
        object((await responseData(await h.wh.call(inventoryRoutes.detail, { unitId }))).unit);
      const list = async (filters: Row = {}, limit = 50, cursor?: string) =>
        responseData(
          await h.wh.call(inventoryRoutes.list, { filters, limit, ...(cursor ? { cursor } : {}) }),
        );

      await t.test(
        'all approved origins and five current states have exact recursive summary whitelist',
        async () => {
          const before = await h.stockSnapshot();
          const data = await list();
          assert.deepEqual(Object.keys(data).sort(), ['freshness', 'items', 'nextCursor']);
          freshness(data);
          const items = rows(data);
          assert.deepEqual([...new Set(items.map((r) => r.origin))].sort(), [
            'I2_RECEIVING',
            'LEGACY_RECEIPT',
            'PRODUCTION',
          ]);
          assert.deepEqual([...new Set(items.map((r) => r.state))].sort(), [
            'AVAILABLE',
            'ISSUED_TO_PRODUCTION',
            'PACKED',
            'PARTIALLY_CONSUMED',
            'RESERVED',
          ]);
          assert.ok(items.every((r) => r.stockClass === 'CURRENT'));
          assert.ok(
            !items.some((r) => r.unitId === shipped.unitId || r.unitId === complete.source),
          );
          for (const item of items) summary(item);
          const raw = JSON.stringify(data);
          for (const privateValue of [
            fixture.people.customerId,
            fixture.people.otherCustomerId,
            inbound.orderId,
            reservedOrder.orderId,
            packedDocuments.shipment.target.id,
            complete.orderId,
            'PRIVATE DRIVER MUST NOT APPEAR',
            'PRIVATE COMPANY MUST NOT APPEAR',
            '06000.12500',
            '6000.1200',
          ])
            assert.equal(
              raw.includes(privateValue),
              false,
              'Inventory whitelist must not disclose private source/commercial content',
            );
          assert.equal(
            await h.stockSnapshot(),
            before,
            'read must not change stock, origins, outcomes or audits',
          );
        },
      );

      await t.test(
        'all eight filters and AND combinations use authoritative exact identities without normalization',
        async () => {
          const row = await detail(free.unitId);
          const filters = {
            unitId: row.unitId,
            lotId: row.lotId,
            materialId: row.materialId,
            internalCode: free.code,
            kind: 'COIL',
            locationId: row.locationId,
            state: 'AVAILABLE',
            origin: 'LEGACY_RECEIPT',
          };
          for (const [key, value] of Object.entries(filters)) {
            const found = rows(await list({ [key]: value }));
            assert.ok(
              found.some((item) => item.unitId === free.unitId),
              key,
            );
          }
          assert.deepEqual(
            rows(await list(filters)).map((r) => r.unitId),
            [free.unitId],
          );
          for (const code of [
            free.code.trim(),
            free.code.replace('۱۲', '12'),
            free.code.toUpperCase(),
            '%',
          ])
            assert.deepEqual(rows(await list({ internalCode: code })), []);
          assert.deepEqual(rows(await list({ ...filters, kind: 'BEAM' })), []);
          assert.deepEqual(rows(await list({ materialId: randomUUID() })), []);
          assert.equal((await detail(sheet.unitId)).productCode === null, false);
        },
      );

      await t.test(
        'installation and authority isolation occurs before paging while the bounded exception admits customer A and B stock',
        async () => {
          const otherInstallation = await h.differentlyScopedStock(randomUUID());
          const otherAuthority = await h.differentlyScopedStock(installation, randomUUID());
          const customerB = await h.legacy();
          const foreignSales = await fixture.app.identity.context(
            fixture.people.tokens.get('foreign')!,
            'ACT-SALES',
            fixture.people.otherCustomerId,
          );
          const orderB = await fixture.order([customerB.unitId], {
            demandedKg: '5',
            partial: true,
            actor: foreignSales,
            customerId: fixture.people.otherCustomerId,
          });
          await fixture.claim(orderB.orderId, orderB.itemId, customerB.unitId, '5', foreignSales);
          const all = rows(await list());
          assert.ok(all.some((row) => row.unitId === reserved.unitId));
          assert.ok(all.some((row) => row.unitId === customerB.unitId));
          for (const foreign of [otherInstallation, otherAuthority]) {
            assert.equal(
              all.some((row) => row.unitId === foreign.unitId),
              false,
            );
            assert.deepEqual(rows(await list({ internalCode: foreign.code })), []);
            assert.deepEqual(rows(await list({ unitId: foreign.unitId })), []);
            for (const [route, input] of [
              [inventoryRoutes.detail, { unitId: foreign.unitId }],
              [inventoryRoutes.lot, { lotId: foreign.lotId }],
            ] as const) {
              const response = await h.wh.call(route, input);
              assert.equal(response.status, 404);
              assert.deepEqual(await response.json(), { error: 'not-found' });
            }
          }
          const page = await list({}, 1);
          assert.equal(rows(page).length, 1);
          assert.deepEqual(Object.keys(page).sort(), ['freshness', 'items', 'nextCursor']);
          const disclosed = JSON.stringify(page);
          for (const foreign of [otherInstallation, otherAuthority])
            assert.equal(disclosed.includes(foreign.unitId), false);
          const visibleB = await detail(customerB.unitId);
          assert.equal(visibleB.state, 'RESERVED');
          assert.equal(JSON.stringify(visibleB).includes(fixture.people.otherCustomerId), false);
        },
      );

      await t.test(
        'I2 ORDER_LINE ORDER_ONLY UNLINKED share correct Inventory origin with no W2/W3 allocation',
        async () => {
          const association = (
            await db.owner.query<{ association_kind: string }>(
              'SELECT association_kind FROM procurement.inbound_received_unit WHERE installation_id=$1 AND authority_scope=$1 AND arrival_id=$2 ORDER BY association_kind',
              [installation, inbound.arrivalId],
            )
          ).rows.map((r) => r.association_kind);
          assert.deepEqual(association, ['ORDER_LINE', 'ORDER_ONLY', 'UNLINKED']);
          for (const origin of inbound.origins) {
            const unit = await detail(origin.unit_id);
            summary(unit, true);
            const source = object(unit.source);
            assert.deepEqual(Object.keys(source).sort(), [
              'arrivalId',
              'classificationProfile',
              'family',
              'initialKg',
              'materialTypeOptionId',
              'receivedUnitId',
              'weightBasis',
            ]);
            assert.equal(source.family, 'I2_RECEIVING');
            assert.equal(source.arrivalId, inbound.arrivalId);
            assert.equal(source.receivedUnitId, origin.received_unit_id);
            assert.equal(source.initialKg, '2000');
            assert.equal(source.weightBasis, 'WH_ACCEPTED_DECLARED_UNIT_WEIGHT');
            assert.equal(unit.productCode, null);
            assert.deepEqual(unit.quantities, {
              onHandKg: '2000',
              reservedKg: '0',
              unreservedKg: '2000',
            });
          }
        },
      );

      await t.test(
        'current Ledger quantities retain large integers, fractions, partial reservations and original weights',
        async () => {
          assert.deepEqual((await detail(big.unitId)).quantities, {
            onHandKg: '9007199254740993',
            reservedKg: '0',
            unreservedKg: '9007199254740993',
          });
          assert.deepEqual((await detail(reserved.unitId)).quantities, {
            onHandKg: '11',
            reservedKg: '5',
            unreservedKg: '6',
          });
          assert.deepEqual((await detail(packed.unitId)).quantities, {
            onHandKg: '11',
            reservedKg: '11',
            unreservedKg: '0',
          });
          const remainder = await detail(beam.unitId);
          assert.equal(remainder.state, 'PARTIALLY_CONSUMED');
          assert.deepEqual(remainder.quantities, {
            onHandKg: '39.5',
            reservedKg: '0',
            unreservedKg: '39.5',
          });
          assert.equal(object(remainder.source).initialKg, '110');
          const output = await detail(fractional.outId);
          assert.deepEqual(output.quantities, {
            onHandKg: '70.5',
            reservedKg: '0',
            unreservedKg: '70.5',
          });
          assert.equal(object(output.source).initialKg, '70.5');
          assert.equal(output.materialId, null);
          assert.equal(output.internalCode, null);
          const issue = (
            await db.owner.query<{ kg: string }>(
              "SELECT kg::text FROM inventory.production_issue WHERE unit_id=$1 AND state='ACTIVE'",
              [beam.unitId],
            )
          ).rows[0]!;
          assert.equal(issue.kg, '110', 'issue records original quantity, not current remainder');
          const totals = (
            await db.owner.query<{ hand: string; reserved: string }>(
              'SELECT sum(on_hand_delta)::text AS hand,sum(reserved_delta)::text AS reserved FROM inventory.ledger WHERE installation_id=$1 AND authority_scope=$1 AND unit_id=$2',
              [installation, beam.unitId],
            )
          ).rows[0]!;
          assert.deepEqual(totals, { hand: '39.5', reserved: '0' });
        },
      );

      await t.test(
        'production FINAL WIP RESIDUAL and multi-Unit authoritative Lot stay separate from current state',
        async () => {
          const wipUnit = await detail(wip.outId),
            residualUnit = await detail(wip.residualId);
          assert.equal(object(wipUnit.source).disposition, 'WIP');
          assert.equal(wipUnit.state, 'ISSUED_TO_PRODUCTION');
          assert.equal(object(residualUnit.source).disposition, 'RESIDUAL');
          assert.equal(object((await detail(final.outId)).source).disposition, 'FINAL');
          assert.equal(wipUnit.lotId, residualUnit.lotId);
          const lot = await responseData(
            await h.wh.call(inventoryRoutes.lot, { lotId: wipUnit.lotId, limit: 1 }),
          );
          assert.deepEqual(Object.keys(lot).sort(), ['freshness', 'items', 'lotId', 'nextCursor']);
          assert.equal(rows(lot).length, 1);
          assert.equal(typeof lot.nextCursor, 'string');
          const second = await responseData(
            await h.wh.call(inventoryRoutes.lot, {
              lotId: wipUnit.lotId,
              limit: 1,
              cursor: lot.nextCursor,
            }),
          );
          assert.deepEqual(
            [...rows(lot), ...rows(second)].map((r) => r.unitId).sort(),
            [wip.outId, wip.residualId].sort(),
          );
          assert.equal(second.nextCursor, null);
          assert.deepEqual(Object.keys(object(wipUnit.source)).sort(), [
            'disposition',
            'family',
            'initialKg',
            'productBatchId',
            'weightBasis',
          ]);
        },
      );

      await t.test(
        'intact WIP finalization changes current readiness while preserving original WIP provenance and quantities',
        async () => {
          const plan = await fixture.prepare({ steps: 2 });
          const first = fixture.complete(plan.ops[0]!, plan.source);
          completed(await fixture.run(first.input), 'accepted');
          const original = await detail(first.outId);
          assert.equal(original.state, 'ISSUED_TO_PRODUCTION');
          assert.equal(object(original.source).disposition, 'WIP');
          const ledgerBefore = (
            await db.owner.query<{ n: string }>(
              'SELECT count(*)::text AS n FROM inventory.ledger WHERE installation_id=$1 AND authority_scope=$1 AND unit_id=$2',
              [installation, first.outId],
            )
          ).rows[0]!.n;
          completed(
            await fixture.run(
              productionCommand('RecordStationReferral', plan.ops[0]!, {
                nextOperationId: plan.ops[1]!,
              }),
            ),
            'accepted',
          );
          completed(
            await fixture.run(productionCommand('StartProductionOperation', plan.ops[1]!)),
            'accepted',
          );
          completed(
            await fixture.run(
              productionCommand('CompleteProductionOperation', plan.ops[1]!, {
                inputs: [],
                outputs: [],
                residuals: [],
                scraps: [],
                finalizeUnitIds: [first.outId],
              }),
            ),
            'accepted',
          );
          const beforeRead = await h.stockSnapshot();
          const finalized = await detail(first.outId);
          assert.equal(finalized.state, 'AVAILABLE');
          assert.equal(finalized.stockClass, 'CURRENT');
          assert.equal(finalized.origin, 'PRODUCTION');
          assert.equal(
            object(finalized.source).disposition,
            'WIP',
            'origin is immutable original classification, not current readiness',
          );
          assert.equal(object(finalized.source).initialKg, '110');
          assert.deepEqual(finalized.quantities, {
            onHandKg: '110',
            reservedKg: '0',
            unreservedKg: '110',
          });
          const listRow = rows(await list({ unitId: first.outId, state: 'AVAILABLE' }))[0]!;
          assert.equal(listRow.state, 'AVAILABLE');
          assert.equal(listRow.stockClass, 'CURRENT');
          const associated = rows(
            await responseData(await h.wh.call(inventoryRoutes.lot, { lotId: finalized.lotId })),
          );
          assert.equal(associated.find((row) => row.unitId === first.outId)?.state, 'AVAILABLE');
          assert.equal(
            (
              await db.owner.query<{ n: string }>(
                'SELECT count(*)::text AS n FROM inventory.ledger WHERE installation_id=$1 AND authority_scope=$1 AND unit_id=$2',
                [installation, first.outId],
              )
            ).rows[0]!.n,
            ledgerBefore,
            'finalization adds no stock movement',
          );
          assert.equal(
            await h.stockSnapshot(),
            beforeRead,
            'readback itself changes no stock/source state',
          );
        },
      );

      await t.test(
        'zero-stock CONSUMED and SHIPPED appear only in canonical detail/Lot, with identical unsupported absence',
        async () => {
          for (const [id, state] of [
            [complete.source, 'CONSUMED'],
            [shipped.unitId, 'SHIPPED'],
          ] as const) {
            const unit = await detail(id);
            assert.equal(unit.state, state);
            assert.equal(unit.stockClass, 'HISTORICAL');
            assert.deepEqual(unit.quantities, {
              onHandKg: '0',
              reservedKg: '0',
              unreservedKg: '0',
            });
            assert.deepEqual(rows(await list({ unitId: id })), []);
            const lot = await responseData(
              await h.wh.call(inventoryRoutes.lot, { lotId: unit.lotId }),
            );
            assert.equal(rows(lot)[0]!.stockClass, 'HISTORICAL');
          }
          for (const route of [inventoryRoutes.detail, inventoryRoutes.lot]) {
            const response = await h.wh.call(
              route,
              route === inventoryRoutes.detail ? { unitId: randomUUID() } : { lotId: randomUUID() },
            );
            assert.equal(response.status, 404);
            assert.deepEqual(await response.json(), { error: 'not-found' });
          }
        },
      );

      await t.test(
        'strict object validation rejects coercion, unsupported filters, unknown/duplicate names and oversize bodies',
        async () => {
          for (const input of [
            null,
            [],
            { sort: 'unitId' },
            { limit: 0 },
            { limit: 51 },
            { limit: '25' },
            { filters: null },
            { filters: [] },
            { filters: { customerId: fixture.people.customerId } },
            { filters: { state: 'CONSUMED' } },
            { filters: { state: 'SCRAPPED' } },
            { filters: { origin: 'UNKNOWN' } },
            { filters: { kind: '\n' } },
            { filters: { internalCode: '   ' } },
            { filters: { internalCode: 'x'.repeat(129) } },
            { filters: { unitId: 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA' } },
          ]) {
            const response = await h.wh.call(inventoryRoutes.list, input);
            assert.equal(response.status, 400, JSON.stringify(input));
            assert.deepEqual(await response.json(), { error: 'invalid' });
          }
          for (const input of [
            '{"limit":1,"limit":2}',
            '{"filters":{"kind":"COIL","kind":"BEAM"}}',
            '{"filters":{"x":{"x":{"x":{"x":1}}}}}',
            '{} trailing',
          ]) {
            const response = await h.wh.call(inventoryRoutes.list, input);
            assert.equal(response.status, 400);
            assert.deepEqual(await response.json(), { error: 'invalid' });
          }
          const large = await h.wh.call(
            inventoryRoutes.list,
            JSON.stringify({ filters: { internalCode: 'x'.repeat(8192) } }),
          );
          assert.equal(large.status, 413);
          assert.deepEqual(await large.json(), { error: 'too-large' });
        },
      );

      await t.test(
        'UUID keyset pages have no duplicates, hidden totals or filter/session/query cursor substitution',
        async () => {
          const ids: string[] = [];
          let cursor: string | undefined;
          let firstCursor = '';
          do {
            const page = await list({}, 2, cursor);
            freshness(page);
            const entries = rows(page);
            assert.ok(entries.length <= 2);
            for (const row of entries) ids.push(String(row.unitId));
            if (!firstCursor && typeof page.nextCursor === 'string') firstCursor = page.nextCursor;
            cursor = typeof page.nextCursor === 'string' ? page.nextCursor : undefined;
          } while (cursor);
          assert.equal(ids.length, new Set(ids).size);
          assert.deepEqual(ids, [...ids].sort());
          assert.deepEqual(
            ids,
            rows(await list()).map((r) => String(r.unitId)),
          );
          assert.ok(firstCursor && firstCursor.length <= 2048);
          const otherSession = h.client();
          await otherSession.login();
          const requests = [
            h.wh.call(inventoryRoutes.list, { limit: 2, cursor: firstCursor + 'x' }),
            h.wh.call(inventoryRoutes.list, { limit: 3, cursor: firstCursor }),
            h.wh.call(inventoryRoutes.list, {
              limit: 2,
              cursor: firstCursor,
              filters: { kind: 'BEAM' },
            }),
            h.wh.call(inventoryRoutes.lot, { lotId: free.lotId, limit: 2, cursor: firstCursor }),
            otherSession.call(inventoryRoutes.list, { limit: 2, cursor: firstCursor }),
            h.wh.call(inventoryRoutes.list, { limit: 2, cursor: 'x'.repeat(2049) }),
          ];
          for (const response of await Promise.all(requests)) {
            assert.equal(response.status, 400);
            assert.deepEqual(await response.json(), { error: 'invalid-cursor' });
          }
        },
      );

      await t.test(
        'browser read admission denies other roles, role spoofing, CSRF, Origin, Host and bearer misuse',
        async () => {
          for (const role of ['ACT-PROC', 'ACT-SEC', 'ACT-CUST']) {
            const client = h.client(role);
            await client.login();
            for (const headers of [{}, { 'x-erp-role': 'ACT-WH' }]) {
              const response = await client.call(inventoryRoutes.list, {}, headers);
              assert.equal(response.status, 403, role);
              assert.deepEqual(await response.json(), { error: 'forbidden' });
            }
          }
          for (const [role, username] of [
            ['ACT-SALES', 'sales.first'],
            ['ACT-PLAN', 'sales.plan'],
            ['ACT-OP', 'sales.operator'],
          ] as const) {
            const client = h.client(role, username);
            await client.login('synthetic sales individual password');
            for (const headers of [{}, { 'x-erp-role': 'ACT-WH' }]) {
              const response = await client.call(inventoryRoutes.list, {}, headers);
              assert.equal(response.status, 403, role);
              assert.deepEqual(await response.json(), { error: 'forbidden' });
            }
          }
          const accountId = randomUUID(),
            personId = randomUUID(),
            username = 'p4a-scoped-wh-' + randomUUID();
          await db.owner.query(
            "INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) SELECT $1,$2,$3,$4,password_hash FROM identity.account WHERE installation_id=$1 AND username='receipt.act-wh'",
            [installation, accountId, personId, username],
          );
          await db.owner.query(
            "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$1,'ACT-WH',$3)",
            [installation, accountId, fixture.people.customerId],
          );
          const scoped = h.client('ACT-WH', username);
          await scoped.login();
          const denied = await scoped.call(inventoryRoutes.list, {});
          assert.equal(denied.status, 403);
          assert.deepEqual(await denied.json(), { error: 'forbidden' });
          for (const headers of [
            { 'x-erp-csrf': '' },
            { origin: 'https://foreign.invalid' },
            { 'sec-fetch-site': 'cross-site' },
            { authorization: 'Bearer ' + fixture.warehouse.tokens.get('ACT-WH')! },
            { 'x-erp-role': 'ACT-WH, ACT-WH' },
            { 'x-erp-browser': '0' },
          ]) {
            const response = await h.wh.call(inventoryRoutes.list, {}, headers);
            assert.equal(response.status, 403, Object.keys(headers).join(','));
            assert.deepEqual(await response.json(), { error: 'forbidden' });
          }
          for (const headers of [
            { host: 'foreign.invalid' },
            { 'x-erp-role': ['ACT-WH', 'ACT-WH'] },
          ]) {
            const response = await h.wh.rawCall(inventoryRoutes.list, {}, headers);
            assert.equal(response.status, 403);
            assert.deepEqual(response.body, { error: 'forbidden' });
          }
          const get = await h.wh.call(inventoryRoutes.list);
          assert.equal(get.status, 405);
          assert.equal(get.headers.get('allow'), 'POST');
          assert.deepEqual(await get.json(), { error: 'method-not-allowed' });
          const legacy = await fetch(h.origin + '/inventory/units/' + free.unitId, {
            headers: { cookie: h.wh.cookie },
          });
          assert.equal(legacy.status, 401, 'ordinary bearer route cannot consume browser cookie');
        },
      );

      await t.test(
        'one page retains a committed before-snapshot bundle while a real owner reservation commits without read writer locks',
        async () => {
          const source = await h.legacy();
          const order = await fixture.order([source.unitId], { demandedKg: '5', partial: true });
          const request = reservationCommand(order.orderId, order.itemId, source.unitId, '5');
          completed(await fixture.salesRun(request), 'accepted');
          const barrier = readBarrier();
          // This method is deliberately rebound with apply(this,args) below.
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const original = PostgresInventoryDiscoveryStore.prototype.candidates;
          PostgresInventoryDiscoveryStore.prototype.candidates = async function (...args) {
            const result = await original.apply(this, args);
            await barrier.enter();
            return result;
          };
          let pending: Promise<Row> | undefined;
          try {
            pending = list({ unitId: source.unitId });
            await barrier.ready;
            const activation = {
              ...request,
              command: 'ActivateReservation',
              payload: {},
              idempotency_key: randomUUID(),
            };
            const started = performance.now();
            completed(await fixture.salesRun(activation), 'accepted');
            assert.ok(
              performance.now() - started < 4000,
              'reader must not acquire Inventory writer locks',
            );
            const waits = (
              await db.owner.query<{ n: number }>(
                "SELECT count(*)::int AS n FROM pg_locks l JOIN pg_stat_activity a USING(pid) WHERE a.datname=current_database() AND a.application_name='navard-envelope' AND l.locktype='advisory' AND NOT l.granted",
              )
            ).rows[0]!.n;
            assert.equal(waits, 0);
            barrier.release();
            const before = rows(await pending)[0]!;
            assert.equal(before.state, 'AVAILABLE');
            assert.deepEqual(before.quantities, {
              onHandKg: '11',
              reservedKg: '0',
              unreservedKg: '11',
            });
          } finally {
            barrier.release();
            PostgresInventoryDiscoveryStore.prototype.candidates = original;
            await pending?.catch(() => undefined);
          }
          const after = rows(await list({ unitId: source.unitId }))[0]!;
          assert.equal(after.state, 'RESERVED');
          assert.deepEqual(after.quantities, {
            onHandKg: '11',
            reservedKg: '5',
            unreservedKg: '6',
          });
        },
      );

      await t.test(
        'post-snapshot grant revocation wins before any private response disclosure',
        async () => {
          const barrier = readBarrier();
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const original = PostgresInventoryDiscoveryStore.prototype.links;
          PostgresInventoryDiscoveryStore.prototype.links = async function (...args) {
            const result = await original.apply(this, args);
            await barrier.enter();
            return result;
          };
          let pending: Promise<Response> | undefined;
          const accountId = String(h.wh.self!.accountId);
          try {
            pending = h.wh.call(inventoryRoutes.detail, { unitId: big.unitId });
            await barrier.ready;
            await db.owner.query(
              "DELETE FROM identity.role_grant WHERE installation_id=$1 AND account_id=$2 AND actor_role='ACT-WH' AND customer_scope=''",
              [installation, accountId],
            );
            barrier.release();
            const response = await pending;
            assert.equal(response.status, 403);
            assert.deepEqual(await response.json(), { error: 'forbidden' });
          } finally {
            barrier.release();
            PostgresInventoryDiscoveryStore.prototype.links = original;
            await pending?.catch(() => undefined);
            await db.owner.query(
              "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$1,'ACT-WH','') ON CONFLICT DO NOTHING",
              [installation, accountId],
            );
          }
        },
      );

      await t.test(
        'post-snapshot revocation of the actual browser session wins before private disclosure',
        async () => {
          const client = h.client();
          await client.login();
          const token = client.cookie.slice(client.cookie.indexOf('=') + 1);
          const digest = createHash('sha256').update(token).digest('hex');
          const barrier = readBarrier();
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const original = PostgresInventoryDiscoveryStore.prototype.links;
          PostgresInventoryDiscoveryStore.prototype.links = async function (...args) {
            const result = await original.apply(this, args);
            await barrier.enter();
            return result;
          };
          let pending: Promise<Response> | undefined;
          try {
            pending = client.call(inventoryRoutes.detail, { unitId: big.unitId });
            await barrier.ready;
            const revoked = await db.owner.query(
              'UPDATE identity.session SET revoked_at=clock_timestamp() WHERE installation_id=$1 AND token_digest=$2',
              [installation, digest],
            );
            assert.equal(revoked.rowCount, 1);
            barrier.release();
            const response = await pending;
            assert.equal(response.status, 401);
            assert.deepEqual(await response.json(), { error: 'unauthenticated' });
          } finally {
            barrier.release();
            PostgresInventoryDiscoveryStore.prototype.links = original;
            await pending?.catch(() => undefined);
          }
        },
      );

      await t.test(
        'missing and divergent Balance fail the entire read without omission or repair',
        async () => {
          const source = await h.legacy();
          await db.owner.query('DELETE FROM inventory.balance WHERE unit_id=$1', [source.unitId]);
          let before = await h.stockSnapshot();
          for (const response of [
            await h.wh.call(inventoryRoutes.detail, { unitId: source.unitId }),
            await h.wh.call(inventoryRoutes.list, { filters: { unitId: source.unitId } }),
          ]) {
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'unavailable' });
          }
          assert.equal(await h.stockSnapshot(), before);
          await db.owner.query(
            'INSERT INTO inventory.balance(installation_id,authority_scope,unit_id,on_hand,reserved) VALUES($1,$1,$2,10,0)',
            [installation, source.unitId],
          );
          before = await h.stockSnapshot();
          const response = await h.wh.call(inventoryRoutes.detail, { unitId: source.unitId });
          assert.equal(response.status, 503);
          assert.deepEqual(await response.json(), { error: 'unavailable' });
          assert.equal(await h.stockSnapshot(), before);
          await db.owner.query('UPDATE inventory.balance SET on_hand=11 WHERE unit_id=$1', [
            source.unitId,
          ]);
        },
      );

      await t.test(
        'valid positive issue remainder is accepted; simultaneous ACTIVE claim and issue fails closed',
        async () => {
          const valid = await detail(partial.source);
          assert.deepEqual(valid.quantities, {
            onHandKg: '40',
            reservedKg: '0',
            unreservedKg: '40',
          });
          const id = randomUUID();
          await db.owner.query(
            "INSERT INTO inventory.reservation(installation_id,authority_scope,reservation_id,unit_id,demand_id,kg,state) VALUES($1,$1,$2,$3,$4,1,'ACTIVE')",
            [installation, id, issued.source, randomUUID()],
          );
          const before = await h.stockSnapshot();
          const response = await h.wh.call(inventoryRoutes.detail, { unitId: issued.source });
          assert.equal(response.status, 503);
          assert.deepEqual(await response.json(), { error: 'unavailable' });
          assert.equal(await h.stockSnapshot(), before);
          await db.owner.query('DELETE FROM inventory.reservation WHERE reservation_id=$1', [id]);
        },
      );

      await t.test(
        'PACKED requires a whole-Unit claim even when Ledger Balance and claim agree on a smaller amount',
        async () => {
          async function setReserved(kg: string) {
            const connection = await db.owner.connect();
            try {
              await connection.query('BEGIN');
              // Deliberate owner-role corruption probe, never a runtime stock path.
              // Restore trigger state in the same transaction before its COMMIT.
              await connection.query('ALTER TABLE inventory.ledger DISABLE TRIGGER USER');
              await connection.query(
                'UPDATE inventory.ledger SET reserved_delta=$2 WHERE unit_id=$1 AND reserved_delta>0',
                [packed.unitId, kg],
              );
              await connection.query('UPDATE inventory.balance SET reserved=$2 WHERE unit_id=$1', [
                packed.unitId,
                kg,
              ]);
              await connection.query(
                "UPDATE inventory.reservation SET kg=$2 WHERE unit_id=$1 AND state='ACTIVE'",
                [packed.unitId, kg],
              );
              await connection.query('ALTER TABLE inventory.ledger ENABLE TRIGGER USER');
              await connection.query('COMMIT');
            } catch (error) {
              await connection.query('ROLLBACK');
              throw error;
            } finally {
              connection.release();
            }
          }
          try {
            await setReserved('5');
            const before = await h.stockSnapshot();
            const response = await h.wh.call(inventoryRoutes.detail, { unitId: packed.unitId });
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'unavailable' });
            assert.equal(await h.stockSnapshot(), before);
          } finally {
            await setReserved('11');
          }
          assert.equal((await detail(packed.unitId)).state, 'PACKED');
        },
      );

      await t.test(
        'production issue customer must agree with a customer-bound Unit, without disclosing that customer',
        async () => {
          async function setIssueCustomer(customer: string) {
            const connection = await db.owner.connect();
            try {
              await connection.query('BEGIN');
              await connection.query('ALTER TABLE inventory.production_issue DISABLE TRIGGER USER');
              await connection.query(
                "UPDATE inventory.production_issue SET customer_id=$2 WHERE unit_id=$1 AND state='ACTIVE'",
                [wip.outId, customer],
              );
              await connection.query('ALTER TABLE inventory.production_issue ENABLE TRIGGER USER');
              await connection.query('COMMIT');
            } catch (error) {
              await connection.query('ROLLBACK');
              throw error;
            } finally {
              connection.release();
            }
          }
          try {
            await setIssueCustomer(fixture.people.otherCustomerId);
            const before = await h.stockSnapshot();
            const response = await h.wh.call(inventoryRoutes.detail, { unitId: wip.outId });
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'unavailable' });
            assert.equal(await h.stockSnapshot(), before);
          } finally {
            await setIssueCustomer(fixture.people.customerId);
          }
        },
      );

      await t.test(
        'conflicting source families fail closed and unsupported lifecycle roots match absent roots',
        async () => {
          const i2Origin = inbound.origins[0]!;
          async function moveI2Origin(unit: string, lot: string) {
            const connection = await db.owner.connect();
            try {
              await connection.query('BEGIN');
              await connection.query(
                'ALTER TABLE inventory.inbound_unit_origin DISABLE TRIGGER USER',
              );
              await connection.query(
                'UPDATE inventory.inbound_unit_origin SET unit_id=$2,lot_id=$3 WHERE received_unit_id=$1',
                [i2Origin.received_unit_id, unit, lot],
              );
              await connection.query(
                'ALTER TABLE inventory.inbound_unit_origin ENABLE TRIGGER USER',
              );
              await connection.query('COMMIT');
            } catch (error) {
              await connection.query('ROLLBACK');
              throw error;
            } finally {
              connection.release();
            }
          }
          try {
            await moveI2Origin(free.unitId, free.lotId);
            const before = await h.stockSnapshot();
            const response = await h.wh.call(inventoryRoutes.detail, { unitId: free.unitId });
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'unavailable' });
            assert.equal(await h.stockSnapshot(), before);
          } finally {
            await moveI2Origin(i2Origin.unit_id, i2Origin.lot_id);
          }
          try {
            await db.owner.query("UPDATE inventory.unit SET state='SCRAPPED' WHERE unit_id=$1", [
              free.unitId,
            ]);
            const response = await h.wh.call(inventoryRoutes.detail, { unitId: free.unitId });
            assert.equal(response.status, 404);
            assert.deepEqual(await response.json(), { error: 'not-found' });
            const lot = await h.wh.call(inventoryRoutes.lot, { lotId: free.lotId });
            assert.equal(lot.status, 404);
            assert.deepEqual(await lot.json(), { error: 'not-found' });
            assert.deepEqual(rows(await list({ unitId: free.unitId })), []);
          } finally {
            await db.owner.query("UPDATE inventory.unit SET state='AVAILABLE' WHERE unit_id=$1", [
              free.unitId,
            ]);
          }
        },
      );

      await t.test(
        'signed but expired and future cursors fail identically without making a fresh traversal',
        async () => {
          const page = await list({}, 2);
          assert.equal(typeof page.nextCursor, 'string');
          const payload = object(
            JSON.parse(
              Buffer.from(String(page.nextCursor).split('.')[0]!, 'base64url').toString('utf8'),
            ),
          );
          const now = Math.floor(Date.now() / 1000);
          for (const issuedAt of [now - 601, now + 60]) {
            const encoded = canonicalJson({
              ...payload,
              issuedAt,
              expiresAt: issuedAt + 600,
            }).toString('base64url');
            const signature = createHmac('sha256', h.secret)
              .update(JSON.stringify(['inventory-cursor-v1', h.origin, encoded]))
              .digest('base64url');
            const response = await h.wh.call(inventoryRoutes.list, {
              limit: 2,
              cursor: encoded + '.' + signature,
            });
            assert.equal(response.status, 400);
            assert.deepEqual(await response.json(), { error: 'invalid-cursor' });
          }
        },
      );

      await t.test(
        'concurrent committed insertions before an anchor wait for refresh while later UUIDs remain discoverable',
        async () => {
          const initial = rows(await list())
            .map((row) => String(row.unitId))
            .sort();
          const anchor = initial[Math.floor(initial.length / 2)]!;
          let page = await list({}, 1);
          while (String(rows(page)[0]!.unitId) !== anchor) {
            assert.equal(typeof page.nextCursor, 'string');
            page = await list({}, 1, String(page.nextCursor));
          }
          const continuation = String(page.nextCursor);
          assert.equal(typeof page.nextCursor, 'string');
          const additions: string[] = [];
          for (
            let count = 0;
            count < 64 &&
            !(additions.some((id) => id < anchor) && additions.some((id) => id > anchor));
            count++
          ) {
            additions.push((await h.legacy()).unitId);
          }
          assert.ok(
            additions.some((id) => id < anchor) && additions.some((id) => id > anchor),
            'actual owner-command UUIDs bracket the middle anchor',
          );
          const observed: string[] = [];
          let cursor: string | null = continuation;
          while (cursor) {
            const next = await list({}, 1, cursor);
            observed.push(...rows(next).map((row) => String(row.unitId)));
            assert.ok(next.nextCursor === null || typeof next.nextCursor === 'string');
            cursor = next.nextCursor;
          }
          assert.equal(new Set(observed).size, observed.length);
          assert.ok(observed.every((id) => id > anchor));
          for (const added of additions) assert.equal(observed.includes(added), added > anchor);
          const refreshed = rows(await list()).map((row) => String(row.unitId));
          for (const added of additions) assert.ok(refreshed.includes(added));
        },
      );

      await t.test(
        'one-connection composed pool releases the read snapshot before checking current authority',
        async () => {
          // Deliberately constrain the real composed pool, without replacing Identity,
          // its store or the Inventory read service with a test authorization adapter.
          const pool = (h.app.identity as unknown as { store: { pool: Pool } }).store.pool;
          const previous = pool.options.max;
          pool.options.max = 1;
          try {
            // Earlier parallel HTTP cases may already have opened several idle
            // clients. Merely lowering max does not remove them from node-postgres.
            while (pool.totalCount > 1) (await pool.connect()).release(true);
            assert.equal(pool.totalCount, 1);
            const started = performance.now();
            const response = await h.wh.call(inventoryRoutes.detail, { unitId: big.unitId });
            assert.equal(response.status, 200);
            const data = await responseData(response);
            assert.equal(object(data.unit).unitId, big.unitId);
            assert.ok(
              performance.now() - started < 4000,
              'final authority must not wait on its own held snapshot connection',
            );
            assert.equal(pool.waitingCount, 0);
            assert.equal(pool.totalCount, 1);
          } finally {
            pool.options.max = previous;
          }
        },
      );

      await t.test(
        'the seventeenth active browser read is rejected before additional database admission',
        async () => {
          const original = h.app.identity.contextAndSession.bind(h.app.identity);
          let reached = 0,
            ready!: () => void,
            release!: () => void;
          const full = new Promise<void>((resolve) => {
            ready = resolve;
          });
          const gate = new Promise<void>((resolve) => {
            release = resolve;
          });
          const timer = setTimeout(() => ready(), 5000);
          h.app.identity.contextAndSession = async (...args) => {
            const admission = await original(...args);
            reached++;
            if (reached === 16) ready();
            await gate;
            return admission;
          };
          const pending = Array.from({ length: 16 }, () =>
            h.wh.call(inventoryRoutes.detail, { unitId: big.unitId }),
          );
          try {
            await full;
            assert.equal(
              reached,
              16,
              'all sixteen real Identity contexts reached the admission barrier',
            );
            const response = await h.wh.call(inventoryRoutes.detail, { unitId: big.unitId });
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'unavailable' });
            assert.equal(
              reached,
              16,
              'overflow must not invoke another Identity/database admission',
            );
            release();
            for (const result of await Promise.all(pending)) await responseData(result);
          } finally {
            clearTimeout(timer);
            release();
            h.app.identity.contextAndSession = original;
            await Promise.allSettled(pending);
          }
        },
      );

      await t.test(
        'candidate and sentinel work is limited to fifty-one authorized Units and a corrupt lookahead cannot disappear',
        async () => {
          while (rows(await list()).length < 50) await h.legacy();
          // Fifty returned rows need one additional real candidate, not a count query.
          await h.legacy();
          const calls = { candidates: 0, ledger: 0, links: 0 };
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const candidates = PostgresInventoryDiscoveryStore.prototype.candidates;
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const ledger = PostgresInventoryDiscoveryStore.prototype.ledger;
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const links = PostgresInventoryDiscoveryStore.prototype.links;
          PostgresInventoryDiscoveryStore.prototype.candidates = async function (...args) {
            calls.candidates++;
            assert.equal(args[1].take, 51);
            const result = await candidates.apply(this, args);
            assert.equal(result.length, 51);
            return result;
          };
          PostgresInventoryDiscoveryStore.prototype.ledger = async function (...args) {
            calls.ledger++;
            assert.equal(args[1].length, 51);
            return ledger.apply(this, args);
          };
          PostgresInventoryDiscoveryStore.prototype.links = async function (...args) {
            calls.links++;
            assert.equal(args[1].length, 51);
            return links.apply(this, args);
          };
          try {
            const response = await h.wh.call(inventoryRoutes.list, { limit: 50 });
            const raw = await response.text();
            assert.equal(response.status, 200);
            assert.ok(Buffer.byteLength(raw) <= 131072);
            const data = object(object(JSON.parse(raw)).data);
            assert.equal(rows(data).length, 50);
            assert.equal(typeof data.nextCursor, 'string');
            assert.deepEqual(calls, { candidates: 1, ledger: 1, links: 1 });
          } finally {
            PostgresInventoryDiscoveryStore.prototype.candidates = candidates;
            PostgresInventoryDiscoveryStore.prototype.ledger = ledger;
            PostgresInventoryDiscoveryStore.prototype.links = links;
          }
          const first = await list({}, 1);
          const second = rows(await list({}, 1, String(first.nextCursor)))[0]!;
          const saved = (
            await db.owner.query('SELECT * FROM inventory.balance WHERE unit_id=$1', [
              second.unitId,
            ])
          ).rows[0] as {
            installation_id: string;
            authority_scope: string;
            unit_id: string;
            on_hand: string;
            reserved: string;
          };
          await db.owner.query('DELETE FROM inventory.balance WHERE unit_id=$1', [second.unitId]);
          try {
            const response = await h.wh.call(inventoryRoutes.list, { limit: 1 });
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'unavailable' });
          } finally {
            await db.owner.query(
              'INSERT INTO inventory.balance(installation_id,authority_scope,unit_id,on_hand,reserved) VALUES($1,$2,$3,$4,$5)',
              [
                saved.installation_id,
                saved.authority_scope,
                saved.unit_id,
                saved.on_hand,
                saved.reserved,
              ],
            );
          }
        },
      );

      await t.test(
        'real exhausted pool acquisition times out or aborts and a late checkout is returned instead of leaked',
        async () => {
          const pool = new Pool({
            connectionString: process.env.TEST_DATABASE_URL!,
            max: 1,
            connectionTimeoutMillis: 2000,
          });
          pool.on('error', () => undefined);
          const txs = new PostgresTransactions(pool, {
            acquireTimeoutMs: 100,
            deadlineMs: 8000,
            statementTimeoutMs: 4000,
            lockTimeoutMs: 1000,
          });
          let held = await pool.connect();
          try {
            const started = performance.now();
            await assert.rejects(txs.begin('read-snapshot'));
            assert.ok(performance.now() - started >= 75 && performance.now() - started < 1000);
            held.release();
            // Queue a genuine query behind the late aborted checkout; if it leaked,
            // this query could not obtain the only connection.
            assert.equal((await pool.query<{ n: number }>('SELECT 1 AS n')).rows[0]?.n, 1);
            assert.equal(pool.waitingCount, 0);
            held = await pool.connect();
            const controller = new AbortController();
            const pending = txs.begin('read-snapshot', controller.signal);
            controller.abort();
            await assert.rejects(pending);
            held.release();
            assert.equal((await pool.query<{ n: number }>('SELECT 2 AS n')).rows[0]?.n, 2);
            const read = await txs.begin('read-snapshot');
            try {
              const settings = (
                await transactionClient(read.context).query(
                  "SELECT current_setting('transaction_read_only') AS ro,current_setting('transaction_isolation') AS isolation,current_setting('statement_timeout') AS statement,current_setting('lock_timeout') AS lock",
                )
              ).rows[0] as Record<string, string>;
              assert.deepEqual(settings, {
                ro: 'on',
                isolation: 'repeatable read',
                statement: '4s',
                lock: '1s',
              });
              await read.commit();
            } finally {
              await read.release();
            }
            assert.equal(pool.waitingCount, 0);
          } finally {
            if (pool.idleCount === 0 && pool.totalCount > 0) {
              try {
                held.release();
              } catch {
                /* already returned */
              }
            }
            await pool.end();
          }
        },
      );

      await t.test(
        'real read statement timeout and DDL lock timeout release their snapshot without partial data',
        async () => {
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const original = PostgresInventoryDiscoveryStore.prototype.candidates;
          PostgresInventoryDiscoveryStore.prototype.candidates = async function (...args) {
            await transactionClient(args[0].transaction).query('SELECT pg_sleep(10)');
            return original.apply(this, args);
          };
          try {
            const started = performance.now();
            const response = await h.wh.call(inventoryRoutes.detail, { unitId: big.unitId });
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'unavailable' });
            assert.ok(performance.now() - started >= 3500);
            assert.ok(performance.now() - started < 7000);
          } finally {
            PostgresInventoryDiscoveryStore.prototype.candidates = original;
          }
          const ddl = await db.owner.connect();
          try {
            await ddl.query('BEGIN');
            await ddl.query('LOCK TABLE inventory.unit IN ACCESS EXCLUSIVE MODE');
            const started = performance.now();
            const response = await h.wh.call(inventoryRoutes.detail, { unitId: big.unitId });
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'unavailable' });
            assert.ok(performance.now() - started >= 700);
            assert.ok(performance.now() - started < 4000);
          } finally {
            await ddl.query('ROLLBACK');
            ddl.release();
          }
          await detail(big.unitId);
        },
      );

      await t.test(
        'an abandoned browser client cannot leave its real timed-out database query or snapshot alive',
        async () => {
          let ready!: () => void;
          const running = new Promise<void>((resolve) => {
            ready = resolve;
          });
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const original = PostgresInventoryDiscoveryStore.prototype.candidates;
          PostgresInventoryDiscoveryStore.prototype.candidates = async function (...args) {
            const result = await original.apply(this, args);
            ready();
            await transactionClient(args[0].transaction).query('SELECT pg_sleep(10)');
            return result;
          };
          const controller = new AbortController();
          const request = fetch(h.origin + '/ui-api' + inventoryRoutes.detail, {
            method: 'POST',
            headers: {
              origin: h.origin,
              'x-erp-browser': '1',
              'sec-fetch-site': 'same-origin',
              'x-erp-role': 'ACT-WH',
              cookie: h.wh.cookie,
              'x-erp-csrf': h.wh.csrf,
              'content-type': 'application/json',
            },
            body: JSON.stringify({ unitId: big.unitId }),
            signal: controller.signal,
          });
          // Attach immediately so an actual abort cannot become an unhandled rejection.
          const rejected = assert.rejects(request, { name: 'AbortError' });
          let readyTimer: ReturnType<typeof setTimeout> | undefined;
          try {
            await Promise.race([
              running,
              new Promise<never>((_resolve, reject) => {
                readyTimer = setTimeout(
                  () =>
                    reject(new Error('Abandoned-client probe did not reach actual database read')),
                  5000,
                );
              }),
            ]);
            clearTimeout(readyTimer);
            const observedStart = performance.now();
            let active = 0;
            while (!active && performance.now() - observedStart < 2000) {
              active = (
                await db.runtime.query<{ n: number }>(
                  "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND application_name='navard-envelope' AND state='active' AND query='SELECT pg_sleep(10)'",
                )
              ).rows[0]!.n;
              if (!active) await new Promise((resolve) => setTimeout(resolve, 10));
            }
            assert.equal(
              active,
              1,
              'same runtime role must observe the actual sleep before abandoning it',
            );
            const started = performance.now();
            controller.abort();
            await rejected;
            let remaining = 1;
            while (remaining && performance.now() - started < 6000) {
              remaining = (
                await db.runtime.query<{ n: number }>(
                  "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND application_name='navard-envelope' AND (state='idle in transaction' OR (state='active' AND query='SELECT pg_sleep(10)'))",
                )
              ).rows[0]!.n;
              if (remaining) await new Promise((resolve) => setTimeout(resolve, 25));
            }
            assert.equal(remaining, 0, 'statement/deadline cleanup must remove abandoned work');
          } finally {
            clearTimeout(readyTimer);
            controller.abort();
            PostgresInventoryDiscoveryStore.prototype.candidates = original;
            await request.catch(() => undefined);
          }
          await detail(big.unitId);
        },
      );

      await t.test(
        'the full handler deadline cancels a stalled read and releases its real snapshot connection',
        async () => {
          const barrier = readBarrier();
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const original = PostgresInventoryDiscoveryStore.prototype.candidates;
          PostgresInventoryDiscoveryStore.prototype.candidates = async function (...args) {
            const result = await original.apply(this, args);
            await barrier.enter();
            return result;
          };
          let pending: Promise<Response> | undefined;
          const serverElapsed: number[] = [];
          const measure = (request: IncomingMessage, response: ServerResponse) => {
            if (request.url !== '/ui-api' + inventoryRoutes.detail) return;
            const started = performance.now();
            response.once('finish', () => serverElapsed.push(performance.now() - started));
          };
          h.app.server.prependListener('request', measure);
          try {
            const started = performance.now();
            pending = h.wh.call(inventoryRoutes.detail, { unitId: big.unitId });
            await barrier.ready;
            const held = (
              await db.runtime.query<{ n: number }>(
                "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND application_name='navard-envelope' AND state='idle in transaction'",
              )
            ).rows[0]!.n;
            assert.ok(
              held >= 1,
              'same runtime role must observe the paused real read snapshot before its deadline',
            );
            const response = await pending;
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), { error: 'unavailable' });
            const elapsed = performance.now() - started;
            assert.ok(
              elapsed >= 7500 && elapsed < 9500,
              'client duration must remain bounded; strict server bound is asserted independently',
            );
            assert.equal(serverElapsed.length, 1);
            assert.ok(
              serverElapsed[0]! <= 8000,
              `server request-to-finish exceeded 8 seconds: ${serverElapsed[0]}ms`,
            );
            t.diagnostic(
              JSON.stringify({
                probe: 'full-handler-deadline',
                serverElapsedMs: serverElapsed[0],
                clientElapsedMs: elapsed,
              }),
            );
            const open = (
              await db.runtime.query<{ n: number }>(
                "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND application_name='navard-envelope' AND state='idle in transaction'",
              )
            ).rows[0]!.n;
            assert.equal(open, 0, 'deadline must discard the open read snapshot');
          } finally {
            h.app.server.off('request', measure);
            barrier.release();
            PostgresInventoryDiscoveryStore.prototype.candidates = original;
            await pending?.catch(() => undefined);
          }
          await detail(big.unitId);
        },
      );

      await t.test(
        'encoded response overflow is rejected after a real owner read without sending partial fields',
        async () => {
          const before = await h.stockSnapshot();
          // Inject a serialization fault after the actual authorized database read.
          // This verifies the final byte guard, not a fake SQL/integrity behavior.
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const original = InventoryDiscoveryService.prototype.query;
          InventoryDiscoveryService.prototype.query = async function (...args) {
            const value = await original.apply(this, args);
            return Object.assign(value, { unexpectedOversizeFault: 'x'.repeat(131073) });
          };
          try {
            const response = await h.wh.call(inventoryRoutes.detail, { unitId: big.unitId });
            assert.equal(response.status, 422);
            assert.deepEqual(await response.json(), { error: 'query-limit' });
          } finally {
            InventoryDiscoveryService.prototype.query = original;
          }
          assert.equal(await h.stockSnapshot(), before);
        },
      );

      await t.test(
        'a single Unit with more than ten thousand Ledger rows reports a query limit without partial quantities',
        async () => {
          const hot = await h.legacy();
          await db.owner.query(
            `
          INSERT INTO inventory.ledger(installation_id,authority_scope,ledger_id,unit_id,source_fact_id,effect_id,binding,on_hand_delta,reserved_delta,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key)
          SELECT $1,$1,gen_random_uuid(),$2,gen_random_uuid(),gen_random_uuid(),'synthetic history bound probe',CASE WHEN n%2=0 THEN -1 ELSE 1 END,0,'local:test','synthetic','ACT-WH',gen_random_uuid(),'HistoryBoundProbe',1,gen_random_uuid()
          FROM generate_series(1,10000) n
        `,
            [installation, hot.unitId],
          );
          const before = await h.stockSnapshot();
          const response = await h.wh.call(inventoryRoutes.detail, { unitId: hot.unitId });
          assert.equal(response.status, 422);
          assert.deepEqual(await response.json(), { error: 'query-limit' });
          assert.equal(await h.stockSnapshot(), before);
          // The same Unit filter cannot make this Unit's history shorter.
          const narrowed = await h.wh.call(inventoryRoutes.list, {
            filters: { unitId: hot.unitId },
            limit: 1,
          });
          assert.equal(narrowed.status, 422);
          assert.deepEqual(await narrowed.json(), { error: 'query-limit' });
        },
      );

      await t.test(
        'expired session produces only a sanitized unauthenticated response',
        async () => {
          const accountId = String(h.wh.self!.accountId);
          await db.owner.query(
            "UPDATE identity.session SET expires_at=clock_timestamp()-interval '1 second' WHERE account_id=$1",
            [accountId],
          );
          const response = await h.wh.call(inventoryRoutes.detail, { unitId: big.unitId });
          assert.equal(response.status, 401);
          assert.deepEqual(await response.json(), { error: 'unauthenticated' });
        },
      );
    } finally {
      await h.stop();
    }
  }));

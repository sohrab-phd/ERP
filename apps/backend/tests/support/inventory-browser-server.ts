import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { withDatabase } from './database-fixture.js';
import {
  inventoryDiscoveryHarness,
  inventoryRoutes,
  object,
  responseData,
} from './inventory-discovery-harness.js';
import { browserReceivingLocation } from './browser-harness.js';
import { completed, installation } from './receipt-harness.js';
import { productionCommand } from './production-harness.js';

// Only the dedicated fixture process owns this clock. Captured cursor clocks
// see the offset; PostgreSQL/session time and product assets stay real.
const realNow = Date.now.bind(Date);
let cursorOffset = 0;
Date.now = () => realNow() + cursorOffset;

/** Test-only real PostgreSQL/native-browser fixture. No production entry point,
 * credentials in output, synthetic auth adapter, private API or mocked UI.
 */
await withDatabase(async (db) => {
  const h = await inventoryDiscoveryHarness(db, { receivingLocation: browserReceivingLocation });
  const foreignServer = createServer((request, response) => {
    request.resume();
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<!doctype html><title>Foreign origin fixture</title>');
  });
  try {
    await new Promise<void>((resolveListen, reject) => {
      foreignServer.once('error', reject);
      foreignServer.listen(0, '127.0.0.1', resolveListen);
    });
    const foreignAddress = foreignServer.address();
    assert.ok(foreignAddress && typeof foreignAddress === 'object');
    const foreignOrigin = `http://127.0.0.1:${foreignAddress.port}`;
    const foreignResponses: { method: string | undefined; status: number }[] = [];
    h.app.server.prependListener('request', (request, response) => {
      if (
        request.url === '/ui-api/inventory/v1/units/query' &&
        request.headers.origin === foreignOrigin
      )
        response.once('finish', () =>
          foreignResponses.push({ method: request.method, status: response.statusCode }),
        );
    });
    const f = h.fixture;
    const free = await h.legacy('11', ' کد-۱۲_exact_% ');
    const xss = await h.legacy('9', '<img src=x onerror=window.p4aXss=true>', 'BEAM');
    const big = await h.legacy('9007199254740993', 'P4A-BROWSER-BIG');
    const i2 = await h.i2();
    for (let i = 0; i < 56; i++)
      await h.legacy('11', 'P4A-BROWSER-PAGE-' + String(i).padStart(2, '0'));
    const reserved = await h.legacy('11', 'P4A-BROWSER-RESERVED');
    const reservedOrder = await f.order([reserved.unitId], { demandedKg: '5', partial: true });
    await f.claim(reservedOrder.orderId, reservedOrder.itemId, reserved.unitId, '5');
    const packed = await h.legacy('11', 'P4A-BROWSER-PACKED');
    const packedOrder = await f.order([packed.unitId]);
    const packedClaim = await f.claim(packedOrder.orderId, packedOrder.itemId, packed.unitId);
    await f.ready(packedOrder.orderId, [packedClaim.target.id]);
    const shipped = await h.legacy('11', 'P4A-BROWSER-SHIPPED');
    const shippedOrder = await f.order([shipped.unitId]);
    const shippedClaim = await f.claim(shippedOrder.orderId, shippedOrder.itemId, shipped.unitId);
    const shipping = await f.ready(shippedOrder.orderId, [shippedClaim.target.id]);
    completed(await f.app.command(JSON.stringify(shipping.dispatch), f.ship), 'accepted');
    const issued = await f.prepare();
    const partial = await f.prepare({ steps: 2 });
    const wip = f.complete(partial.ops[0]!, partial.source, '70', '50', {
      residual: '10',
      scrap: '10',
    });
    completed(await f.run(wip.input, f.manager), 'accepted');
    const full = await f.prepare();
    const final = f.complete(full.ops[0]!, full.source);
    completed(await f.run(final.input), 'accepted');
    const beam = await h.legacy('110', 'P4A-BROWSER-FRACTION-SOURCE', 'BEAM');
    const fractionPlan = await f.prepare({ source: beam.unitId });
    const fraction = f.complete(fractionPlan.ops[0]!, beam.unitId, '70.5', '70.50');
    completed(await f.run(fraction.input), 'accepted');
    // Existing browser roles on a synthetic personal WH account enable real role
    // replacement tests; this is test data, not a product permission change.
    await db.owner.query(
      `INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope)
       SELECT installation_id,account_id,$1,'ACT-PROC','' FROM identity.account
       WHERE installation_id=$1 AND username='receipt.act-wh' ON CONFLICT DO NOTHING`,
      [installation],
    );
    const canonical = async (unitId: string) =>
      object((await responseData(await h.wh.call(inventoryRoutes.detail, { unitId }))).unit);
    const freeDetail = await canonical(free.unitId);
    const fractionalDetail = await canonical(fraction.outId);
    const snapshot = () =>
      h.stockSnapshot().then((value) => createHash('sha256').update(value).digest('hex'));
    const initialSnapshot = await snapshot();
    console.log(
      JSON.stringify({
        ready: true,
        origin: h.origin,
        foreignOrigin,
        refs: {
          free: { ...free, materialId: freeDetail.materialId, locationId: freeDetail.locationId },
          xss,
          big,
          i2: { origins: i2.origins, codes: i2.codes, orderId: i2.orderId },
          reserved,
          packed,
          shipped,
          issued: { unitId: issued.source },
          partial: { unitId: partial.source },
          wip: { unitId: wip.outId, lotId: (await canonical(wip.outId)).lotId },
          residual: { unitId: wip.residualId },
          consumed: { unitId: full.source },
          final: { unitId: final.outId },
          fraction: { unitId: fraction.outId, lotId: fractionalDetail.lotId },
        },
        initialSnapshot,
      }),
    );
    const commands = createInterface({ input: process.stdin });
    for await (const line of commands) {
      const input = JSON.parse(line) as { id: number; command: string };
      try {
        let result: unknown = true;
        if (input.command === 'snapshot') result = await snapshot();
        else if (input.command === 'foreign-responses') result = foreignResponses;
        else if (input.command === 'cursor-expire') cursorOffset += 601_000;
        else if (input.command === 'consume-wip') {
          completed(
            await f.run(productionCommand('StartProductionOperation', partial.ops[1]!)),
            'accepted',
          );
          const last = f.complete(partial.ops[1]!, wip.outId, '50', '50');
          completed(await f.run(last.input), 'accepted');
        } else if (input.command === 'ship-free') {
          const order = await f.order([free.unitId]);
          const claim = await f.claim(order.orderId, order.itemId, free.unitId);
          const shipment = await f.ready(order.orderId, [claim.target.id]);
          completed(await f.app.command(JSON.stringify(shipment.dispatch), f.ship), 'accepted');
        } else if (input.command === 'expire') {
          await db.owner.query(
            `UPDATE identity.session SET created_at=clock_timestamp()-interval '9 hours',
             expires_at=clock_timestamp()-interval '1 second'
             WHERE installation_id=$1 AND account_id IN
             (SELECT account_id FROM identity.account WHERE installation_id=$1 AND username='receipt.act-wh')`,
            [installation],
          );
        } else if (input.command === 'revoke') {
          await db.owner.query(
            `DELETE FROM identity.role_grant WHERE installation_id=$1 AND actor_role='ACT-WH'
             AND customer_scope='' AND account_id IN
             (SELECT account_id FROM identity.account WHERE installation_id=$1 AND username='receipt.act-wh')`,
            [installation],
          );
        } else if (input.command === 'restore') {
          await db.owner.query(
            `INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope)
             SELECT installation_id,account_id,$1,'ACT-WH','' FROM identity.account
             WHERE installation_id=$1 AND username='receipt.act-wh' ON CONFLICT DO NOTHING`,
            [installation],
          );
        } else if (input.command === 'stop') {
          console.log(JSON.stringify({ id: input.id, result: true }));
          break;
        } else assert.fail('Unknown browser fixture control');
        console.log(JSON.stringify({ id: input.id, result }));
      } catch {
        console.log(
          JSON.stringify({ id: input.id, error: 'Fixture control failed: ' + input.command }),
        );
      }
    }
  } finally {
    foreignServer.closeAllConnections();
    await Promise.all([h.stop(), new Promise<void>((done) => foreignServer.close(() => done()))]);
  }
});

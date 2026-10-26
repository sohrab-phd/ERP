import { createInterface } from 'node:readline';
import { withDatabase } from './database-fixture.js';
import { browserHarness } from './browser-harness.js';
import { seedBrowserScenarios } from './browser-scenarios.js';
import { installation } from './receipt-harness.js';
import { optionCommand } from './inbound-harness.js';

// Explicit test-only clock injected into the served module, never a product asset
// or a production hook. Real HTTP, Identity policy and PostgreSQL time stay real.
const controlledClock = `
const testRealNow = Date.now.bind(Date), testSetTimeout = window.setTimeout.bind(window), testClearTimeout = window.clearTimeout.bind(window);
let testOffset = 0;
const testTimers = new Map();
Date.now = () => testRealNow() + testOffset;
window.setTimeout = (callback, delay = 0, ...args) => {
  const id = testSetTimeout(() => { testTimers.delete(id); callback(...args); }, delay);
  testTimers.set(id, { due: Date.now() + delay, callback: () => callback(...args) });
  return id;
};
window.clearTimeout = (id) => { testTimers.delete(id); testClearTimeout(id); };
const testControls = document.createElement('aside');
testControls.setAttribute('aria-label', 'کنترل زمان آزمون');
const testState = document.createElement('output');
testState.id = 'test-session-state';
function testReport() {
  testState.textContent = JSON.stringify({ authenticated: !!self, pending: !!pending,
    recoveryKey: !!self?.browser.recoveryKey, ciphertext: !!sessionStorage.getItem('navard-p1-pending-v1'),
    orderCleared: !document.getElementById('order-result').textContent,
    receivingCleared: !document.getElementById('receiving-result').textContent,
    receivingEditorCleared: !document.getElementById('receiving-panel').textContent,
    arrivalCleared: !document.getElementById('arrival-result').textContent,
    referenceCleared: !document.getElementById('recovery-reference').textContent });
}
for (const [label, work] of [
  ['گذشت ۳۰ دقیقه با اجرای تایمر', () => {
    testOffset += 30 * 60 * 1000;
    for (const [id, timer] of [...testTimers]) if (timer.due <= Date.now()) {
      window.clearTimeout(id); timer.callback();
    }
  }],
  ['گذشت ۳۱ دقیقه بدون تایمر', () => { testOffset += 31 * 60 * 1000; }],
  ['بازنشانی ساعت آزمون', () => { testOffset = 0; }],
  ['گزارش وضعیت آزمون', () => {}],
]) {
  const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
  button.addEventListener('click', () => { work(); testReport(); }); testControls.append(button);
}
testControls.append(testState); document.body.append(testControls);
`;

// Explicit disposable-database safeguards run before setup; this is never a product entry point.
await withDatabase(async (db) => {
  const h = await browserHarness(db, 3110);
  try {
    if (process.argv.includes('--controlled-clock')) {
      h.app.server.prependListener('request', (request, response) => {
        if (request.url !== '/operator/app.js') return;
        const prefix = Buffer.from(controlledClock);
        const writeHead = response.writeHead.bind(response),
          end = response.end.bind(response);
        response.writeHead = (status, headers) => {
          const values = headers as Record<string, string | number>;
          return writeHead(status, {
            ...values,
            'content-length': Number(values['content-length']) + prefix.length,
          });
        };
        response.end = (chunk: unknown) =>
          end(Buffer.concat([prefix, Buffer.from(chunk as Uint8Array)]));
      });
    }
    await seedBrowserScenarios(h);
    console.log(
      'P1 browser fixture ready at ' +
        h.origin +
        '; lookup P1-READBACK; real PG18.6, 25 lines/24 scoped received units, sibling and unlinked cargo.',
    );
    const commands = createInterface({ input: process.stdin });
    for await (const command of commands) {
      if (command === 'stop') break;
      if (command === 'seed-catalogue-pages') {
        const actor = await h.app.identity.context(h.people.tokens.get('ACT-PROC')!, 'ACT-PROC');
        for (let i = 0; i < 101; i++) {
          const result = await h.app.command(
            JSON.stringify(optionCommand('COLOR', 'P1-PAGE-' + i)),
            actor,
          );
          if (result.status !== 'completed' || result.result.outcome !== 'accepted')
            throw new Error('Catalogue pagination fixture failed');
        }
      } else if (command === 'drop-next') h.loseNextOrderResponse();
      else if (command === 'drop-next-receiving') h.loseNextReceivingResponse();
      else if (command === 'unavailable-session') h.unavailableNextSession();
      else if (command === 'fence-commands') h.setCommandAdmission(false);
      else if (command === 'unfence-commands') h.setCommandAdmission(true);
      else if (command === 'hold-logout') h.holdNextLogout();
      else if (command === 'release-response') h.releaseResponse();
      else if (command === 'grant-wh-proc') {
        const proc = await h.app.identity.session(h.people.tokens.get('ACT-PROC')!);
        await h.app.identity.setGrant(h.people.tokens.get('ACT-SEC')!, {
          accountId: proc.accountId,
          actorRole: 'ACT-WH',
          enabled: true,
        });
      } else if (command === 'expire')
        await db.owner.query(
          "UPDATE identity.session SET created_at=clock_timestamp()-interval '9 hours',last_seen_at=clock_timestamp()-interval '1 minute',expires_at=clock_timestamp()-interval '1 hour'",
        );
      else if (command === 'revoke-proc')
        await db.owner.query(
          "DELETE FROM identity.role_grant WHERE installation_id=$1 AND actor_role='ACT-PROC'",
          [installation],
        );
      else if (command === 'restore-proc')
        await db.owner.query(
          "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) SELECT installation_id,account_id,$1,'ACT-PROC','' FROM identity.account WHERE installation_id=$1 AND username='receipt.act-proc' ON CONFLICT DO NOTHING",
          [installation],
        );
      else if (command === 'counts') {
        const rows = await db.owner.query<{ orders: number; lines: number; received: number }>(
          'SELECT (SELECT count(*)::int FROM procurement.operational_purchase_order) AS orders,(SELECT count(*)::int FROM procurement.operational_purchase_order_line) AS lines,(SELECT count(*)::int FROM procurement.inbound_received_unit) AS received',
        );
        console.log(JSON.stringify(rows.rows[0]));
      } else if (command === 'p2-stock') {
        const rows = await db.owner.query(
          `SELECT a.arrival_id,a.arrival_jy,a.arrival_jm,a.arrival_jd,a.origin_net_kg_text,a.destination_net_kg_text,
          u.received_unit_id,u.internal_system_code,u.product_number,u.actual,u.order_id,u.line_id,
          o.unit_id,o.lot_id,o.effect_id,o.accepted_unit_weight_kg_text,l.on_hand_delta::text AS stock_kg
          FROM procurement.inbound_arrival a
          JOIN procurement.inbound_received_unit u USING(installation_id,authority_scope,arrival_id)
          JOIN inventory.inbound_unit_origin o USING(installation_id,authority_scope,received_unit_id,arrival_id)
          JOIN inventory.ledger l ON l.installation_id=o.installation_id AND l.unit_id=o.unit_id AND l.effect_id=o.effect_id
          WHERE u.internal_system_code LIKE 'P2-BROWSER-%' ORDER BY u.internal_system_code`,
        );
        console.log(JSON.stringify(rows.rows));
      } else if (command === 'readback') {
        const rows = await db.owner.query<{ reference: string; lines: unknown }>(
          "SELECT order_reference AS reference, (SELECT jsonb_agg(jsonb_build_object('lineId',line_id,'position',position,'widthM',width_m_text,'thicknessMm',thickness_mm_text,'unitWeightKg',unit_weight_kg_text,'orderedUnitCount',ordered_unit_count_text,'lengthM',length_m_text,'itemNumber',item_number,'colorOptionId',color_option_id,'qualityGradeOptionId',quality_grade_option_id,'materialTypeOptionId',material_type_option_id,'ralColorNumber',ral_color_number) ORDER BY position) FROM procurement.operational_purchase_order_line l WHERE l.order_id=o.order_id) AS lines FROM procurement.operational_purchase_order o ORDER BY order_reference",
        );
        console.log(JSON.stringify(rows.rows));
      }
      console.log('Fixture control completed: ' + command);
    }
    commands.close();
  } finally {
    await h.app.stop();
  }
});

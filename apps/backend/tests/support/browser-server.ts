import { createInterface } from 'node:readline';
import { withDatabase } from './database-fixture.js';
import { browserHarness } from './browser-harness.js';
import { seedBrowserScenarios } from './browser-scenarios.js';
import { installation } from './receipt-harness.js';
import { optionCommand } from './inbound-harness.js';

// Explicit disposable-database safeguards run before setup; this is never a product entry point.
await withDatabase(async (db) => {
  const h = await browserHarness(db, 3110);
  try {
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

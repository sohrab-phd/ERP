// Reproducible, explicitly disposable Windows PG18.6 P4a measurement.
// Run after build: pinned node --env-file=.env.local tools/test/p4a-performance.mjs
// No product seeding, trigger bypass, credential output or acceptance substitution.
// P4A_PERF_COLD=1 requires exclusive access to the verified local test cluster.
// P4A_RETAIN_INDEXES optionally selects a comma-separated subset of the six approved keys.
// For a replay after migration, the fixture restores the exact installed definitions on exit.
// If the process is forcibly terminated, verify those exact definitions in the disposable DB
// and restore any missing indexes using the approved migration's CREATE INDEX statements.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { cpus, totalmem, platform, release } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { withDatabase } from '../../apps/backend/dist/tests/support/database-fixture.js';
import {
  inventoryDiscoveryHarness,
  inventoryRoutes,
  responseData,
  rows,
} from '../../apps/backend/dist/tests/support/inventory-discovery-harness.js';
import {
  completed,
  installation,
  receiptCommand,
} from '../../apps/backend/dist/tests/support/receipt-harness.js';
import { InventoryReadCursors } from '../../apps/backend/dist/src/modules/inventory/index.js';
import { PostgresInventoryDiscoveryStore } from '../../apps/backend/dist/src/infrastructure/postgresql/inventory-discovery-store.js';
import {
  PostgresTransactions,
  transactionClient,
} from '../../apps/backend/dist/src/infrastructure/postgresql/transaction.js';

assert.equal(process.versions.node, '24.21.0');
assert.equal(platform(), 'win32');
assert.equal(new URL(process.env.TEST_DATABASE_URL).host, '127.0.0.1:55438');
assert.equal(process.env.TEST_DATABASE_ACK, 'navard_i1_test');
const execute = promisify(execFile);
const warmReadsPerRound = 1000;
const warmWritesPerWriter = 100;
mkdirSync('artifacts/tests', { recursive: true });
const report = {
  status: 'RUNNING',
  methodology:
    'Actual cookie/CSRF HTTP reads; owner-command business examples plus declared legacy-heavy synthetic bulk fixture; constraints/triggers remain enabled. Cold is an explicit PG shared-buffer restart when enabled; OS filesystem cache is uncontrolled. Other first-observation values are not labelled cold-cache results.',
  hardware: {
    platform: platform(),
    release: release(),
    cpu: cpus()[0]?.model,
    logicalCpus: cpus().length,
    ramBytes: totalmem(),
  },
  runtime: {
    node: process.versions.node,
    composedPoolMax: 10,
    composedPoolAcquireTimeoutMs: 5000,
    inventoryAdmissionLimit: 16,
  },
  candidates: [],
};
const runId = new Date().toISOString().replace(/[^0-9]/g, '');
const save = () => {
  const json = JSON.stringify(report, null, 2);
  writeFileSync('artifacts/tests/p4a-performance.json', json);
  writeFileSync(`artifacts/tests/p4a-performance-${runId}.json`, json);
};
const percentile = (values, quantile) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)];
};
const stats = (samples) => ({
  count: samples.length,
  p50: percentile(samples, 0.5),
  p95: percentile(samples, 0.95),
  p99: percentile(samples, 0.99),
  max: Math.max(...samples),
});
async function finishWorkers(workers) {
  const results = await Promise.allSettled(workers);
  const failure = results.find((result) => result.status === 'rejected');
  if (failure) throw failure.reason;
}
const candidates = [
  ['p4a_unit_lot', 'inventory.unit', 'installation_id,authority_scope,lot_id,unit_id'],
  ['p4a_unit_state', 'inventory.unit', 'installation_id,authority_scope,state,unit_id'],
  ['p4a_unit_kind', 'inventory.unit', 'installation_id,authority_scope,kind,unit_id'],
  ['p4a_unit_location', 'inventory.unit', 'installation_id,authority_scope,location_id,unit_id'],
  [
    'p4a_legacy_code',
    'inventory.material_lot',
    'installation_id,authority_scope,(internal_code COLLATE "C"),unit_id',
  ],
  [
    'p4a_i2_code',
    'inventory.inbound_unit_origin',
    'installation_id,authority_scope,(internal_system_code COLLATE "C"),unit_id',
  ],
];
const uuid = (prefix, n) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;

await withDatabase(async (db) => {
  const h = await inventoryDiscoveryHarness(db);
  try {
    const f = h.fixture;
    const i2 = await h.i2();
    const reserved = await h.legacy();
    const reserveOrder = await f.order([reserved.unitId], { demandedKg: '5', partial: true });
    await f.claim(reserveOrder.orderId, reserveOrder.itemId, reserved.unitId, '5');
    const customerBStock = await h.legacy();
    const foreignSales = await f.app.identity.context(
      f.people.tokens.get('foreign'),
      'ACT-SALES',
      f.people.otherCustomerId,
    );
    const customerBOrder = await f.order([customerBStock.unitId], {
      demandedKg: '5',
      partial: true,
      actor: foreignSales,
      customerId: f.people.otherCustomerId,
    });
    await f.claim(
      customerBOrder.orderId,
      customerBOrder.itemId,
      customerBStock.unitId,
      '5',
      foreignSales,
    );
    const packed = await h.legacy();
    const packOrder = await f.order([packed.unitId]);
    const packClaim = await f.claim(packOrder.orderId, packOrder.itemId, packed.unitId);
    await f.ready(packOrder.orderId, [packClaim.target.id]);
    const shipped = await h.legacy();
    const shipOrder = await f.order([shipped.unitId]);
    const shipClaim = await f.claim(shipOrder.orderId, shipOrder.itemId, shipped.unitId);
    const ship = await f.ready(shipOrder.orderId, [shipClaim.target.id]);
    completed(await f.app.command(JSON.stringify(ship.dispatch), f.ship), 'accepted');
    await f.prepare();
    const partial = await f.prepare({ steps: 2 });
    const wip = f.complete(partial.ops[0], partial.source, '70', '50', {
      residual: '10',
      scrap: '10',
    });
    completed(await f.run(wip.input, f.manager), 'accepted');
    const full = await f.prepare();
    completed(await f.run(f.complete(full.ops[0], full.source).input), 'accepted');
    const hot = await h.legacy('100', 'P4A-SCALE-HOT');
    // Keep the hot Unit historical so a valid documented overflow does not
    // deliberately poison the default current-stock page used by load workers.
    const hotPlan = await f.prepare({ source: hot.unitId, kg: '100' });
    completed(await f.run(f.complete(hotPlan.ops[0], hot.unitId, '100', '100').input), 'accepted');
    const existing = Number(
      (await db.owner.query('SELECT count(*) AS n FROM inventory.unit')).rows[0].n,
    );
    const bulk = 100000 - existing;
    const seedBatchSize = 500;
    const foreignInstallation = randomUUID();
    const foreignAuthority = randomUUID();
    const client = await db.owner.connect();
    try {
      // Receipt code claims take transaction advisory locks. Bound each seed
      // transaction so the unmodified cluster lock table can service the fixture.
      for (let first = 1; first <= bulk; first += seedBatchSize) {
        await client.query('BEGIN');
        await client.query(
          `CREATE TEMP TABLE p4a_scale ON COMMIT DROP AS SELECT n,
        CASE WHEN n%10=0 THEN $2::uuid ELSE $1::uuid END AS inst,
        CASE WHEN n%10=0 THEN $2::uuid WHEN n%10=1 THEN $3::uuid ELSE $1::uuid END AS auth,
        ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS unit,
        ('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS lot,
        ('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS material,
        ('50000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS receipt,
        ('60000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS effect,
        ('70000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS ledger,
        ('80000000-0000-4000-8000-'||lpad((n%10)::text,12,'0'))::uuid AS location,
        (ARRAY['COIL','SHEET','ANGLE','BEAM','OTHER'])[1+n%5] AS kind,
        'P4A-SCALE-'||lpad(n::text,9,'0') AS code
        FROM generate_series($4::integer,$5::integer) AS n`,
          [
            installation,
            foreignInstallation,
            foreignAuthority,
            first,
            Math.min(first + seedBatchSize - 1, bulk),
          ],
        );
        await client.query(`INSERT INTO inventory.unit(installation_id,authority_scope,unit_id,lot_id,kind,location_id,customer_scope,state)
        SELECT inst,auth,unit,lot,kind,location,'','AVAILABLE' FROM p4a_scale`);
        await client.query(`INSERT INTO inventory.ledger(installation_id,authority_scope,ledger_id,unit_id,source_fact_id,effect_id,binding,on_hand_delta,reserved_delta,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key)
        SELECT inst,auth,ledger,unit,receipt,effect,'{}',100,0,'p4a-synthetic','benchmark','ACT-WH',gen_random_uuid(),'PostGoodsReceipt',1,gen_random_uuid() FROM p4a_scale`);
        await client.query(
          `INSERT INTO inventory.balance(installation_id,authority_scope,unit_id,on_hand,reserved) SELECT inst,auth,unit,100,0 FROM p4a_scale`,
        );
        await client.query(`INSERT INTO procurement.goods_receipt(installation_id,authority_scope,receipt_id,binding,state,internal_code,count,measured_kg,type,location_id,product_code,lot_id,unit_id,material_id,effect_id,issuer,subject,actor_role,request_id,idempotency_key)
        SELECT inst,auth,receipt,'{}','POSTED',code,1,100,kind,location,CASE WHEN kind='SHEET' THEN 'PRODUCT-'||code ELSE NULL END,lot,unit,material,effect,'p4a-synthetic','benchmark','ACT-WH',gen_random_uuid(),gen_random_uuid() FROM p4a_scale`);
        await client.query(`INSERT INTO inventory.material_lot(installation_id,authority_scope,lot_id,receipt_id,unit_id,material_id,effect_id,internal_code,count,measured_kg,type,location_id,product_code)
        SELECT inst,auth,lot,receipt,unit,material,effect,code,1,100,kind,location,CASE WHEN kind='SHEET' THEN 'PRODUCT-'||code ELSE NULL END FROM p4a_scale`);
        await client.query(`INSERT INTO inventory.ledger(installation_id,authority_scope,ledger_id,unit_id,source_fact_id,effect_id,binding,on_hand_delta,reserved_delta,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key)
        SELECT inst,auth,gen_random_uuid(),unit,gen_random_uuid(),gen_random_uuid(),'{}',0,CASE WHEN seq%2=1 THEN 1 ELSE -1 END,'p4a-synthetic','benchmark','ACT-WH',gen_random_uuid(),'SyntheticReservationHistory',1,gen_random_uuid()
        FROM p4a_scale CROSS JOIN LATERAL generate_series(1,CASE WHEN n%101=0 THEN 98 WHEN n%23=0 THEN 10 WHEN n%7=0 THEN 2 ELSE 0 END) AS seq`);
        await client.query('COMMIT');
      }
      await client.query(
        `INSERT INTO inventory.ledger(installation_id,authority_scope,ledger_id,unit_id,source_fact_id,effect_id,binding,on_hand_delta,reserved_delta,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key)
        SELECT $1,$1,gen_random_uuid(),$2,gen_random_uuid(),gen_random_uuid(),'{}',0,CASE WHEN n%2=1 THEN 1 ELSE -1 END,'p4a-synthetic','benchmark','ACT-WH',gen_random_uuid(),'SyntheticReservationHistory',1,gen_random_uuid() FROM generate_series(1,10000) AS n`,
        [installation, hot.unitId],
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    for (const table of [
      'inventory.unit',
      'inventory.material_lot',
      'inventory.inbound_unit_origin',
      'inventory.production_origin',
      'inventory.ledger',
      'inventory.balance',
      'inventory.reservation',
      'inventory.production_issue',
    ])
      await db.owner.query('ANALYZE ' + table);
    report.dataset = (
      await db.owner.query(
        `SELECT (SELECT count(*) FROM inventory.unit) AS units,(SELECT count(*) FROM inventory.ledger) AS ledger,
      (SELECT count(*) FROM inventory.material_lot) AS legacy,(SELECT count(*) FROM inventory.inbound_unit_origin) AS i2,(SELECT count(*) FROM inventory.production_origin) AS production,
      (SELECT count(*) FROM inventory.unit WHERE installation_id<>$1 OR authority_scope<>$1) AS scopeDistractors`,
        [installation],
      )
    ).rows[0];
    assert.equal(report.dataset.units, '100000');
    report.dataset.seedBatchSize = seedBatchSize;
    report.distribution = (
      await db.owner.query(
        'SELECT state,count(*) AS n FROM inventory.unit GROUP BY state ORDER BY state',
      )
    ).rows;
    assert.deepEqual(
      report.distribution.map((row) => row.state),
      [
        'AVAILABLE',
        'CONSUMED',
        'ISSUED_TO_PRODUCTION',
        'PACKED',
        'PARTIALLY_CONSUMED',
        'RESERVED',
        'SHIPPED',
      ],
    );
    report.visibleLedgerHistories = (
      await db.owner.query(
        `SELECT entries,count(*) AS units FROM (
      SELECT unit_id,count(*) AS entries FROM inventory.ledger
      WHERE installation_id=$1 AND authority_scope=$1 GROUP BY unit_id
    ) histories GROUP BY entries ORDER BY entries`,
        [installation],
      )
    ).rows;
    report.reservationCustomerScopes = (
      await db.owner.query(
        `SELECT count(DISTINCT customer_id) AS n
      FROM inventory.reservation_request WHERE installation_id=$1 AND authority_scope=$1`,
        [installation],
      )
    ).rows[0].n;
    assert.equal(report.reservationCustomerScopes, '2');
    report.version = (await db.owner.query('SELECT version() AS version')).rows[0].version;
    report.existingIndexes = (
      await db.owner.query(
        "SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='inventory' ORDER BY indexname",
      )
    ).rows;
    save();

    const mainId = uuid('20000000', 2),
      mainLot = uuid('30000000', 2);
    const mainMaterial = uuid('40000000', 2),
      location = uuid('80000000', 2);
    // All measurements use genuine sessions on distinct personal accounts. This
    // avoids benchmarking artificial same-account Identity lock contention as
    // Inventory contention while still exercising ordinary authentication.
    const people = [];
    for (let n = 0; n < 12; n++) {
      const accountId = randomUUID(),
        personId = randomUUID(),
        username = `p4a.perf.${n}`;
      await db.owner.query(
        `INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash)
        SELECT $1,$2,$3,$4,password_hash FROM identity.account WHERE installation_id=$1 AND username='receipt.act-wh'`,
        [installation, accountId, personId, username],
      );
      await db.owner.query(
        `INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope)
        VALUES($1,$2,$1,'ACT-WH','')`,
        [installation, accountId],
      );
      const browser = h.client('ACT-WH', username);
      await browser.login();
      const token = browser.cookie.slice(browser.cookie.indexOf('=') + 1);
      const actor = await h.app.identity.context(token, 'ACT-WH');
      people.push({ browser, token, actor, accountId, personId });
    }
    const readers = people.slice(0, 10),
      writers = people.slice(10);
    const pendingTiming = new Map();
    let timingSequence = 0;
    const measureServer = (request, response) => {
      const measurement = pendingTiming.get(request.headers['x-p4a-measurement']);
      if (!measurement) return;
      measurement.serverStart = performance.now();
      response.once('finish', () => {
        measurement.serverEnd = performance.now();
      });
    };
    h.app.server.prependListener('request', measureServer);
    const timedRequest = async (run) => {
      const id = String(++timingSequence);
      const timing = { clientStart: performance.now() };
      pendingTiming.set(id, timing);
      try {
        const data = await run({ 'x-p4a-measurement': id });
        timing.clientEnd = performance.now();
        assert.ok(
          timing.serverEnd >= timing.serverStart,
          'Missing composed-server request or finish event',
        );
        return {
          data,
          timing: {
            ...timing,
            serverMs: timing.serverEnd - timing.serverStart,
            clientMs: timing.clientEnd - timing.clientStart,
          },
        };
      } finally {
        pendingTiming.delete(id);
      }
    };
    const legacyUnitIds = [2, 3, 4, 5, 6, 7, 8, 9, 12, 13].map((n) => uuid('20000000', n));
    const legacyRead = async (person, worker, headers = {}) => {
      const response = await fetch(h.origin + '/inventory/units/' + legacyUnitIds[worker], {
        headers: { ...headers, authorization: 'Bearer ' + person.token, 'x-erp-role': 'ACT-WH' },
      });
      assert.equal(response.status, 200);
      await response.json();
    };
    const readPids = new Map(),
      writerPids = new Map();
    const writerOperation = new AsyncLocalStorage();
    const original = PostgresInventoryDiscoveryStore.prototype.candidates;
    const originalBegin = PostgresTransactions.prototype.begin;
    let lastQuery;
    PostgresTransactions.prototype.begin = async function (mode, ...args) {
      const tx = await originalBegin.call(this, mode, ...args);
      const active =
        mode === 'read-snapshot' ? readPids : writerOperation.getStore() ? writerPids : undefined;
      if (active) {
        const client = transactionClient(tx.context),
          release = client.release,
          pid = client.processID;
        active.set(pid, tx.context);
        client.release = function (...releaseArgs) {
          active.delete(pid);
          client.release = release;
          return release.apply(this, releaseArgs);
        };
      }
      return tx;
    };
    PostgresInventoryDiscoveryStore.prototype.candidates = async function (context, selection) {
      const c = transactionClient(context.transaction),
        query = c.query;
      c.query = function (text, ...args) {
        if (typeof text === 'string' && /FROM inventory\.unit u/.test(text))
          lastQuery = { text, values: args[0] };
        return query.call(this, text, ...args);
      };
      try {
        return await original.call(this, context, selection);
      } finally {
        c.query = query;
      }
    };
    const write = async (person) => {
      const input = receiptCommand({
        payload: {
          internalCode: 'P4A-PERF-WRITE-' + randomUUID(),
          count: '1',
          measuredKg: '11',
          type: 'COIL',
          locationId: randomUUID(),
        },
      });
      completed(
        await writerOperation.run(true, () => h.app.command(JSON.stringify(input), person.actor)),
        'accepted',
      );
    };
    const explain = async () => {
      assert.ok(lastQuery, 'Expected the executed Inventory candidate SQL');
      return (
        await db.owner.query(
          'EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) ' + lastQuery.text,
          lastQuery.values,
        )
      ).rows[0]['QUERY PLAN'][0];
    };
    const queryCases = [
      ['default', {}],
      ['unit', { unitId: mainId }],
      ['lot', { lotId: mainLot }],
      ['material', { materialId: mainMaterial }],
      ['code', { internalCode: 'P4A-SCALE-000000002' }],
      ['i2-code', { internalCode: i2.codes[0] }],
      ['negative-code', { internalCode: 'P4A-SCALE-NOT-PRESENT' }],
      ['kind', { kind: 'ANGLE' }],
      ['negative-kind', { kind: 'NOT A RECORDED KIND' }],
      ['location', { locationId: location }],
      ['negative-location', { locationId: randomUUID() }],
      ['state', { state: 'RESERVED' }],
      ['origin-i2', { origin: 'I2_RECEIVING' }],
      ['origin-production', { origin: 'PRODUCTION' }],
      [
        'and',
        { kind: 'ANGLE', locationId: location, state: 'AVAILABLE', origin: 'LEGACY_RECEIPT' },
      ],
      ['negative-and', { kind: 'BEAM', locationId: location, state: 'RESERVED' }],
    ];
    const lateAnchor = uuid('20000000', bulk - 100 + ((bulk - 100) % 10 < 2 ? 2 : 0));
    const filteredAnchor = uuid('20000000', bulk - 100 - ((bulk - 100) % 10) + 2);
    const lateCases = new Map([
      ['late-cursor', { anchor: lateAnchor, filters: {} }],
      [
        'late-kind-location',
        { anchor: filteredAnchor, filters: { kind: 'ANGLE', locationId: location } },
      ],
    ]);
    for (const { anchor, filters } of lateCases.values()) {
      const disclosed = await responseData(
        await h.wh.call(inventoryRoutes.detail, { unitId: anchor }),
      );
      assert.equal(disclosed.unit.unitId, anchor);
      for (const [key, value] of Object.entries(filters)) assert.equal(disclosed.unit[key], value);
    }
    const token = h.wh.cookie.slice(h.wh.cookie.indexOf('=') + 1);
    const actor = await h.app.identity.context(token, 'ACT-WH');
    const cursors = new InventoryReadCursors(h.secret, h.origin);
    const lateInput = ({ anchor, filters }) => {
      const input = { filters, limit: 25 };
      const position = cursors.position('DiscoverInventoryUnits', input, actor, {
        accountId: h.wh.self.accountId,
        personId: h.wh.self.personId,
        sessionDigest: createHash('sha256').update(token).digest('hex'),
      });
      return { ...input, cursor: cursors.next(position, anchor) };
    };
    report.lateCursor = {
      anchorDisclosedViaRealDetail: true,
      issuance:
        'Production cursor class signs the disclosed near-tail anchor for the real session in each index phase.',
    };
    const measureCases = async () => {
      const result = [];
      const filterCases = [
        ...queryCases,
        ...Array.from(lateCases, ([name, entry]) => [name, entry.filters]),
      ];
      for (const [name, filters] of filterCases) {
        const samples = [];
        let plan;
        const lateCase = lateCases.get(name);
        for (let i = 0; i < 4; i++) {
          const input = lateCase ? lateInput(lateCase) : { filters, limit: 25 };
          if (i === 0) lastQuery = undefined;
          const { data, timing } = await timedRequest(async (headers) =>
            responseData(await h.wh.call(inventoryRoutes.list, input, headers)),
          );
          if (lateCase) {
            assert.ok(rows(data).length > 0);
            assert.ok(rows(data).every((row) => row.unitId > lateCase.anchor));
          }
          samples.push(timing);
          if (i === 0) plan = await explain();
        }
        result.push({
          name,
          filters,
          firstObservation: samples[0],
          warm: samples.slice(1),
          plan,
        });
      }
      return result;
    };
    const measureWrites = async () => {
      const samples = [];
      const warmup = [];
      await finishWorkers(
        writers.map(async (person) => {
          for (let i = 0; i < 25; i++) {
            const start = performance.now();
            await write(person);
            const elapsed = performance.now() - start;
            (i < 5 ? warmup : samples).push(elapsed);
          }
        }),
      );
      return { ...stats(samples), samplesMs: samples, warmupMs: warmup };
    };
    const bracketWriter = (before, after, measured) => {
      const baseline = stats([...before.samplesMs, ...after.samplesMs]);
      return { before, after, baseline, p95Ratio: measured.p95 / baseline.p95 };
    };
    const coldSharedBuffers = async () => {
      if (process.env.P4A_PERF_COLD !== '1')
        return {
          executed: false,
          reason: 'Explicit disposable-cluster cold restart was not enabled.',
        };
      const ownerRole = (await db.owner.query('SELECT current_user AS role')).rows[0].role;
      const sessions = (
        await db.owner
          .query(`SELECT datname,usename,application_name,state,xact_start IS NOT NULL AS transaction
        FROM pg_stat_activity WHERE backend_type='client backend' AND pid<>pg_backend_pid()`)
      ).rows;
      assert.ok(
        sessions.every(
          (s) =>
            s.datname === process.env.TEST_DATABASE_ACK &&
            [db.runtimeRole, ownerRole].includes(s.usename) &&
            ['', 'navard-envelope'].includes(s.application_name) &&
            s.state === 'idle' &&
            !s.transaction,
        ),
        'Cold restart refused: another database/session/transaction is active or unknown',
      );
      const before = (await db.owner.query('SELECT pg_postmaster_start_time() AS started')).rows[0]
        .started;
      const ctl = resolve('artifacts/tests/i1-environment/postgres/pgsql/bin/pg_ctl.exe');
      const version = await execute(ctl, ['--version'], { timeout: 10000 });
      assert.match(version.stdout, /PostgreSQL\) 18\.6/u);
      await execute(
        ctl,
        [
          'restart',
          '-m',
          'fast',
          '-D',
          resolve('artifacts/tests/i1-environment/pgdata'),
          '-l',
          resolve('artifacts/tests/p4a-performance-postgres.log'),
          '-o',
          '-h 127.0.0.1 -p 55438',
          '-w',
        ],
        { timeout: 30000, windowsHide: true },
      );
      const defaultPage = async (headers) =>
        responseData(await h.wh.call(inventoryRoutes.list, { filters: {}, limit: 25 }, headers));
      const { timing: firstDefaultRequest } = await timedRequest(defaultPage);
      const warmRequests = [];
      for (let i = 0; i < 4; i++) {
        warmRequests.push((await timedRequest(defaultPage)).timing);
      }
      const after = (
        await db.owner.query(`SELECT pg_postmaster_start_time() AS started,
        current_setting('server_version_num') AS version,inet_server_port() AS port`)
      ).rows[0];
      assert.equal(after.version, '180006');
      assert.equal(after.port, 55438);
      assert.ok(after.started.getTime() > before.getTime());
      return {
        executed: true,
        level: 'PostgreSQL shared buffers cold; OS filesystem cache uncontrolled',
        idleOwnedSessionsBeforeRestart: sessions.length,
        firstDefaultRequest,
        warmServer: stats(warmRequests.map((sample) => sample.serverMs)),
        warmClient: stats(warmRequests.map((sample) => sample.clientMs)),
        postmasterRestartVerified: true,
        noUnknownActiveSession: true,
      };
    };
    const ephemeral = new Set();
    const originalIndexes = [];
    const normalizeIndex = (definition) =>
      definition.replace(/\s/gu, '').replace(/\((internal(?:_system)?_codeCOLLATE"C")\)/gu, '$1');
    for (const [name, table, key] of candidates) {
      const installed = report.existingIndexes.find((entry) => entry.indexname === name);
      if (!installed) continue;
      const expected = `CREATE INDEX ${name} ON ${table} USING btree (${key})`;
      assert.equal(
        normalizeIndex(installed.indexdef),
        normalizeIndex(expected),
        'Existing candidate index differs from approved definition',
      );
      originalIndexes.push({ name, definition: installed.indexdef });
    }
    const removed = [];
    try {
      for (const index of originalIndexes) {
        await db.owner.query(`DROP INDEX inventory.${index.name}`);
        removed.push(index);
      }
      report.baselineTemporarilyRemoved = removed.map((index) => index.name);
      for (const person of writers) await write(person);
      report.coldBeforeIndexes = await coldSharedBuffers();
      save();
      report.beforeIndexes = await measureCases();
      report.writerOverheadMethodology =
        'Each isolated index comparison has before and after no-index controls on the same two personal owner-command writers and application pool. Each of the three phases records five warm-up writes per worker and then 20 measured writes per worker. The comparator is the pooled before and after writer p95.';
      let previousControl = await measureWrites();
      for (const [name, table, key] of candidates) {
        await db.owner.query(`CREATE INDEX ${name} ON ${table}(${key})`);
        ephemeral.add(name);
        const measurements = await measureCases();
        const writer = await measureWrites();
        await db.owner.query(`DROP INDEX inventory.${name}`);
        ephemeral.delete(name);
        const control = await measureWrites();
        report.candidates.push({
          name,
          table,
          key,
          measurements,
          writer,
          writerOverhead: bracketWriter(previousControl, control, writer),
        });
        previousControl = control;
        save();
      }
      // Recommendation is reviewed separately before the one production migration.
      // This environment variable may name only the six evaluated candidate keys.
      const retained =
        process.env.P4A_RETAIN_INDEXES === undefined
          ? originalIndexes.map((index) => index.name)
          : process.env.P4A_RETAIN_INDEXES.split(',').filter(Boolean);
      for (const name of retained) {
        const index = candidates.find((c) => c[0] === name);
        assert.ok(index, 'Unapproved index candidate');
        await db.owner.query(`CREATE INDEX ${index[0]} ON ${index[1]}(${index[2]})`);
        ephemeral.add(name);
      }
      report.retained = retained;
      report.coldAfterIndexes = await coldSharedBuffers();
      save();
      report.afterIndexes = await measureCases();
      report.retainedWriter = await measureWrites();
      const hotReply = await h.wh.call(inventoryRoutes.detail, { unitId: hot.unitId });
      assert.equal(hotReply.status, 422);
      assert.deepEqual(await hotReply.json(), { error: 'query-limit' });
      report.hotHistory = {
        unitRows: (
          await db.owner.query(
            'SELECT count(*) AS n FROM inventory.ledger WHERE installation_id=$1 AND authority_scope=$1 AND unit_id=$2',
            [installation, hot.unitId],
          )
        ).rows[0].n,
        status: 422,
        partialRows: false,
      };

      // Warm both ordinary accepted legacy reads and P4a before paired load.
      for (const [worker, person] of readers.entries()) {
        await responseData(
          await person.browser.call(inventoryRoutes.list, {
            filters: { kind: 'ANGLE' },
            limit: 25,
          }),
        );
        await legacyRead(person, worker);
      }
      const allReadSamples = [],
        allWriterSamples = [],
        rounds = [];
      async function load(control) {
        const readSamples = [],
          writerSamples = [],
          lockObservations = [];
        let done = false;
        let cutoff;
        const writeCounts = [0, 0];
        const windowStart = performance.now();
        const workerLoop = async (operation) => {
          try {
            while (cutoff === undefined) {
              assert.ok(
                performance.now() - windowStart < 120000,
                'Shared load window exceeded two minutes',
              );
              await operation();
              if (
                readSamples.length >= warmReadsPerRound &&
                writeCounts.every((count) => count >= warmWritesPerWriter)
              )
                cutoff ??= performance.now();
            }
          } catch (error) {
            cutoff ??= performance.now();
            throw error;
          }
        };
        const observe = async () => {
          while (!done) {
            const rp = new Map(readPids),
              wp = new Map(writerPids);
            const held = (
              await db.owner.query(
                `SELECT pid,locktype,mode FROM pg_locks
              WHERE pid=ANY($1::integer[]) AND granted AND
              (locktype='advisory' OR (relation IN ('inventory.unit'::regclass,'inventory.ledger'::regclass,'inventory.balance'::regclass,'inventory.reservation'::regclass,'inventory.production_issue'::regclass)
              AND mode<>'AccessShareLock'))`,
                [[...rp.keys()]],
              )
            ).rows;
            const blocked = (
              await db.owner.query(
                'SELECT pid,pg_blocking_pids(pid) AS blockers FROM pg_stat_activity WHERE pid=ANY($1::integer[])',
                [[...wp.keys()]],
              )
            ).rows;
            lockObservations.push({
              activeReaders: [...rp].filter(([pid, context]) => readPids.get(pid) === context)
                .length,
              activeWriters: [...wp].filter(([pid, context]) => writerPids.get(pid) === context)
                .length,
              readWriterLocks: held.filter((row) => readPids.get(row.pid) === rp.get(row.pid))
                .length,
              writerBlockedByRead: blocked.filter(
                (row) =>
                  writerPids.get(row.pid) === wp.get(row.pid) &&
                  row.blockers.some((pid) => rp.has(pid) && readPids.get(pid) === rp.get(pid)),
              ).length,
            });
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        };
        let observerFailure;
        const observation = observe().catch((error) => {
          observerFailure = error;
        });
        try {
          await finishWorkers([
            ...writers.map((person, worker) =>
              workerLoop(async () => {
                const start = performance.now();
                await write(person);
                const end = performance.now();
                writeCounts[worker]++;
                writerSamples.push({ worker, start, end, ms: end - start });
              }),
            ),
            ...readers.map((person, worker) => {
              let sequence = worker;
              return workerLoop(async () => {
                const [name, filters] = queryCases[sequence++ % queryCases.length];
                const { timing } = await timedRequest(async (headers) => {
                  if (control) return legacyRead(person, worker, headers);
                  return responseData(
                    await person.browser.call(
                      inventoryRoutes.list,
                      { filters, limit: 25 },
                      headers,
                    ),
                  );
                });
                readSamples.push({ worker, name: control ? 'legacy-unit' : name, ...timing });
              });
            }),
          ]);
        } finally {
          done = true;
          await observation;
        }
        if (observerFailure) throw observerFailure;
        const overlap = (start, end, otherStart, otherEnd) =>
          Math.max(0, Math.min(end, otherEnd) - Math.max(start, otherStart));
        for (const sample of readSamples) {
          sample.inWindow = sample.serverStart >= windowStart && sample.serverEnd <= cutoff;
          sample.writerOverlapMs = writers.map((_, worker) =>
            writerSamples
              .filter((write) => write.worker === worker)
              .reduce(
                (total, write) =>
                  total + overlap(sample.serverStart, sample.serverEnd, write.start, write.end),
                0,
              ),
          );
        }
        for (const sample of writerSamples) {
          sample.inWindow = sample.start >= windowStart && sample.end <= cutoff;
          sample.readWorkersOverlapping = new Set(
            readSamples
              .filter(
                (read) => overlap(sample.start, sample.end, read.clientStart, read.clientEnd) > 0,
              )
              .map((read) => read.worker),
          ).size;
        }
        const measuredReads = readSamples.filter((s) => s.inWindow);
        const measuredWrites = writerSamples.filter((s) => s.inWindow);
        assert.ok(measuredReads.length >= warmReadsPerRound);
        assert.ok(
          writers.every(
            (_, worker) =>
              measuredWrites.filter((s) => s.worker === worker).length >= warmWritesPerWriter,
          ),
        );
        const round = rounds.length + 1;
        allReadSamples.push(...readSamples.map((s) => ({ ...s, control, round })));
        allWriterSamples.push(...writerSamples.map((s) => ({ ...s, control, round })));
        const result = {
          control,
          windowStart,
          windowEnd: cutoff,
          reads: stats(measuredReads.map((s) => s.serverMs)),
          clientReads: stats(measuredReads.map((s) => s.clientMs)),
          writes: stats(measuredWrites.map((s) => s.ms)),
          readsWithBothWritersOverlapping: measuredReads.filter((s) =>
            s.writerOverlapMs.every((ms) => ms > 0),
          ).length,
          writesOverlappingAllReaders: measuredWrites.filter(
            (s) => s.readWorkersOverlapping === readers.length,
          ).length,
          tailReads: readSamples.length - measuredReads.length,
          tailWrites: writerSamples.length - measuredWrites.length,
          lockSamples: lockObservations.length,
          lockSamplesWithActiveReaders: lockObservations.filter((s) => s.activeReaders > 0).length,
          lockSamplesWithActiveWriters: lockObservations.filter((s) => s.activeWriters > 0).length,
          lockSamplesWithBoth: lockObservations.filter(
            (s) => s.activeReaders > 0 && s.activeWriters > 0,
          ).length,
          readWriterLockObservations: lockObservations.reduce((n, s) => n + s.readWriterLocks, 0),
          writerBlockedByReadObservations: lockObservations.reduce(
            (n, s) => n + s.writerBlockedByRead,
            0,
          ),
        };
        rounds.push(result);
        return result;
      }
      // ABBA counters simple run-order drift. Every sample is retained; no best-run selection.
      await load(true);
      await load(false);
      await load(false);
      await load(true);
      const measuredReads = allReadSamples.filter((r) => !r.control && r.inWindow);
      const baselineWrites = allWriterSamples
        .filter((r) => r.control && r.inWindow)
        .map((r) => r.ms);
      const mixedWrites = allWriterSamples.filter((r) => !r.control && r.inWindow).map((r) => r.ms);
      report.concurrent = {
        readers: 10,
        writers: 2,
        requests: measuredReads.length,
        reads: stats(measuredReads.map((r) => r.serverMs)),
        clientReads: stats(measuredReads.map((r) => r.clientMs)),
        baselineWriter: stats(baselineWrites),
        mixedWriter: stats(mixedWrites),
        writerP95Ratio: percentile(mixedWrites, 0.95) / percentile(baselineWrites, 0.95),
        rounds,
        baseline: `ABBA: ten accepted legacy keyed Unit readers on distinct stable Units versus ten P4a query readers, with the same two personal owner-command receipt writers and one composed application pool. Every worker runs unpaced until the shared window records ${warmReadsPerRound} completed reads and ${warmWritesPerWriter} writes per writer. Raw timestamps, overlap, and tail samples are retained. Targets use completed in-window samples. Returned read work differs because legacy reads one Unit and P4a can page.`,
        readSamples: allReadSamples,
        writerSamples: allWriterSamples,
      };
      report.targets = {
        readP95: report.concurrent.reads.p95 <= 1000,
        readP99: report.concurrent.reads.p99 <= 2000,
        deadline: allReadSamples
          .filter((sample) => !sample.control)
          .every((sample) => sample.serverMs <= 8000),
        writerP95: report.concurrent.writerP95Ratio <= 1.1,
        noReadWriterLocks: rounds
          .filter((r) => !r.control)
          .every((r) => r.readWriterLockObservations === 0),
        noWriterBlockedByReads: rounds
          .filter((r) => !r.control)
          .every((r) => r.writerBlockedByReadObservations === 0),
        coldSharedBuffers: report.coldBeforeIndexes.executed && report.coldAfterIndexes.executed,
      };
      for (const name of retained) {
        await db.owner.query(`DROP INDEX inventory.${name}`);
        ephemeral.delete(name);
      }
      const finalControl = await measureWrites();
      report.retainedWriterOverhead = bracketWriter(
        previousControl,
        finalControl,
        report.retainedWriter,
      );
      report.finalUnits = (
        await db.owner.query('SELECT count(*) AS n FROM inventory.unit')
      ).rows[0].n;
      report.status = Object.values(report.targets).every(Boolean)
        ? 'MEASURED_TARGETS_PASS'
        : 'MEASURED_TARGETS_FAIL';
      save();
      console.log(
        JSON.stringify({
          status: report.status,
          dataset: report.dataset,
          reads: report.concurrent.reads,
          writerP95Ratio: report.concurrent.writerP95Ratio,
          targets: report.targets,
        }),
      );
      if (report.status !== 'MEASURED_TARGETS_PASS') process.exitCode = 1;
    } finally {
      h.app.server.off('request', measureServer);
      PostgresInventoryDiscoveryStore.prototype.candidates = original;
      PostgresTransactions.prototype.begin = originalBegin;
      try {
        for (const name of ephemeral)
          await db.owner.query(`DROP INDEX IF EXISTS inventory.${name}`);
      } finally {
        for (const index of removed) await db.owner.query(index.definition);
      }
      report.restoredIndexes = removed.map((index) => index.name);
      save();
    }
  } catch (error) {
    report.status = 'FAILED';
    report.failure = { name: error.name, message: error.message };
    save();
    throw error;
  } finally {
    await h.stop();
  }
});

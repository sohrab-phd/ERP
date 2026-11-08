// Windows-only, explicitly disposable P4b measurements; never a performance PASS.
// Build first. With the exclusive verified test DB window:
// $env:P4B_PERF_RUN='1'; pinned node --env-file=.env.local tools/test/p4b-performance.mjs
// Optional P4B_PERF_TIER=small|representative|stress; defaults to all three.
// P4B_PERF_PROFILE=internal20|internal20-history selects bounded paced measurements.
// Only internal20 accepts P4B_PERF_ORDER=normal-peak|peak-normal (default normal-peak).
// No index DDL, accepted migration changes, cluster restart or production data.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { cpus, totalmem, platform, release } from 'node:os';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { Pool } from 'pg';
import { validateTestDatabase } from '../db/reset-test.mjs';
import { withDatabase } from '../../apps/backend/dist/tests/support/database-fixture.js';
import { inventoryDiscoveryHarness } from '../../apps/backend/dist/tests/support/inventory-discovery-harness.js';
import {
  completed,
  installation,
  receiptCommand,
} from '../../apps/backend/dist/tests/support/receipt-harness.js';
import { salesCommand, follow } from '../../apps/backend/dist/tests/support/sales-harness.js';
import { PostgresSalesStore } from '../../apps/backend/dist/src/infrastructure/postgresql/sales-store.js';
import { PostgresInventoryDiscoveryStore } from '../../apps/backend/dist/src/infrastructure/postgresql/inventory-discovery-store.js';
import {
  PostgresTransactions,
  transactionClient,
} from '../../apps/backend/dist/src/infrastructure/postgresql/transaction.js';

assert.equal(
  process.env.P4B_PERF_RUN,
  '1',
  'Explicit exclusive disposable measurement window required',
);
assert.equal(platform(), 'win32');
assert.equal(process.versions.node, '24.21.0');
assert.equal(new URL(process.env.TEST_DATABASE_URL).host, '127.0.0.1:55438');
assert.equal(process.env.TEST_DATABASE_ACK, 'navard_i1_test');
await validateTestDatabase();
const sampleCount = Number(process.env.P4B_PERF_SAMPLES ?? 200);
assert.ok(Number.isSafeInteger(sampleCount) && sampleCount >= 200 && sampleCount <= 1000);
const profile = process.env.P4B_PERF_PROFILE ?? 'legacy';
assert.ok(['legacy', 'internal20', 'internal20-history'].includes(profile), 'Unknown profile');
assert.ok(profile === 'legacy' || !process.env.P4B_PERF_TIER, 'Profile defines its own dataset');
const internal20 = profile !== 'legacy';
const measurementOrder = process.env.P4B_PERF_ORDER ?? 'normal-peak';
assert.ok(['normal-peak', 'peak-normal'].includes(measurementOrder), 'Unknown phase order');
assert.ok(
  !process.env.P4B_PERF_ORDER || profile === 'internal20',
  'Phase order requires internal20',
);
const writerPeriodMs = 1000;
const tierDefinitions = [
  {
    name: 'small',
    customers: 8,
    grants: 4,
    orders: 200,
    assessmentsPerSelectedOrder: 2,
    units: 200,
  },
  {
    name: 'representative',
    customers: 64,
    grants: 32,
    orders: 10000,
    assessmentsPerSelectedOrder: 3,
    units: 10000,
  },
  {
    name: 'stress',
    customers: 256,
    grants: 128,
    orders: 50000,
    assessmentsPerSelectedOrder: 5,
    units: 25000,
  },
];
const tiers = internal20
  ? [
      {
        name: profile,
        customers: profile === 'internal20-history' ? 256 : 64,
        grants: 32,
        orders: profile === 'internal20-history' ? 50000 : 10000,
        assessmentsPerSelectedOrder: profile === 'internal20-history' ? 5 : 3,
        units: 200,
      },
    ]
  : process.env.P4B_PERF_TIER
    ? tierDefinitions.filter((t) => t.name === process.env.P4B_PERF_TIER)
    : tierDefinitions;
assert.ok(tiers.length > 0, 'Unknown tier');
const output = 'artifacts/tests/p4b-implementation';
mkdirSync(output, { recursive: true });
const runId = new Date().toISOString().replace(/[^0-9]/gu, '');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const files = [
  ...new Set([
    ...git(
      'ls-files',
      '--',
      'apps/backend/src',
      'apps/backend/tests/support',
      'packages/shared-kernel/src',
      'tools/test/p4b-performance.mjs',
    ).split(/\r?\n/u),
    ...git(
      'ls-files',
      '--others',
      '--exclude-standard',
      '--',
      'apps/backend/src',
      'apps/backend/tests/support',
      'packages/shared-kernel/src',
      'tools/test/p4b-performance.mjs',
    ).split(/\r?\n/u),
  ]),
]
  .filter(Boolean)
  .sort();
const manifest = Object.fromEntries(
  files.map((path) => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]),
);
const report = {
  status: 'RUNNING_NOT_ACCEPTED',
  startUtc: new Date().toISOString(),
  command: {
    shell: 'PowerShell',
    executable: process.execPath,
    arguments: [...process.execArgv, ...process.argv.slice(1)],
    environment: {
      P4B_PERF_RUN: process.env.P4B_PERF_RUN,
      P4B_PERF_TIER: process.env.P4B_PERF_TIER ?? 'all',
      P4B_PERF_SAMPLES: sampleCount,
      P4B_PERF_PROFILE: profile,
      ...(profile === 'internal20' ? { P4B_PERF_ORDER: measurementOrder } : {}),
    },
  },
  revision: git('rev-parse', 'HEAD'),
  sourceDirty: git('status', '--porcelain').length > 0,
  sourceManifest: manifest,
  sourceManifestSha256: createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),
  runtime: {
    node: process.versions.node,
    platform: platform(),
    release: release(),
    poolMax: 10,
    readAdmission: 16,
  },
  hardware: { cpu: cpus()[0]?.model, logicalCpus: cpus().length, ramBytes: totalmem() },
  workload: {
    seed: 'p4b-deterministic-distribution-v1',
    sampleCountPerOperation: sampleCount,
    actualOperationalVolumes:
      'NOT PROVIDED; every tier is a declared synthetic engineering assumption, not factory capacity evidence',
    distribution:
      '60% orders in the exercised customer, remaining40% across configured customers; every fifth selected order has multiple assessments; one hot order has60assessments; legacy-heavy Inventory with actual I2/production owner-command examples; deterministic mixed item types and Ledger fanout1/3/11/99',
    cache:
      'ANALYZE and first observations warm PostgreSQL/OS caches. No restart; no cold-cache claim. OS filesystem cache uncontrolled.',
    measurements:
      'Six browser HTTP read operations separately, per-subcase timing, composed-server and Node HTTP end-to-end durations; actual Chromium journey timings are a separate harness artifact. Same-schema before/overlap/after writer controls; no index-write-cost comparison or new index.',
    identity:
      '10 readers and2 writers use distinct personal accounts/sessions, avoiding artificial same-account renewal-lock contention',
    writerSampling:
      'Each control and overlap round runs at least400 Sales cycles (200 each STOCK/MAKE) and2000 Inventory writes. Readers continue round-robin until writer minima finish; require200 fully overlapping samples per writer operation. Identical observer runs throughout all three rounds; phase-tagged samples and dataset growth snapshots retained.',
  },
  tiers: [],
  ownerNumericBudgets: 'PENDING EXPLICIT OWNER APPROVAL',
  p4aMigrationWideWriteOverhead: 'UNCHANGED OPEN DEPLOYMENT/OPERATIONAL GATE',
};
if (internal20)
  Object.assign(report.workload, {
    profile,
    activeMeasurementPersons: profile === 'internal20-history' ? 1 : 20,
    preparedMeasurementPersons: 20,
    identity:
      '20 personal accounts/sessions, all with32 exact-customer Sales grants; person0 also runs Sales writes and person19 also has organizational Warehouse role and runs receipts. Writers are included in20. History-only warm/plan observations use person0 only. Fixture seed accounts have no measured traffic.',
    actualOperationalVolumes:
      'Approximately20 total internal employees is Owner planning input;20 concurrent Sales users is conservative. Lookup rates, writer rates and all history/cardinality distributions are unmeasured engineering assumptions. Orders/customer and assessments/order remain UNKNOWN.',
    lookup:
      'Each lookup is exactly3 sequential authorized HTTP reads: exact UUID order query, order detail, assessment query for the same order/customer.20 sessions evenly staggered: normal1lookup/person/min (20/min), peak2/person/min (40/min). No extra roster/cursor requests in paced windows.',
    writerSampling: `Conservative unmeasured engineering assumption: one accepted five-command Sales cycle alternating STOCK/MAKE and one PostGoodsReceipt every${writerPeriodMs}ms, identical before/during/after. Baselines at least202cycles/receipts each; normal600s (200lookups,10/person) and peak420s (280lookups,14/person). Both writers continue until reads settle and both minima finish. At least200 fully enclosed samples required per actual writer operation; no blended normal/peak percentiles.`,
    historyGrowth:
      'internal20-history is a lightweight synthetic50,000-order/5-assessment-mix read/plan check only;200 stock Units and existing actual origin examples remain. It runs first observations, warm samples and plans, with no measured writers or paced load.',
  });
if (profile === 'internal20') {
  report.workload.phaseOrder = [
    'writer-baseline-before',
    ...measurementOrder.split('-'),
    'writer-baseline-after',
  ];
  report.workload.diagnostics =
    'Per-phase process CPU deltas (microseconds) and memory snapshots (bytes) describe this Node process, not PostgreSQL or machine CPU. Active-PID observer samples retain poll wake drift versus previous loop end+10ms; this includes OS/event-loop/timer scheduling and is not pure CPU delay. Activity queryClass is a static classification only; no query text or parameters are recorded.';
}
const save = () => {
  const json = JSON.stringify(report, null, 2);
  writeFileSync(`${output}/performance-${runId}.json`, json);
  writeFileSync(`${output}/performance.json`, json);
};
const uuid = (prefix, n) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;
const percentile = (values, q) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * q) - 1)];
};
const distribution = (values) => ({
  count: values.length,
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
  p99: percentile(values, 0.99),
  max: values.length
    ? values.reduce((maximum, value) => Math.max(maximum, value), -Infinity)
    : null,
});
function summaries(samples) {
  const result = {};
  for (const operation of [...new Set(samples.map((s) => s.operation))]) {
    const selected = samples.filter((s) => s.operation === operation);
    const byCase = {};
    for (const name of [...new Set(selected.map((s) => s.case))]) {
      const group = selected.filter((s) => s.case === name);
      byCase[name] = {
        serverMs: distribution(group.map((s) => s.serverMs)),
        httpClientMs: distribution(group.map((s) => s.clientMs)),
        statusCounts: Object.fromEntries(
          [...new Set(group.map((s) => s.status))].map((status) => [
            status,
            group.filter((s) => s.status === status).length,
          ]),
        ),
      };
    }
    const elapsedMs =
      selected.reduce((maximum, s) => Math.max(maximum, s.end), -Infinity) -
      selected.reduce((minimum, s) => Math.min(minimum, s.start), Infinity);
    result[operation] = {
      serverMs: distribution(selected.map((s) => s.serverMs)),
      httpClientMs: distribution(selected.map((s) => s.clientMs)),
      elapsedMs,
      completedPerSecond: (1000 * selected.length) / elapsedMs,
      byCase,
    };
  }
  return result;
}
function planRows(node) {
  return {
    nodeType: node['Node Type'],
    relation: node['Relation Name'],
    index: node['Index Name'],
    actualRows: node['Actual Rows'],
    loops: node['Actual Loops'],
    removedByFilter: node['Rows Removed by Filter'] ?? 0,
    children: (node.Plans ?? []).map(planRows),
  };
}
const safeError = (error) =>
  String(error?.message ?? error)
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gu, '<redacted-database-url>')
    .slice(0, 400);
save();

async function runTier(tier) {
  return withDatabase(async (db) => {
    const h = await inventoryDiscoveryHarness(db);
    const result = {
      definition: tier,
      status: 'RUNNING',
      samples: [],
      plans: [],
      writerSamples: [],
      lockSamples: [],
      poolAcquisitionSamples: [],
      requestFailures: [],
    };
    report.tiers.push(result);
    save();
    const scope = new AsyncLocalStorage();
    const writers = new AsyncLocalStorage();
    const pendingTiming = new Map(),
      captured = new Map();
    const readPids = new Set(),
      writerPids = new Set();
    const digests = new Set();
    let sequence = 0,
      phase = 'setup';
    const originalBegin = PostgresTransactions.prototype.begin;
    const originalConnect = Pool.prototype.connect;
    const methodRestores = [];
    const requestListeners = h.app.server.listeners('request');
    h.app.server.removeAllListeners('request');
    h.app.server.on('request', (request, response) => {
      const measurement = pendingTiming.get(request.headers['x-p4b-measurement']);
      if (measurement) {
        measurement.serverStart = performance.now();
        response.once('finish', () => {
          measurement.serverEnd = performance.now();
        });
      }
      scope.run(measurement?.scope, () => {
        for (const listener of requestListeners) listener.call(h.app.server, request, response);
      });
    });
    Pool.prototype.connect = function (...args) {
      const current = scope.getStore() ?? writers.getStore(),
        start = performance.now();
      const queued = this.idleCount === 0 && this.totalCount >= this.options.max;
      const record = () => {
        if (current)
          result.poolAcquisitionSamples.push({
            phase: current.phase,
            operation: current.operation,
            queued,
            ms: performance.now() - start,
          });
      };
      if (typeof args[0] === 'function') {
        const callback = args[0];
        args[0] = function (...values) {
          record();
          return callback.apply(this, values);
        };
        return originalConnect.apply(this, args);
      }
      const promise = originalConnect.apply(this, args);
      return promise.then(
        (client) => {
          record();
          return client;
        },
        (error) => {
          record();
          throw error;
        },
      );
    };
    PostgresTransactions.prototype.begin = async function (...args) {
      const current = scope.getStore() ?? writers.getStore();
      const tx = await originalBegin.apply(this, args);
      if (current) {
        const client = transactionClient(tx.context),
          pid = client.processID,
          releaseClient = client.release;
        const set = current.category === 'read' ? readPids : writerPids;
        set.add(pid);
        client.release = function (...values) {
          set.delete(pid);
          client.release = releaseClient;
          return releaseClient.apply(this, values);
        };
      }
      return tx;
    };
    function captureMethod(prototype, name) {
      const original = prototype[name];
      if (typeof original !== 'function') return;
      prototype[name] = async function (...args) {
        const current = scope.getStore();
        const context =
          args.find((a) => a?.transaction)?.transaction ??
          args.find(
            (a) => a && typeof a === 'object' && !Array.isArray(a) && !('installationId' in a),
          );
        // customers(principal,tx,...) has a bare opaque transaction in argument1.
        const tx = name === 'customers' ? args[1] : context;
        const client = transactionClient(tx),
          query = client.query;
        client.query = function (text, ...queryArgs) {
          if (current && typeof text === 'string' && /\bSELECT\b/iu.test(text)) {
            const key =
              current.operation +
              '/' +
              current.case +
              '/' +
              name +
              '/' +
              createHash('sha256').update(text).digest('hex').slice(0, 12);
            if (!captured.has(key))
              captured.set(key, {
                key,
                operation: current.operation,
                case: current.case,
                method: name,
                text,
                values: queryArgs[0],
              });
          }
          return query.call(this, text, ...queryArgs);
        };
        try {
          return await original.apply(this, args);
        } finally {
          client.query = query;
        }
      };
      methodRestores.push(() => {
        prototype[name] = original;
      });
    }
    for (const name of ['customers', 'orders', 'order', 'assessments', 'assessment'])
      captureMethod(PostgresSalesStore.prototype, name);
    for (const name of ['salesCandidates', 'links', 'ledger'])
      captureMethod(PostgresInventoryDiscoveryStore.prototype, name);

    const browserClient = (username, password = 'synthetic sales individual password') => {
      let cookie = '',
        csrf = '';
      const call = (route, input, customer, headers = {}) =>
        fetch(h.origin + '/ui-api' + route, {
          method: input === undefined ? 'GET' : 'POST',
          signal: AbortSignal.timeout(15000),
          headers: {
            'x-erp-browser': '1',
            'sec-fetch-site': 'same-origin',
            cookie,
            'x-erp-csrf': csrf,
            ...(customer ? { 'x-customer-id': customer } : {}),
            ...(input === undefined
              ? {}
              : { origin: h.origin, 'content-type': 'application/json' }),
            ...headers,
          },
          ...(input === undefined ? {} : { body: JSON.stringify(input) }),
        });
      return {
        call,
        get token() {
          return cookie.slice(cookie.indexOf('=') + 1);
        },
        async login() {
          const response = await call('/identity/login', { username, password });
          assert.equal(response.status, 200);
          cookie = response.headers.get('set-cookie').split(';')[0];
          const session = await call('/identity/session');
          assert.equal(session.status, 200);
          const self = await session.json();
          csrf = self.browser.csrf;
          digests.add(createHash('sha256').update(this.token).digest('hex'));
          return self;
        },
      };
    };
    async function timed(person, operation, name, route, input, customer, expected = 200) {
      const id = String(++sequence),
        start = performance.now();
      const measurement = {
        scope: {
          category: route.endsWith('/commands') ? 'write' : 'read',
          operation,
          case: name,
          phase,
        },
      };
      pendingTiming.set(id, measurement);
      try {
        const response = await person.call(route, input, customer, { 'x-p4b-measurement': id });
        const data = await response.json(),
          end = performance.now();
        assert.equal(
          response.status,
          expected,
          operation + ' ' + name + ': ' + JSON.stringify(data),
        );
        assert.ok(
          Number.isFinite(measurement.serverEnd) &&
            measurement.serverEnd >= measurement.serverStart,
          'Missing actual server timing',
        );
        return {
          data,
          sample: {
            operation,
            case: name,
            phase,
            status: response.status,
            start,
            end,
            serverMs: measurement.serverEnd - measurement.serverStart,
            clientMs: end - start,
          },
        };
      } catch (error) {
        result.requestFailures.push({
          operation,
          case: name,
          phase,
          elapsedMs: performance.now() - start,
          error: safeError(error),
        });
        throw error;
      } finally {
        pendingTiming.delete(id);
      }
    }
    let monitor = false;
    let monitorTask;
    try {
      const own = h.fixture.people.customerId,
        other = h.fixture.people.otherCustomerId;
      const legacy = await h.legacy('100', 'P4B-PRIVATE-CONTRACT-' + randomUUID());
      const inbound = await h.i2();
      const beam = await h.legacy('110', 'P4B-BEAM-' + randomUUID(), 'BEAM');
      const production = await h.fixture.prepare({ source: beam.unitId });
      const complete = h.fixture.complete(production.ops[0], production.source, '70.5', '70.500');
      completed(await h.fixture.run(complete.input), 'accepted');
      const customerIds = [
        own,
        ...Array.from({ length: tier.customers - 1 }, (_, i) => uuid('91000000', i + 1)),
      ];
      for (let first = 1; first < customerIds.length; first += 500) {
        const part = customerIds.slice(first, first + 500);
        await db.owner.query(
          "INSERT INTO sales.customer(installation_id,authority_scope,customer_id,display_name) SELECT $1,$1,id,'Synthetic P4b customer '||ordinality FROM unnest($2::uuid[]) WITH ORDINALITY x(id,ordinality)",
          [installation, part],
        );
      }
      // Synthetic immutable source fixture; all checks/triggers remain enabled.
      for (let first = 1; first <= tier.orders; first += 500) {
        const last = Math.min(tier.orders, first + 499),
          client = await db.owner.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            `CREATE TEMP TABLE p4b_seed ON COMMIT DROP AS SELECT n,
            ('92000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS id,
            CASE WHEN n%100<60 THEN $1::uuid ELSE ($2::uuid[])[2+n%($3::integer-1)] END AS customer,
            ('93000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS item,
            (ARRAY['COIL','SHEET','ANGLE','BEAM','OTHER'])[1+n%5] AS kind
            FROM generate_series($4::integer,$5::integer)n`,
            [own, customerIds, tier.customers, first, last],
          );
          await client.query(
            `INSERT INTO sales.sales_order(installation_id,authority_scope,order_id,customer_id,customer_name,items,commercial_terms,binding,state,issuer,subject)
            SELECT $1,$1,s.id,s.customer,c.display_name,jsonb_build_array(jsonb_build_object('id',s.item,'type',s.kind,'description','Explicit synthetic P4b benchmark demand','demandedKg','5','allowPartialShipment',n%2=0)),
            'NOT_SUPPLIED','p4b-synthetic-binding-'||n,'DRAFT','p4b-synthetic','benchmark' FROM p4b_seed s JOIN sales.customer c ON c.installation_id=$1 AND c.authority_scope=$1 AND c.customer_id=s.customer`,
            [installation],
          );
          await client.query(
            `INSERT INTO sales.fulfillment_assessment(installation_id,authority_scope,assessment_id,order_id,customer_id,order_binding,binding,state)
            SELECT $1,$1,('94000000-0000-4000-8000-'||lpad((n*100+k)::text,12,'0'))::uuid,id,customer,'p4b-synthetic-binding-'||n,'p4b-synthetic-assessment-'||n||'-'||k,'DRAFT'
            FROM p4b_seed CROSS JOIN LATERAL generate_series(1,CASE WHEN n=1 THEN 60 WHEN n%5=0 THEN $2::integer ELSE 1 END)k`,
            [installation, tier.assessmentsPerSelectedOrder],
          );
          await client.query(
            `UPDATE sales.fulfillment_assessment a SET state='RECORDED',fulfillment_mode='MAKE',observed_at=clock_timestamp()
            FROM p4b_seed s WHERE a.installation_id=$1 AND a.authority_scope=$1 AND a.order_id=s.id AND a.state='DRAFT' AND (s.n%3=0 OR s.n=1)`,
            [installation],
          );
          await client.query(
            "UPDATE sales.sales_order o SET state='SUBMITTED' FROM p4b_seed s WHERE o.installation_id=$1 AND o.authority_scope=$1 AND o.order_id=s.id AND s.n%3=0",
            [installation],
          );
          await client.query(
            `UPDATE sales.sales_order o SET state='CONFIRMED',confirmed_at=clock_timestamp(),confirmed_assessment_id=('94000000-0000-4000-8000-'||lpad((s.n*100+1)::text,12,'0'))::uuid
            FROM p4b_seed s WHERE o.installation_id=$1 AND o.authority_scope=$1 AND o.order_id=s.id AND s.n%6=0`,
            [installation],
          );
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
      // Legacy-heavy stock scale; immutable receipt/origin/Ledger links and balanced
      // historical reserved deltas are synthetic, never a stock command alternative.
      for (let first = 1; first <= tier.units; first += 250) {
        const client = await db.owner.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            `CREATE TEMP TABLE p4b_stock_seed ON COMMIT DROP AS SELECT n,$1::uuid AS installation,
            ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS unit,
            ('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS lot,
            ('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS material,
            ('50000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS receipt,
            ('60000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS effect,
            ('70000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid AS ledger,
            ('80000000-0000-4000-8000-'||lpad((n%10)::text,12,'0'))::uuid AS location,
            (ARRAY['COIL','SHEET','ANGLE','BEAM','OTHER'])[1+n%5] AS kind,
            CASE WHEN n%20=0 THEN $2::text ELSE '' END AS customer
            FROM generate_series($3::integer,$4::integer)n`,
            [installation, other, first, Math.min(tier.units, first + 249)],
          );
          await client.query(
            "INSERT INTO inventory.unit(installation_id,authority_scope,unit_id,lot_id,kind,location_id,customer_scope,state) SELECT $1,$1,unit,lot,kind,location,customer,'AVAILABLE' FROM p4b_stock_seed",
            [installation],
          );
          await client.query(
            "INSERT INTO inventory.ledger(installation_id,authority_scope,ledger_id,unit_id,source_fact_id,effect_id,binding,on_hand_delta,reserved_delta,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key) SELECT $1,$1,ledger,unit,receipt,effect,'{}',100,0,'p4b-synthetic','benchmark','ACT-WH',gen_random_uuid(),'PostGoodsReceipt',1,gen_random_uuid() FROM p4b_stock_seed",
            [installation],
          );
          await client.query(
            'INSERT INTO inventory.balance(installation_id,authority_scope,unit_id,on_hand,reserved) SELECT $1,$1,unit,100,0 FROM p4b_stock_seed',
            [installation],
          );
          await client.query(
            "INSERT INTO procurement.goods_receipt(installation_id,authority_scope,receipt_id,binding,state,internal_code,count,measured_kg,type,location_id,product_code,lot_id,unit_id,material_id,effect_id,issuer,subject,actor_role,request_id,idempotency_key) SELECT $1,$1,receipt,'{}','POSTED','P4B-SYNTHETIC-'||n,1,100,kind,location,CASE WHEN kind='SHEET' THEN 'SYNTHETIC-PRODUCT-'||n ELSE NULL END,lot,unit,material,effect,'p4b-synthetic','benchmark','ACT-WH',gen_random_uuid(),gen_random_uuid() FROM p4b_stock_seed",
            [installation],
          );
          await client.query(
            "INSERT INTO inventory.material_lot(installation_id,authority_scope,lot_id,receipt_id,unit_id,material_id,effect_id,internal_code,count,measured_kg,type,location_id,product_code) SELECT $1,$1,lot,receipt,unit,material,effect,'P4B-SYNTHETIC-'||n,1,100,kind,location,CASE WHEN kind='SHEET' THEN 'SYNTHETIC-PRODUCT-'||n ELSE NULL END FROM p4b_stock_seed",
            [installation],
          );
          await client.query(
            "INSERT INTO inventory.ledger(installation_id,authority_scope,ledger_id,unit_id,source_fact_id,effect_id,binding,on_hand_delta,reserved_delta,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key) SELECT $1,$1,gen_random_uuid(),unit,gen_random_uuid(),gen_random_uuid(),'{}',0,CASE WHEN k%2=1 THEN 1 ELSE -1 END,'p4b-synthetic','benchmark','ACT-WH',gen_random_uuid(),'SyntheticReservationHistory',1,gen_random_uuid() FROM p4b_stock_seed CROSS JOIN LATERAL generate_series(1,CASE WHEN n%101=0 THEN 98 WHEN n%23=0 THEN 10 WHEN n%7=0 THEN 2 ELSE 0 END)k",
            [installation],
          );
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
      const people = [];
      for (let n = 0; n < (internal20 ? 20 : 12); n++) {
        const accountId = randomUUID(),
          personId = randomUUID(),
          username = `p4b.perf.${n}`;
        await db.owner.query(
          "INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) SELECT $1,$2,$3,$4,password_hash FROM identity.account WHERE installation_id=$1 AND username='sales.first'",
          [installation, accountId, personId, username],
        );
        const warehousePerson = n === (internal20 ? 19 : 11);
        const granted = warehousePerson && !internal20 ? [] : customerIds.slice(0, tier.grants);
        if (warehousePerson)
          await db.owner.query(
            "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$1,'ACT-WH','')",
            [installation, accountId],
          );
        if (granted.length)
          await db.owner.query(
            "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) SELECT $1,$2,$1,'ACT-SALES',id::text FROM unnest($3::uuid[])id",
            [installation, accountId, granted],
          );
        const browser = browserClient(username);
        await browser.login();
        people.push({
          browser,
          accountId,
          personId,
          actor: warehousePerson
            ? await h.app.identity.context(browser.token, 'ACT-WH')
            : undefined,
        });
      }
      for (const table of [
        'sales.customer',
        'sales.sales_order',
        'sales.fulfillment_assessment',
        'identity.role_grant',
        'identity.account',
        'identity.session',
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
      const readDataset = async () =>
        (
          await db.owner.query(
            `SELECT (SELECT count(*) FROM sales.customer) AS customers,(SELECT count(*) FROM sales.sales_order) AS orders,(SELECT count(*) FROM sales.fulfillment_assessment) AS assessments,(SELECT count(*) FROM identity.role_grant WHERE actor_role='ACT-SALES') AS salesGrants,(SELECT count(*) FROM inventory.unit) AS units,(SELECT count(*) FROM inventory.ledger) AS ledger,(SELECT count(*) FROM inventory.material_lot) AS legacy,(SELECT count(*) FROM inventory.inbound_unit_origin) AS i2,(SELECT count(*) FROM inventory.production_origin) AS production`,
          )
        ).rows[0];
      result.dataset = await readDataset();
      result.stateDistribution = (
        await db.owner.query(
          'SELECT state,count(*) AS n FROM sales.sales_order GROUP BY state ORDER BY state',
        )
      ).rows;
      result.ledgerFanout = (
        await db.owner.query(
          'SELECT entries,count(*) AS units FROM (SELECT unit_id,count(*) AS entries FROM inventory.ledger GROUP BY unit_id)x GROUP BY entries ORDER BY entries',
        )
      ).rows;
      result.database = (
        await db.owner.query(
          "SELECT version() AS version,current_database() AS database,current_setting('server_encoding') AS encoding",
        )
      ).rows[0];
      result.settings = (
        await db.owner.query(
          "SELECT name,setting,unit FROM pg_settings WHERE name IN ('shared_buffers','work_mem','max_connections','synchronous_commit','default_transaction_isolation') ORDER BY name",
        )
      ).rows;
      result.indexes = (
        await db.owner.query(
          "SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname IN ('sales','inventory','identity') ORDER BY schemaname,tablename,indexname",
        )
      ).rows;
      const mainOrder = uuid('92000000', 1),
        mainItem = uuid('93000000', 1),
        mainAssessment = uuid('94000000', 101);
      const coilOrder = uuid('92000000', 5),
        coilItem = uuid('93000000', 5);
      async function operations(person) {
        const cases = [];
        const add = (operation, name, route, input, customer = own, expected = 200) =>
          cases.push({ operation, name, route: '/sales/v1/' + route, input, customer, expected });
        const rosterFirst = await person.call('/sales/v1/customers/query', { limit: 10 });
        assert.equal(rosterFirst.status, 200);
        const roster = await rosterFirst.json();
        add('customer-roster', 'first', 'customers/query', { limit: 10 }, null);
        if (roster.data.nextCursor)
          add(
            'customer-roster',
            'next',
            'customers/query',
            { limit: 10, cursor: roster.data.nextCursor },
            null,
          );
        const first = await person.call('/sales/v1/orders/query', { limit: 10 }, own);
        assert.equal(first.status, 200);
        const orders = await first.json();
        add('order-discovery', 'first', 'orders/query', { limit: 25 });
        add('order-discovery', 'state', 'orders/query', {
          limit: 25,
          filters: { state: 'SUBMITTED' },
        });
        add('order-discovery', 'type', 'orders/query', {
          limit: 25,
          filters: { itemType: 'SHEET' },
        });
        add('order-discovery', 'and', 'orders/query', {
          limit: 25,
          filters: { state: 'SUBMITTED', itemType: 'SHEET' },
        });
        add('order-discovery', 'exact', 'orders/query', { filters: { orderId: mainOrder } });
        add('order-discovery', 'negative', 'orders/query', {
          filters: { orderId: uuid('99999999', 1) },
        });
        if (orders.data.nextCursor)
          add('order-discovery', 'next', 'orders/query', {
            limit: 10,
            cursor: orders.data.nextCursor,
          });
        add('order-detail', 'exact', 'orders/detail', { orderId: mainOrder });
        add('order-detail', 'missing', 'orders/detail', { orderId: uuid('99999999', 2) }, own, 404);
        const firstAssess = await person.call(
          '/sales/v1/assessments/query',
          { orderId: mainOrder, limit: 10 },
          own,
        );
        assert.equal(firstAssess.status, 200);
        const assess = await firstAssess.json();
        add('assessment-discovery', 'first', 'assessments/query', {
          orderId: mainOrder,
          limit: 25,
        });
        if (assess.data.nextCursor)
          add('assessment-discovery', 'next', 'assessments/query', {
            orderId: mainOrder,
            limit: 10,
            cursor: assess.data.nextCursor,
          });
        add('assessment-detail', 'recorded-make', 'assessments/detail', {
          assessmentId: mainAssessment,
        });
        add('assessment-detail', 'draft-default-stock', 'assessments/detail', {
          assessmentId: uuid('94000000', 201),
        });
        const firstStock = await person.call(
          '/sales/v1/stock/query',
          { orderId: coilOrder, itemId: coilItem, limit: 10 },
          own,
        );
        assert.equal(firstStock.status, 200);
        const stock = await firstStock.json();
        add('stock-candidates', 'first-coil', 'stock/query', {
          orderId: coilOrder,
          itemId: coilItem,
          limit: 25,
        });
        if (stock.data.nextCursor)
          add('stock-candidates', 'next-coil', 'stock/query', {
            orderId: coilOrder,
            itemId: coilItem,
            limit: 10,
            cursor: stock.data.nextCursor,
          });
        add('stock-candidates', 'legacy-exact', 'stock/query', {
          orderId: coilOrder,
          itemId: coilItem,
          filters: { unitId: legacy.unitId },
        });
        add('stock-candidates', 'i2-exact', 'stock/query', {
          orderId: coilOrder,
          itemId: coilItem,
          filters: { unitId: inbound.origins[0].unit_id },
        });
        add('stock-candidates', 'production-exact-fraction', 'stock/query', {
          orderId: mainOrder,
          itemId: mainItem,
          filters: { unitId: complete.outId },
        });
        add('stock-candidates', 'negative', 'stock/query', {
          orderId: coilOrder,
          itemId: coilItem,
          filters: { unitId: uuid('99999999', 3) },
        });
        add('stock-candidates', 'confidential-code-safe-empty', 'stock/query', {
          orderId: coilOrder,
          itemId: coilItem,
          filters: { internalCode: 'P4B-PRIVATE-NOT-DISCLOSED' },
        });
        return cases;
      }
      const groups = new Map();
      for (const entry of await operations(people[0].browser)) {
        const group = groups.get(entry.operation) ?? [];
        group.push(entry);
        groups.set(entry.operation, group);
      }
      phase = 'first-observation';
      const datasetPhase = async (name, action) => {
        if (!internal20) return action();
        const start = performance.now(),
          datasetStart = await readDataset();
        try {
          return await action();
        } finally {
          result.datasetPhases ??= [];
          result.datasetPhases.push({
            name,
            start,
            end: performance.now(),
            datasetStart,
            datasetEnd: await readDataset(),
          });
        }
      };
      await datasetPhase('first-observation', async () => {
        for (const group of groups.values())
          for (const entry of group) {
            const { sample } = await timed(
              people[0].browser,
              entry.operation,
              entry.name,
              entry.route,
              entry.input,
              entry.customer,
              entry.expected,
            );
            result.samples.push(sample);
          }
      });
      phase = 'warm-serial';
      await datasetPhase('warm-serial', async () => {
        for (const [operation, cases] of groups)
          for (let n = 0; n < sampleCount; n++) {
            const entry = cases[n % cases.length];
            const { sample } = await timed(
              people[0].browser,
              operation,
              entry.name,
              entry.route,
              entry.input,
              entry.customer,
              entry.expected,
            );
            result.samples.push(sample);
          }
      });
      result.warmSerial = summaries(result.samples.filter((s) => s.phase === 'warm-serial'));
      phase = 'plans';
      await datasetPhase('plans', async () => {
        for (const value of captured.values()) {
          let plan = (
            await db.runtime.query(
              'EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) ' + value.text,
              value.values,
            )
          ).rows[0]['QUERY PLAN'][0];
          let encoded = JSON.stringify(plan);
          for (const digest of digests)
            encoded = encoded.replaceAll(digest, '<redacted-session-digest>');
          plan = JSON.parse(encoded);
          result.plans.push({
            key: value.key,
            operation: value.operation,
            case: value.case,
            method: value.method,
            sql: value.text,
            parameters: 'Not logged: regenerated synthetic identities and private session digest',
            plan,
            rows: planRows(plan.Plan),
          });
        }
      });
      if (profile === 'internal20-history') {
        result.status = 'MEASURED_OWNER_NUMERIC_APPROVAL_PENDING';
        result.historyComparison =
          'Compare warmSerial and plans against internal20 initial warm/plan results; synthetic history-growth check only, no writer or operational capacity claim.';
        save();
        console.log(
          JSON.stringify({
            tier: tier.name,
            dataset: result.dataset,
            warmSerial: result.warmSerial,
            historyComparison: result.historyComparison,
          }),
        );
        return;
      }
      const salesWriter = people[internal20 ? 0 : 10].browser,
        inventoryWriter = people[internal20 ? 19 : 11];
      async function salesCycle(round, n) {
        const draft = salesCommand(own),
          itemId = draft.payload.items[0].id;
        for (const input of [draft, follow(draft, 'SubmitSalesOrder')]) {
          const { data, sample } = await timed(
            salesWriter,
            input.command,
            round,
            '/sales/v1/commands',
            input,
            own,
          );
          assert.equal(data.result?.outcome, 'accepted');
          result.writerSamples.push(sample);
        }
        const assess = {
          ...follow(draft, 'DraftFulfillmentAssessment', { orderId: draft.target.id }),
          target: { kind: 'fulfillment-assessment', id: randomUUID() },
        };
        const record =
          n % 2 === 0
            ? follow(assess, 'RecordFulfillmentMake')
            : follow(assess, 'RecordFulfillmentStock', {
                selections: [{ itemId, unitIds: [legacy.unitId] }],
              });
        for (const input of [
          assess,
          record,
          follow(draft, 'ConfirmSalesOrder', { assessmentId: assess.target.id }),
        ]) {
          const { data, sample } = await timed(
            salesWriter,
            input.command,
            round,
            '/sales/v1/commands',
            input,
            own,
          );
          assert.equal(data.result?.outcome, 'accepted');
          result.writerSamples.push(sample);
        }
      }
      async function inventoryWrite(round) {
        const start = performance.now(),
          input = receiptCommand({
            payload: {
              internalCode: 'P4B-MEASURE-WRITE-' + randomUUID(),
              count: '1',
              measuredKg: '11',
              type: 'COIL',
              locationId: randomUUID(),
            },
          });
        await writers.run({ category: 'write', operation: 'PostGoodsReceipt', phase }, async () =>
          completed(await h.app.command(JSON.stringify(input), inventoryWriter.actor), 'accepted'),
        );
        const end = performance.now();
        result.writerSamples.push({
          operation: 'PostGoodsReceipt',
          case: round,
          phase,
          status: 200,
          start,
          end,
          serverMs: end - start,
          clientMs: end - start,
          transport: 'direct accepted owner command; not HTTP',
        });
      }
      async function writerRound(name, reads) {
        phase = name;
        let readsDone = !reads;
        const minimum = { sales: false, inventory: false, failed: false };
        const datasetStart = await readDataset();
        const intervals = {
          start: performance.now(),
          salesStart: 0,
          inventoryStart: 0,
          salesEnd: 0,
          inventoryEnd: 0,
        };
        const jobs = [
          (async () => {
            intervals.salesStart = performance.now();
            for (let n = 0; (n < 400 || !readsDone || !minimum.inventory) && !minimum.failed; n++) {
              await salesCycle(name, n);
              if (n + 1 >= 400) minimum.sales = true;
            }
            intervals.salesEnd = performance.now();
          })(),
          (async () => {
            intervals.inventoryStart = performance.now();
            for (let n = 0; (n < 2000 || !readsDone || !minimum.sales) && !minimum.failed; n++) {
              await inventoryWrite(name);
              if (n + 1 >= 2000) minimum.inventory = true;
            }
            intervals.inventoryEnd = performance.now();
          })(),
        ].map((job) =>
          job.catch((error) => {
            minimum.failed = true;
            throw error;
          }),
        );
        if (reads)
          jobs.push(
            reads(minimum).finally(() => {
              readsDone = true;
            }),
          );
        const outcomes = await Promise.allSettled(jobs);
        intervals.end = performance.now();
        result.writerIntervals ??= [];
        result.writerIntervals.push({
          name,
          ...intervals,
          datasetStart,
          datasetEnd: await readDataset(),
        });
        const failed = outcomes.find((outcome) => outcome.status === 'rejected');
        if (failed) throw failed.reason;
      }
      async function pacedWriterRound(name, durationMs, periodMs) {
        phase = name;
        const datasetStart = await readDataset();
        const cpuStart = process.cpuUsage(),
          memoryStart = process.memoryUsage();
        const intervals = {
          start: performance.now(),
          salesStart: 0,
          inventoryStart: 0,
          salesEnd: 0,
          inventoryEnd: 0,
        };
        const minimum = { sales: false, inventory: false, failed: false };
        let readsDone = !durationMs;
        const until = async (scheduled) => {
          const remaining = scheduled - performance.now();
          if (remaining > 0) await delay(remaining);
        };
        const writer = async (kind, action) => {
          intervals[kind + 'Start'] = performance.now();
          try {
            for (
              let n = 0;
              !minimum.failed && (n < 202 || !readsDone || !minimum.sales || !minimum.inventory);
              n++
            ) {
              const scheduled = intervals.start + n * writerPeriodMs;
              await until(scheduled);
              if (minimum.failed) break;
              const start = performance.now();
              let status = 'COMPLETED',
                errorMessage;
              try {
                await action(name, n);
              } catch (error) {
                status = 'FAILED';
                errorMessage = safeError(error);
                throw error;
              } finally {
                result.writerSchedules ??= [];
                result.writerSchedules.push({
                  phase: name,
                  writer: kind,
                  sequence: n,
                  scheduled,
                  start,
                  end: performance.now(),
                  latenessMs: Math.max(0, start - scheduled),
                  status,
                  ...(errorMessage ? { error: errorMessage } : {}),
                });
              }
              if (n + 1 >= 202) minimum[kind] = true;
            }
          } finally {
            intervals[kind + 'End'] = performance.now();
          }
        };
        const journeys = async () => {
          const window = {
            start: intervals.start,
            scheduledEnd: intervals.start + durationMs,
            end: 0,
            maxInFlight: 0,
            scheduledCount: 0,
            completedCount: 0,
            failedCount: 0,
            periodPerPersonMs: periodMs,
            globalSpacingMs: periodMs / 20,
          };
          result.journeyWindows ??= {};
          result.journeyWindows[name] = window;
          result.journeys ??= [];
          let inFlight = 0;
          // Schedule exactly the declared paced traffic; await every journey, including failures.
          const jobs = [];
          for (let n = 0; n * window.globalSpacingMs < durationMs; n++) {
            window.scheduledCount++;
            jobs.push(
              (async () => {
                const person = n % 20,
                  scheduled = window.start + n * window.globalSpacingMs;
                await until(scheduled);
                const record = {
                  phase: name,
                  person,
                  scheduled,
                  start: performance.now(),
                  end: 0,
                  status: 'RUNNING',
                };
                record.latenessMs = Math.max(0, record.start - scheduled);
                result.journeys.push(record);
                window.maxInFlight = Math.max(window.maxInFlight, ++inFlight);
                try {
                  for (const [operation, route, input] of [
                    ['order-discovery', 'orders/query', { filters: { orderId: mainOrder } }],
                    ['order-detail', 'orders/detail', { orderId: mainOrder }],
                    [
                      'assessment-discovery',
                      'assessments/query',
                      { orderId: mainOrder, limit: 25 },
                    ],
                  ]) {
                    const { sample } = await timed(
                      people[person].browser,
                      operation,
                      'paced-exact-order-lookup',
                      '/sales/v1/' + route,
                      input,
                      own,
                    );
                    result.samples.push(sample);
                  }
                  record.status = 'COMPLETED';
                  window.completedCount++;
                } catch (error) {
                  record.status = 'FAILED';
                  record.error = safeError(error);
                  window.failedCount++;
                  throw error;
                } finally {
                  record.end = performance.now();
                  inFlight--;
                }
              })(),
            );
          }
          const outcomes = await Promise.allSettled(jobs);
          await until(window.scheduledEnd);
          window.end = performance.now();
          window.latenessMs = distribution(
            result.journeys.filter((j) => j.phase === name).map((j) => j.latenessMs),
          );
          window.lateCount = result.journeys.filter(
            (j) => j.phase === name && j.latenessMs > 0,
          ).length;
          window.moreThan10msLateCount = result.journeys.filter(
            (j) => j.phase === name && j.latenessMs > 10,
          ).length;
          window.completedPerMinute = (60000 * window.completedCount) / (window.end - window.start);
          const failed = outcomes.find((outcome) => outcome.status === 'rejected');
          if (failed) throw failed.reason;
        };
        const jobs = [writer('sales', salesCycle), writer('inventory', inventoryWrite)];
        if (durationMs)
          jobs.push(
            journeys().finally(() => {
              readsDone = true;
            }),
          );
        const outcomes = await Promise.allSettled(
          jobs.map((job) =>
            job.catch((error) => {
              minimum.failed = true;
              throw error;
            }),
          ),
        );
        intervals.end = performance.now();
        const processDiagnostics = {
          cpuMicroseconds: process.cpuUsage(cpuStart),
          memoryStartBytes: memoryStart,
          memoryEndBytes: process.memoryUsage(),
        };
        result.writerIntervals ??= [];
        result.writerIntervals.push({
          name,
          ...intervals,
          processDiagnostics,
          datasetStart,
          datasetEnd: await readDataset(),
        });
        const failed = outcomes.find((outcome) => outcome.status === 'rejected');
        if (failed) throw failed.reason;
      }
      const observer = async () => {
        let scheduledWake = performance.now();
        while (monitor) {
          const actualWake = performance.now();
          const reads = [...readPids],
            writes = [...writerPids],
            pids = [...new Set([...reads, ...writes])];
          if (reads.length || writes.length) {
            const lockRows = (
              await db.runtime.query(
                'SELECT pid,locktype,mode,granted,relation::regclass::text AS relation,transactionid,page,tuple FROM pg_locks WHERE pid=ANY($1::integer[])',
                [pids],
              )
            ).rows;
            const activity = (
              await db.runtime.query(
                `SELECT pid,state,wait_event_type,wait_event,pg_blocking_pids(pid) AS blockers,query_start,xact_start,
                CASE WHEN position('identity.session' in query)>0 THEN 'identity.session'
                  WHEN position('identity.account' in query)>0 THEN 'identity.account'
                  WHEN position('identity.role_grant' in query)>0 THEN 'identity.role_grant'
                  WHEN position('sales.' in query)>0 THEN 'sales'
                  WHEN position('inventory.' in query)>0 THEN 'inventory'
                  WHEN position('procurement.' in query)>0 THEN 'procurement'
                  WHEN position('identity.' in query)>0 THEN 'identity.other'
                  WHEN query ~* '^\\s*(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)' THEN 'transaction-control'
                  ELSE 'other-or-hidden' END AS "queryClass"
                FROM pg_stat_activity WHERE pid=ANY($1::integer[])`,
                [pids],
              )
            ).rows;
            const waits = activity.filter((row) => writes.includes(row.pid));
            const readLocks = lockRows.filter((row) => reads.includes(row.pid));
            assert.ok(
              activity.every((row) => typeof row.state === 'string'),
              'Read or writer activity is hidden from observer; absence of waits cannot be established',
            );
            result.lockSamples.push({
              at: performance.now(),
              phase,
              scheduledWake,
              actualWake,
              wakeDriftMs: actualWake - scheduledWake,
              readPids: reads,
              writerPids: writes,
              readLocks,
              writerLocks: lockRows.filter((row) => writes.includes(row.pid)),
              readActivity: activity.filter((row) => reads.includes(row.pid)),
              missingWriterPids: writes.filter((pid) => !waits.some((row) => row.pid === pid)),
              missingReadPids: reads.filter((pid) => !activity.some((row) => row.pid === pid)),
              inventoryWriterLocks: readLocks.filter(
                (row) =>
                  row.relation?.startsWith('inventory.') && !['AccessShareLock'].includes(row.mode),
              ),
              attributableWriterWaits: waits.filter(
                (row) =>
                  row.wait_event_type === 'Lock' && row.blockers.some((pid) => reads.includes(pid)),
              ),
              writerWaits: waits,
            });
          }
          scheduledWake = performance.now() + 10;
          await delay(10);
        }
      };
      monitor = true;
      monitorTask = observer();
      if (internal20) {
        await pacedWriterRound('writer-baseline-before');
        for (const name of measurementOrder.split('-')) {
          await pacedWriterRound(
            name,
            name === 'normal' ? 600000 : 420000,
            name === 'normal' ? 60000 : 30000,
          );
        }
        await pacedWriterRound('writer-baseline-after');
      } else {
        await writerRound('writer-baseline-before');
        const readerCases = await Promise.all(
          people.slice(0, 10).map((person) => operations(person.browser)),
        );
        const perOperation = new Map([...groups.keys()].map((operation) => [operation, 0]));
        let nextOperation = 0;
        await writerRound('readers-and-writers', async (minimum) => {
          const outcomes = await Promise.allSettled(
            people
              .slice(0, 10)
              .map(async (person, worker) => {
                const cases = readerCases[worker];
                while (true) {
                  assert.ok(!minimum.failed, 'A writer or reader failed during overlap');
                  const keys = [...perOperation.keys()];
                  let operation;
                  for (let offset = 0; offset < keys.length; offset++) {
                    const candidate = keys[nextOperation++ % keys.length];
                    if (
                      perOperation.get(candidate) < sampleCount ||
                      !minimum.sales ||
                      !minimum.inventory
                    ) {
                      operation = candidate;
                      break;
                    }
                  }
                  if (!operation) return;
                  const index = perOperation.get(operation);
                  perOperation.set(operation, index + 1);
                  const variants = cases.filter((entry) => entry.operation === operation),
                    entry = variants[index % variants.length];
                  const { sample } = await timed(
                    person.browser,
                    operation,
                    entry.name,
                    entry.route,
                    entry.input,
                    entry.customer,
                    entry.expected,
                  );
                  result.samples.push(sample);
                }
              })
              .map((job) =>
                job.catch((error) => {
                  minimum.failed = true;
                  throw error;
                }),
              ),
          );
          const failed = outcomes.find((outcome) => outcome.status === 'rejected');
          if (failed) throw failed.reason;
        });
        await writerRound('writer-baseline-after');
      }
      monitor = false;
      await monitorTask;
      function summarizeScenario(phaseName) {
        const scenario = {};
        scenario.concurrentReads = summaries(result.samples.filter((s) => s.phase === phaseName));
        const overlappingReads = result.samples.filter((s) => s.phase === phaseName);
        const pacedWindow = result.journeyWindows?.[phaseName];
        const readerWindow = pacedWindow
          ? { start: pacedWindow.start, end: pacedWindow.end }
          : {
              start: overlappingReads.reduce((minimum, s) => Math.min(minimum, s.start), Infinity),
              end: overlappingReads.reduce((maximum, s) => Math.max(maximum, s.end), -Infinity),
            };
        scenario.readerWindow = readerWindow;
        const insideBaselineWriters = (sample) => {
          if (!['writer-baseline-before', 'writer-baseline-after'].includes(sample.phase))
            return false;
          const interval = result.writerIntervals.find((i) => i.name === sample.phase);
          return (
            sample.start >= Math.max(interval.salesStart, interval.inventoryStart) &&
            sample.end <= Math.min(interval.salesEnd, interval.inventoryEnd)
          );
        };
        scenario.writers = Object.fromEntries(
          [...new Set(result.writerSamples.map((s) => s.operation))].map((operation) => {
            const samples = result.writerSamples.filter((s) => s.operation === operation),
              baseline = samples.filter(insideBaselineWriters),
              overlap = samples.filter(
                (s) =>
                  s.phase === phaseName &&
                  s.start >= readerWindow.start &&
                  s.end <= readerWindow.end,
              );
            const b = distribution(baseline.map((s) => s.serverMs)),
              o = distribution(overlap.map((s) => s.serverMs));
            return [
              operation,
              {
                before: distribution(
                  baseline
                    .filter((s) => s.phase === 'writer-baseline-before')
                    .map((s) => s.serverMs),
                ),
                after: distribution(
                  baseline
                    .filter((s) => s.phase === 'writer-baseline-after')
                    .map((s) => s.serverMs),
                ),
                sameSchemaBracketBaseline: b,
                overlap: o,
                overlapDefinition:
                  'Complete writer sample interval inside active reader window; excludes startup and drain tail. Raw samples retain all phases.',
                baselineDefinition:
                  'Complete writer sample interval inside both co-writer workload intervals in each before/after control; same observer active, startup/drain excluded. Both writers continue until both minima finish.',
                p95RegressionPercent: b.p95 ? 100 * (o.p95 / b.p95 - 1) : null,
              },
            ];
          }),
        );
        for (const [operation, value] of Object.entries(scenario.writers)) {
          assert.ok(
            value.sameSchemaBracketBaseline.count >= 200,
            'Insufficient baseline writer samples: ' + operation,
          );
          assert.ok(
            value.overlap.count >= 200,
            'Insufficient fully overlapping writer samples: ' + operation,
          );
        }
        const concurrent = result.writerIntervals.find((interval) => interval.name === phaseName),
          overlapStart = Math.max(concurrent.salesStart, concurrent.inventoryStart),
          overlapEnd = Math.min(concurrent.salesEnd, concurrent.inventoryEnd);
        scenario.actualBothWriterOverlap = {
          start: overlapStart,
          end: overlapEnd,
          reads: result.samples.filter(
            (s) => s.phase === phaseName && s.start < overlapEnd && s.end > overlapStart,
          ).length,
          observerSamples: result.lockSamples.filter(
            (s) => s.at >= overlapStart && s.at <= overlapEnd,
          ).length,
          perOperation: summaries(
            result.samples.filter(
              (s) => s.phase === phaseName && s.start >= overlapStart && s.end <= overlapEnd,
            ),
          ),
          definition: pacedWindow
            ? 'Per-operation values require the complete read interval inside both active writer workloads; writers extend until all scheduled lookups settle and both minima finish. Each staggered lookup/person performs the same3 authorized HTTP reads sequentially: exact UUID order query, order detail, assessment query.'
            : 'Per-operation values require the complete read interval inside both active writer workloads; finite minimum writer counts extend until all reads finish. Readers are scheduled round-robin across operations.',
        };
        if (pacedWindow) {
          scenario.journeys = pacedWindow;
          assert.equal(
            pacedWindow.scheduledCount,
            phaseName === 'normal' ? 200 : 280,
            phaseName + ': unexpected scheduled journey count',
          );
          assert.equal(pacedWindow.failedCount, 0, phaseName + ': failed journeys');
          assert.equal(
            pacedWindow.completedCount,
            pacedWindow.scheduledCount,
            phaseName + ': incomplete journeys',
          );
          for (const operation of ['order-discovery', 'order-detail', 'assessment-discovery']) {
            assert.equal(
              scenario.concurrentReads[operation].serverMs.count,
              pacedWindow.scheduledCount,
              phaseName + ': incomplete ' + operation,
            );
            assert.ok(
              scenario.concurrentReads[operation].serverMs.count >= 200,
              phaseName + ': insufficient read tail samples',
            );
          }
          scenario.readerWindow.definition =
            'Entire declared paced scheduling window, including think-time gaps; extended only for actual journey drain. Raw scheduled/start/end times retained.';
          for (const [operation, value] of Object.entries(scenario.writers)) {
            value.p50RegressionPercent = value.sameSchemaBracketBaseline.p50
              ? 100 * (value.overlap.p50 / value.sameSchemaBracketBaseline.p50 - 1)
              : null;
            value.p99RegressionPercent = value.sameSchemaBracketBaseline.p99
              ? 100 * (value.overlap.p99 / value.sameSchemaBracketBaseline.p99 - 1)
              : null;
            const selected = result.writerSamples.filter((s) => s.operation === operation);
            value.throughput = Object.fromEntries(
              ['writer-baseline-before', phaseName, 'writer-baseline-after'].map((name) => {
                const interval = result.writerIntervals.find((i) => i.name === name);
                const count = selected.filter((s) => s.phase === name).length;
                const elapsedMs = interval.end - interval.start;
                return [name, { count, elapsedMs, completedPerSecond: (1000 * count) / elapsedMs }];
              }),
            );
          }
          scenario.poolAcquisition = distribution(
            result.poolAcquisitionSamples.filter((s) => s.phase === phaseName).map((s) => s.ms),
          );
          scenario.requestFailures = result.requestFailures.filter((s) => s.phase === phaseName);
          scenario.writerPacing = Object.fromEntries(
            ['writer-baseline-before', phaseName, 'writer-baseline-after'].map((name) => [
              name,
              Object.fromEntries(
                ['sales', 'inventory'].map((kind) => {
                  const schedules = result.writerSchedules.filter(
                    (s) => s.phase === name && s.writer === kind,
                  );
                  return [
                    kind,
                    {
                      scheduledPeriodMs: writerPeriodMs,
                      count: schedules.length,
                      failedCount: schedules.filter((s) => s.status === 'FAILED').length,
                      latenessMs: distribution(schedules.map((s) => s.latenessMs)),
                      lateCount: schedules.filter((s) => s.latenessMs > 0).length,
                      moreThan10msLateCount: schedules.filter((s) => s.latenessMs > 10).length,
                    },
                  ];
                }),
              ),
            ]),
          );
          scenario.lockObservationCoverage = {
            observerSamples: result.lockSamples.filter((s) => s.phase === phaseName).length,
            readTransactionSamples: result.lockSamples.filter(
              (s) => s.phase === phaseName && s.readPids.length > 0,
            ).length,
            visibleWriterRowsDuringBothWriterOverlap: result.lockSamples
              .filter((s) => s.phase === phaseName && s.at >= overlapStart && s.at <= overlapEnd)
              .reduce((n, s) => n + s.writerWaits.length, 0),
            missingRequestedWriterPids: result.lockSamples
              .filter((s) => s.phase === phaseName)
              .reduce((n, s) => n + s.missingWriterPids.length, 0),
          };
          assert.ok(
            scenario.lockObservationCoverage.readTransactionSamples > 0,
            phaseName + ': no read transactions observed',
          );
          assert.ok(
            scenario.lockObservationCoverage.visibleWriterRowsDuringBothWriterOverlap > 0,
            phaseName + ': no visible writer activity during overlap',
          );
        }
        return scenario;
      }
      if (internal20)
        result.scenarios = Object.fromEntries(
          ['normal', 'peak'].map((name) => [name, summarizeScenario(name)]),
        );
      else Object.assign(result, summarizeScenario('readers-and-writers'));
      const overlapIntervals = internal20
        ? Object.values(result.scenarios).map((s) => s.actualBothWriterOverlap)
        : [result.actualBothWriterOverlap];
      const inWriterOverlap = (at) => overlapIntervals.some((i) => at >= i.start && at <= i.end);
      result.observedInventoryWriterLocks = result.lockSamples.reduce(
        (sum, sample) => sum + sample.inventoryWriterLocks.length,
        0,
      );
      result.observedAttributableWriterWaits = result.lockSamples.reduce(
        (sum, sample) => sum + sample.attributableWriterWaits.length,
        0,
      );
      result.lockObservationCoverage = {
        pollingTargetMs: 10,
        observerRole: 'same restricted runtime role as measured connections',
        readTransactionSamples: result.lockSamples.filter((s) => s.readPids.length > 0).length,
        visibleWriterRowsDuringBothWriterOverlap: result.lockSamples
          .filter((s) => inWriterOverlap(s.at))
          .reduce((n, s) => n + s.writerWaits.length, 0),
        missingRequestedWriterPids: result.lockSamples.reduce(
          (n, s) => n + s.missingWriterPids.length,
          0,
        ),
        limitation:
          'No attributable waits observed is a sampled polling observation, not proof that no transient blocking occurred between polls.',
      };
      assert.ok(
        result.lockObservationCoverage.readTransactionSamples > 0,
        'No read transactions observed',
      );
      assert.ok(
        result.lockObservationCoverage.visibleWriterRowsDuringBothWriterOverlap > 0,
        'No visible writer activity during actual overlap',
      );
      result.poolAcquisitionSummary = {
        all: distribution(result.poolAcquisitionSamples.map((s) => s.ms)),
        queued: distribution(
          result.poolAcquisitionSamples.filter((s) => s.queued).map((s) => s.ms),
        ),
        description:
          'Time from pg.Pool.connect invocation to delivery; includes new-connection establishment. queued flag observes no idle client at configured max; not an invented pure wait metric.',
      };
      result.status = 'MEASURED_OWNER_NUMERIC_APPROVAL_PENDING';
      save();
      console.log(
        JSON.stringify({
          tier: tier.name,
          dataset: result.dataset,
          warmSerial: result.warmSerial,
          concurrentReads: result.concurrentReads,
          writers: result.writers,
          bothWriterOverlap: result.actualBothWriterOverlap,
          ...(internal20 ? { scenarios: result.scenarios } : {}),
          inventoryWriterLocks: result.observedInventoryWriterLocks,
          attributableWriterWaits: result.observedAttributableWriterWaits,
        }),
      );
    } finally {
      monitor = false;
      if (monitorTask) await monitorTask;
      for (const restore of methodRestores) restore();
      Pool.prototype.connect = originalConnect;
      PostgresTransactions.prototype.begin = originalBegin;
      await Promise.all([h.app.stop(), h.fixture.app.stop()]);
    }
  });
}
try {
  for (const tier of tiers) await runTier(tier);
  const finalManifest = Object.fromEntries(
    files.map((path) => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]),
  );
  assert.deepEqual(
    finalManifest,
    manifest,
    'Source changed during performance measurements; rerun against one stable source snapshot',
  );
  report.status = 'MEASURED_OWNER_PERFORMANCE_ACCEPTANCE_DECISION_PENDING';
  report.completedUtc = new Date().toISOString();
  save();
} catch (error) {
  report.status = 'MEASUREMENT_FAILED_NOT_ACCEPTED';
  report.error = safeError(error);
  report.completedUtc = new Date().toISOString();
  save();
  throw error;
}

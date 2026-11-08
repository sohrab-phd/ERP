import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createTransactionContext } from '@navard/shared-kernel';
import {
  parseSalesRead,
  SalesBrowserReads,
  type SalesBrowserReadStore,
  type SalesContext,
  type SalesOrder,
} from '../../src/modules/sales/index.js';
import { SalesReadCursors } from '../../src/transport/sales-cursors.js';

void test('Sales browser exact read shapes reject overrides, coercion and ambiguous filters', () => {
  for (const [kind, body] of [
    ['customers/query', { customerId: randomUUID() }],
    ['orders/query', { limit: 11 }],
    ['orders/query', { limit: '25' }],
    ['orders/query', { filters: { state: 'CANCELLED' } }],
    ['orders/query', { filters: { itemType: 'PIPE' } }],
    ['orders/query', { filters: { customerId: randomUUID() } }],
    ['orders/detail', {}],
    ['orders/detail', { orderId: randomUUID(), customerId: randomUUID() }],
    ['assessments/query', { assessmentId: randomUUID() }],
    [
      'stock/query',
      { orderId: randomUUID(), itemId: randomUUID(), filters: { internalCode: 'x'.repeat(129) } },
    ],
    [
      'stock/query',
      { orderId: randomUUID(), itemId: randomUUID(), filters: { internalCode: '\u0000private' } },
    ],
  ] as const)
    assert.throws(() => parseSalesRead(kind, body));
  assert.deepEqual(parseSalesRead('orders/query', {}), { limit: 25, filters: {} });
  for (const limit of [10, 25, 50])
    assert.equal(parseSalesRead('customers/query', { limit }).limit, limit);
});
void test('Sales cursor authenticates original TTL, precise route/actor/customer/filter/page binding', () => {
  let clock = 1000;
  const cursors = new SalesReadCursors('test-secret', 'http://127.0.0.1:3999', () => clock);
  const binding = cursors.binding({
    session: 'a',
    customer: 'b',
    kind: 'orders/query',
    filters: {},
    limit: 25,
  });
  const id = randomUUID();
  const cursor = cursors.next(id, clock, binding);
  assert.deepEqual(cursors.read(cursor, binding), { afterId: id, issuedAt: 1000 });
  for (const value of [cursor + 'x', cursor.slice(0, -1) + 'x', 'bad', 'x'.repeat(2049)])
    assert.throws(() => cursors.read(value, binding));
  assert.throws(() => cursors.read(cursor, cursors.binding({ session: 'new' })));
  clock += 300000;
  const continuation = cursors.next(randomUUID(), cursors.read(cursor, binding).issuedAt, binding);
  clock = 601000;
  assert.throws(() => cursors.read(continuation, binding));
  clock = 601001;
  assert.throws(() => cursors.read(continuation, binding));
  clock = 999;
  assert.throws(() => cursors.read(cursor, binding));
});
function fixture() {
  const order: SalesOrder = {
    id: randomUUID(),
    customerId: randomUUID(),
    customerName: 'private snapshot',
    items: [
      {
        id: randomUUID(),
        type: 'COIL',
        description: 'description',
        demandedKg: '9007199254740993',
        allowPartialShipment: false,
      },
    ],
    commercialTerms: 'NOT_SUPPLIED',
    state: 'DRAFT',
    binding: 'NEVER_DISCLOSE',
  };
  const context: SalesContext = {
    actor: {
      installationId: randomUUID(),
      authorityScopeId: randomUUID(),
      principal: { issuer: 'local:test', subject: randomUUID() },
      actorRole: 'ACT-SALES',
      customerScope: order.customerId,
      requestId: randomUUID(),
    },
    transaction: createTransactionContext(),
    request: {
      command: 'query',
      contract_version: 1,
      idempotency_key: randomUUID(),
      target: { kind: 'query', id: order.id },
      payload: {},
      preconditions: {},
    },
  };
  const store: SalesBrowserReadStore = {
    order: () => Promise.resolve(order),
    assessment: () =>
      Promise.resolve({
        id: randomUUID(),
        orderId: order.id,
        customerId: order.customerId,
        state: 'DRAFT',
        mode: 'STOCK',
        binding: 'PRIVATE',
        orderBinding: 'PRIVATE',
      }),
    customers: () => Promise.resolve([]),
    orders: () => Promise.resolve([]),
    assessments: () => Promise.resolve([]),
  };
  let stockCalls = 0,
    allowed = true;
  const reads: SalesBrowserReads = new SalesBrowserReads(
    store,
    {
      discover: (ctx) => {
        assert.equal(reads.stockReadAllowed(ctx), true);
        stockCalls++;
        return Promise.resolve([
          {
            unitId: randomUUID(),
            kind: 'COIL',
            state: 'AVAILABLE',
            availableKg: '9007199254740993.123456789012345678',
            internalCode: null,
          },
        ]);
      },
    },
    () => allowed,
  );
  return {
    order,
    context,
    reads,
    store,
    get calls() {
      return stockCalls;
    },
    deny() {
      allowed = false;
    },
  };
}
void test('Sales browser details preserve exact public fields and omit internal bindings', async () => {
  const h = fixture();
  const row = await h.reads.query(
    h.context,
    'orders/detail',
    parseSalesRead('orders/detail', { orderId: h.order.id }),
  );
  assert.equal(JSON.stringify(row).includes('binding'), false);
  assert.equal(JSON.stringify(row).includes('9007199254740993'), true);
  const assessment = await h.reads.query(
    h.context,
    'assessments/detail',
    parseSalesRead('assessments/detail', { assessmentId: randomUUID() }),
  );
  assert.equal(JSON.stringify(assessment).includes('PRIVATE'), false);
  assert.equal((assessment as { mode: string }).mode, 'STOCK');
});
void test('Sales stock admission exists only around an authorized matching parent/item and is revoked afterward', async () => {
  const h = fixture();
  const input = parseSalesRead('stock/query', {
    orderId: h.order.id,
    itemId: h.order.items[0]!.id,
  });
  assert.equal(h.reads.stockReadAllowed(h.context), false);
  const rows = (await h.reads.query(h.context, 'stock/query', input)) as { availableKg: string }[];
  assert.equal(rows[0]!.availableKg, '9007199254740993.123456789012345678');
  assert.equal(h.calls, 1);
  assert.equal(h.reads.stockReadAllowed(h.context), false);
  for (const state of ['CONFIRMED', 'IN_PRODUCTION'] as const) {
    h.order.state = state;
    await assert.rejects(() => h.reads.query(h.context, 'stock/query', input));
  }
  assert.equal(h.calls, 1);
});
void test('Browser recursive DTO whitelists omit unexpected nested stored fields', async () => {
  const h = fixture();
  Object.assign(h.order.items[0]!, {
    price: 'PRIVATE_NESTED_PRICE',
    customerKey: 'PRIVATE_NESTED_OWNER',
  });
  const order = await h.reads.query(
    h.context,
    'orders/detail',
    parseSalesRead('orders/detail', { orderId: h.order.id }),
  );
  assert.equal(JSON.stringify(order).includes('PRIVATE_NESTED'), false);
  h.store.assessment = () =>
    Promise.resolve({
      id: randomUUID(),
      orderId: h.order.id,
      customerId: h.order.customerId,
      state: 'RECORDED',
      mode: 'STOCK',
      binding: 'private',
      orderBinding: 'private',
      selections: [
        Object.assign(
          { itemId: h.order.items[0]!.id, unitIds: [randomUUID()] },
          { customerKey: 'PRIVATE_NESTED_OWNER' },
        ),
      ],
      stock: [
        Object.assign(
          { unitId: randomUUID(), kind: 'COIL', state: 'AVAILABLE', availableKg: '1.25' },
          { price: 'PRIVATE_NESTED_PRICE' },
        ),
      ],
    });
  const assessment = await h.reads.query(
    h.context,
    'assessments/detail',
    parseSalesRead('assessments/detail', { assessmentId: randomUUID() }),
  );
  assert.equal(JSON.stringify(assessment).includes('PRIVATE_NESTED'), false);
});
void test('Sales missing/foreign parent, item and inactive read context never invoke Inventory', async () => {
  const h = fixture();
  const input = parseSalesRead('stock/query', { orderId: h.order.id, itemId: randomUUID() });
  await assert.rejects(() => h.reads.query(h.context, 'stock/query', input));
  h.store.order = () => Promise.resolve(undefined);
  await assert.rejects(() => h.reads.query(h.context, 'stock/query', input));
  h.deny();
  await assert.rejects(() =>
    h.reads.query(h.context, 'orders/query', parseSalesRead('orders/query', {})),
  );
  assert.equal(h.calls, 0);
});

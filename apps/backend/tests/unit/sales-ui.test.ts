import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatSalesKg,
  salesCommandBody,
  salesDraftIssues,
  type SalesDraftLine,
} from '../../src/operator/sales.js';

const target = '11111111-1111-4111-8111-111111111111';
const key = '22222222-2222-4222-8222-222222222222';
const customer = '33333333-3333-4333-8333-333333333333';
const draft = (overrides: Partial<SalesDraftLine> = {}): SalesDraftLine => ({
  id: target,
  type: 'SHEET',
  description: 'ورق مناسب طبق مشخصات ثبت‌شده',
  demandedKg: '9007199254740993',
  allowPartialShipment: 'false',
  ...overrides,
});

void test('Sales display preserves whole demand and all fractional Inventory digits without numeric coercion', () => {
  assert.equal(formatSalesKg('9007199254740993'), '۹٬۰۰۷٬۱۹۹٬۲۵۴٬۷۴۰٬۹۹۳');
  assert.equal(formatSalesKg('0.000000000000000001'), '۰٫۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۱');
  assert.equal(
    formatSalesKg('99999999999999999999.123456789012345678'),
    '۹۹٬۹۹۹٬۹۹۹٬۹۹۹٬۹۹۹٬۹۹۹٬۹۹۹٫۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶۷۸',
  );
  assert.equal(formatSalesKg('70.500'), '۷۰٫۵۰۰');
  for (const invalid of [
    '01',
    '-1',
    '1e2',
    '1\n',
    '100000000000000000000',
    '0.0000000000000000001',
    '۱',
  ])
    assert.throws(() => formatSalesKg(invalid));
});

void test('Sales draft lexical review rejects decimals and localized demand, keeps exact valid original text', () => {
  const valid = draft({ description: '  شرح بدون تغییر  ', demandedKg: '99999999999999999999' });
  assert.deepEqual(salesDraftIssues([valid]), []);
  assert.equal(valid.description, '  شرح بدون تغییر  ');
  for (const invalid of ['0', '01', '1.5', '۱۰۰', '١٠٠', '1,000', '1٬000', '1e3', ' 1', '1\n'])
    assert.ok(
      salesDraftIssues([draft({ demandedKg: invalid })]).some((issue) =>
        issue.field.endsWith('-kg'),
      ),
    );
  assert.ok(
    salesDraftIssues([draft({ allowPartialShipment: '' })]).some((issue) =>
      issue.field.endsWith('-partial'),
    ),
  );
});

void test('Sales descriptions obey UTF-8 bytes and line identities remain bounded and distinct', () => {
  assert.deepEqual(salesDraftIssues([draft({ description: 'ر'.repeat(64) })]), []);
  assert.deepEqual(salesDraftIssues([draft({ description: '😀'.repeat(32) })]), []);
  for (const invalid of ['ر'.repeat(65), '\ud800', 'line\nline', '   '])
    assert.ok(
      salesDraftIssues([draft({ description: invalid })]).some((issue) =>
        issue.field.endsWith('-description'),
      ),
    );
  assert.ok(salesDraftIssues([]).length);
  assert.ok(salesDraftIssues([draft(), draft()]).some((issue) => issue.field === 'sales-lines'));
  const eight = Array.from({ length: 8 }, () => draft({ id: crypto.randomUUID() }));
  assert.deepEqual(salesDraftIssues(eight), []);
  assert.ok(salesDraftIssues([...eight, draft({ id: crypto.randomUUID() })]).length);
});

void test('Sales transition envelopes preserve existing targets and explicit stable retry keys', () => {
  const expected = {
    command: 'ConfirmSalesOrder',
    contract_version: 1,
    idempotency_key: key,
    target: { kind: 'sales-order', id: target },
    payload: { assessmentId: customer },
    preconditions: {},
  };
  const body = salesCommandBody('ConfirmSalesOrder', target, { assessmentId: customer }, key);
  assert.deepEqual(JSON.parse(body), expected);
  assert.equal(
    salesCommandBody('ConfirmSalesOrder', target, { assessmentId: customer }, key),
    body,
  );
  const record = JSON.parse(salesCommandBody('RecordFulfillmentMake', target, {}, key)) as {
    target: { kind: string; id: string };
  };
  assert.deepEqual(record.target, { kind: 'fulfillment-assessment', id: target });
  assert.throws(() => salesCommandBody('SubmitSalesOrder', '', {}, key));
});

void test('Full serialized Sales command checks UTF-8 size before dispatch without truncating accepted data', () => {
  const text = 'ر'.repeat(2000);
  assert.throws(
    () =>
      salesCommandBody('DraftSalesOrder', target, { customerId: customer, description: text }, key),
    /۴۰۹۶/u,
  );
  const items = Array.from({ length: 8 }, () => ({
    id: crypto.randomUUID(),
    type: 'SHEET',
    description: 'ر'.repeat(64),
    demandedKg: '99999999999999999999',
    allowPartialShipment: false,
  }));
  const body = salesCommandBody('DraftSalesOrder', target, { customerId: customer, items }, key);
  assert.ok(Buffer.byteLength(body, 'utf8') <= 4096);
  assert.deepEqual((JSON.parse(body) as { payload: { items: typeof items } }).payload.items, items);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { BusinessRejection } from '@navard/shared-kernel';
import { Kg } from '../../src/modules/inventory/index.js';

function invariant(error: unknown): boolean {
  return error instanceof BusinessRejection && error.rejection.family === 'GUARD_INVARIANT';
}

void test('kg strings preserve exact decimal quantities beyond JS integer precision', () => {
  for (const value of [
    '0',
    '1',
    '-1',
    '9007199254740993',
    '99999999999999999999.999999999999999999',
    '-99999999999999999999.999999999999999999',
    '0.000000000000000001',
    '-0.000000000000000001',
    '12345678901234567890.123456789012345678',
  ]) {
    assert.equal(Kg.parse(value).toString(), value);
  }
  assert.equal(Kg.parse('1.230000').toString(), '1.23');
  assert.equal(Kg.parse('0.000000000000000000').toString(), '0');
  assert.equal(Kg.zero().toString(), '0');
  assert.ok(Object.isFrozen(Kg.zero()));
});

void test('kg arithmetic neither rounds nor converts stock quantities to floating point', () => {
  assert.equal(Kg.parse('0.1').add(Kg.parse('0.2')).toString(), '0.3');
  assert.equal(
    Kg.parse('1').subtract(Kg.parse('0.999999999999999999')).toString(),
    '0.000000000000000001',
  );
  assert.equal(Kg.parse('9007199254740993').add(Kg.parse('1')).toString(), '9007199254740994');
  assert.equal(Kg.parse('-0.1').subtract(Kg.parse('0.2')).toString(), '-0.3');
  assert.equal(Kg.parse('-1').add(Kg.parse('1')).toString(), '0');
  assert.equal(Kg.parse('0.000000000000000001').compare(Kg.zero()), 1);
  assert.equal(Kg.parse('-0.000000000000000001').compare(Kg.zero()), -1);
  assert.equal(Kg.parse('1.000').compare(Kg.parse('1')), 0);
});

void test('kg input rejects coercion, malformed notation, precision loss and negative zero', () => {
  const invalid: unknown[] = [
    null,
    undefined,
    1,
    1n,
    {},
    [],
    '',
    ' 1',
    '1 ',
    '1\n',
    '1\r\n',
    '+1',
    '.5',
    '1.',
    '01',
    '-01',
    '00.1',
    '1e3',
    'NaN',
    'Infinity',
    '١',
    '１',
    '1,5',
    '1_000',
    '\u00001',
    '-0',
    '-0.000',
    '0.0000000000000000001',
    '100000000000000000000',
    '-100000000000000000000',
    '9'.repeat(1000),
  ];
  for (const value of invalid) {
    assert.throws(() => Kg.parse(value as string), invariant);
  }
});

void test('kg capacity overflow rejects instead of rounding or truncating arithmetic results', () => {
  const maximum = Kg.parse('99999999999999999999.999999999999999999');
  const minimum = Kg.parse('-99999999999999999999.999999999999999999');
  const quantum = Kg.parse('0.000000000000000001');
  assert.throws(() => maximum.add(quantum), invariant);
  assert.throws(() => minimum.subtract(quantum), invariant);
  assert.throws(() => maximum.subtract(minimum), invariant);
  assert.throws(() => minimum.add(minimum), invariant);
  assert.equal(maximum.subtract(quantum).toString(), '99999999999999999999.999999999999999998');
  assert.equal(maximum.add(minimum).toString(), '0');
});

void test('kg operations reject forged value objects without exposing unsafe input', () => {
  const forged = Object.create(Kg.prototype) as Kg;
  for (const value of [forged, null, {}, '1']) {
    assert.throws(() => Kg.zero().add(value as Kg), invariant);
    assert.throws(() => Kg.zero().subtract(value as Kg), invariant);
    assert.throws(() => Kg.zero().compare(value as Kg), invariant);
  }
  assert.throws(
    () => Kg.parse('unsafe payload'),
    (error: unknown) =>
      invariant(error) && error instanceof Error && !error.message.includes('unsafe payload'),
  );
});

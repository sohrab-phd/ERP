import assert from 'node:assert/strict';
import test from 'node:test';
import { BusinessRejection } from '@navard/shared-kernel';
import {
  assertDimension,
  assertInboundText,
  assertUnitInteger,
  derivedOrderLineWeightKg,
  JALALI_CALENDAR_PROFILE,
  JALALI_LEAP_YEARS,
  normalizeOrderReference,
  parseJalaliDate,
} from '../../src/modules/procurement/index.js';

// Independently verified source-star/color oracle, not generated from application data.
// UT PDF SHA256 d897b960b46992226502a21e24c604db9f87cf68fa43f8df368316bee386475e.
// One bit per consecutive year1206..1498; reviewed original11pages,293rows,71leaps.
const sourceYearFlags =
  '00001000100010001000100010001000100001000100010001000100010001000100001000100010001000100010001000100001000100010001000100010001000100001000100010001000100010001000100001000100010001000100010001000100001000100010001000100010001000100001000100010001000100010001000100001000100010001000100010001';
const rejectsInvariant = (error: unknown) =>
  error instanceof BusinessRejection && error.rejection.family === 'GUARD_INVARIANT';

function date(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

await test('A08/A09: all293 independently sourced Jalali year flags and every admitted day', () => {
  assert.equal(JALALI_CALENDAR_PROFILE, 'UT-JALALI-1206-1498-v1');
  assert.equal(sourceYearFlags.length, 293);
  const sourceLeaps = [...sourceYearFlags].flatMap((flag, index) =>
    flag === '1' ? [1206 + index] : [],
  );
  assert.equal(sourceLeaps.length, 71);
  assert.deepEqual(JALALI_LEAP_YEARS, sourceLeaps);
  assert.equal(Object.isFrozen(JALALI_LEAP_YEARS), true);
  let validDays = 0;
  for (let year = 1206; year <= 1498; year++) {
    const leap = sourceYearFlags[year - 1206] === '1';
    for (let month = 1; month <= 12; month++) {
      const maximum = month <= 6 ? 31 : month <= 11 ? 30 : leap ? 30 : 29;
      for (let day = 1; day <= maximum; day++) {
        const input = date(year, month, day);
        const parsed = parseJalaliDate(input);
        assert.deepEqual(parsed, { year, month, day }, input);
        assert.equal(date(parsed.year, parsed.month, parsed.day), input);
        assert.equal(Object.isFrozen(parsed), true);
        validDays++;
      }
      for (const day of [0, maximum + 1])
        assert.throws(() => parseJalaliDate(date(year, month, day)), rejectsInvariant);
    }
    assert.throws(() => parseJalaliDate(date(year, 0, 1)), rejectsInvariant);
    assert.throws(() => parseJalaliDate(date(year, 13, 1)), rejectsInvariant);
  }
  assert.equal(validDays, 293 * 365 + 71);
});

await test('A08/A09: official boundaries, syntax, unsupported profile and no timezone conversion', () => {
  for (const input of ['1206-01-01', '1498-12-30', '1395-12-30', '1403-12-30']) {
    const parsed = parseJalaliDate(input);
    assert.equal(date(parsed.year, parsed.month, parsed.day), input);
  }
  for (const input of ['1394-12-30', '1404-12-30', '1403-07-31', '1403-00-01', '1403-01-00'])
    assert.throws(() => parseJalaliDate(input), rejectsInvariant);
  for (const input of ['1205-01-01', '1499-01-01'])
    assert.throws(
      () => parseJalaliDate(input),
      (error: unknown) =>
        rejectsInvariant(error) &&
        error instanceof BusinessRejection &&
        error.rejection.message === 'I1_DATE_OUTSIDE_PROFILE',
    );
  for (const input of [
    null,
    undefined,
    14030101,
    '',
    '۱۴۰۳-۰۱-۰۱',
    '1403-1-01',
    '1403/01/01',
    '+1403-01-01',
    ' 1403-01-01',
    '1403-01-01 ',
    '1403-01-01T00:00:00Z',
  ])
    assert.throws(() => parseJalaliDate(input), rejectsInvariant);
  for (const suffix of ['\n', '\r', '\r\n', '\u2028', '\u2029', '\0'])
    assert.throws(() => parseJalaliDate('1403-01-01' + suffix), rejectsInvariant);
});

await test('R1-T01..T05: exactly48 explicit character mappings and ordinary boundary spaces', () => {
  for (let code = 0x41; code <= 0x5a; code++)
    assert.equal(
      normalizeOrderReference(String.fromCodePoint(code)),
      String.fromCodePoint(code + 0x20),
    );
  for (let digit = 0; digit <= 9; digit++) {
    assert.equal(normalizeOrderReference(String.fromCodePoint(0x06f0 + digit)), digit.toString());
    assert.equal(normalizeOrderReference(String.fromCodePoint(0x0660 + digit)), digit.toString());
    assert.equal(normalizeOrderReference(digit.toString()), digit.toString());
  }
  assert.equal(normalizeOrderReference('\u064a'), '\u06cc');
  assert.equal(normalizeOrderReference('\u0643'), '\u06a9');
  const raw = '  PO-۱۲-١٢-كالا-ي  ';
  assert.equal(normalizeOrderReference(raw), 'po-12-12-کالا-ی');
  assert.equal(raw, '  PO-۱۲-١٢-كالا-ي  ');
  assert.equal(normalizeOrderReference('PO-1 2'), 'po-1 2');
  assert.equal(normalizeOrderReference('   '), '');
  assert.equal(normalizeOrderReference(''), '');
});

await test('R1-T05/T12: unapproved punctuation, zero, Unicode and internal whitespace remain significant', () => {
  const distinct = [
    ['PO-012', 'PO-12'],
    ['PO-12', 'PO12'],
    ['PO/12', 'PO-12'],
    ['PO-1 2', 'PO-12'],
    ['PO-1  2', 'PO-1 2'],
    ['PO–12', 'PO-12'],
    ['\u00a0PO-12', 'PO-12'],
    ['PO-12\u00a0', 'PO-12'],
    ['\u200bPO-12', 'PO-12'],
    ['PO\u200c-12', 'PO-12'],
    ['PO\u200d-12', 'PO-12'],
    ['\tPO-12', 'PO-12'],
    ['PO-12\n', 'PO-12'],
    ['\ufeffPO-12', 'PO-12'],
    ['ＰＯ-１２', 'PO-12'],
    ['é-12', 'e\u0301-12'],
    ['Ä-12', 'ä-12'],
    ['ى-12', 'ی-12'],
    ['ﮎ-12', 'ک-12'],
    ['PO_12', 'PO-12'],
  ];
  for (const [left, right] of distinct) {
    assert.ok(left !== undefined && right !== undefined);
    assert.notEqual(normalizeOrderReference(left), normalizeOrderReference(right));
  }
  for (const raw of ['A\u00a0B', 'a\u200cb', '🙂-۱۲', 'é-١٢', 'کالا-12'])
    assert.equal(
      normalizeOrderReference(normalizeOrderReference(raw)),
      normalizeOrderReference(raw),
    );
});

await test('A13/D14: Unicode scalar and UTF8 budgets preserve exact valid text', () => {
  for (const value of [
    'x',
    '  label  ',
    'ی'.repeat(128),
    '🙂'.repeat(128),
    'e\u0301',
    '\u200c',
    '\u00a0A\u00a0',
    '<script>"\\</script>',
  ]) {
    const original = value;
    assertInboundText(value);
    assert.equal(value, original);
  }
  for (const value of [
    undefined,
    null,
    5,
    {},
    [],
    '',
    'a'.repeat(129),
    'ی'.repeat(129),
    '🙂'.repeat(129),
    '\ud800',
    '\udfff',
  ])
    assert.throws(() => assertInboundText(value), rejectsInvariant);
  const blank = [
    0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20, 0xa0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004,
    0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff,
  ];
  for (const code of blank)
    assert.throws(() => assertInboundText(String.fromCodePoint(code)), rejectsInvariant);
  for (const code of [
    ...Array.from({ length: 32 }, (_, n) => n),
    ...Array.from({ length: 33 }, (_, n) => 0x7f + n),
  ])
    assert.throws(
      () => assertInboundText('a' + String.fromCodePoint(code) + 'b'),
      rejectsInvariant,
    );
  for (const label of ['PO', 'po', 'ک', 'ك', 'ی', 'ي', '1', '۱', '١', ' x', 'x ', 'é', 'e\u0301'])
    assertInboundText(label); // validation is deliberately not catalogue normalization.
});

await test('A06: exact dimensions retain20/18 source lexemes without rounding or unit conversion', () => {
  for (const value of [
    '1',
    '1.200',
    '0.000000000000000001',
    '99999999999999999999',
    '99999999999999999999.999999999999999999',
    '0.35',
  ]) {
    const source = value;
    assertDimension(value);
    assert.equal(value, source);
  }
  for (const value of [
    undefined,
    null,
    1,
    1n,
    '',
    '0',
    '0.000',
    '-1',
    '+1',
    '01',
    '00.1',
    '.1',
    '1.',
    '1e3',
    '1,000',
    '1/2',
    '۱',
    'NaN',
    'Infinity',
    '100000000000000000000',
    '0.0000000000000000001',
    ' 1',
    '1 ',
  ])
    assert.throws(() => assertDimension(value), rejectsInvariant);
  for (const suffix of ['\n', '\r', '\r\n', '\u2028', '\u2029', '\0'])
    assert.throws(() => assertDimension('1' + suffix), rejectsInvariant);
  assert.throws(() => assertDimension('9'.repeat(100000)), rejectsInvariant);
});

await test('A07: whole W1/count limits and separate derived totals beyond stock capacity stay exact', () => {
  for (const value of [
    '1',
    '2000',
    '9007199254740993',
    '9223372036854775808',
    '99999999999999999999',
  ])
    assertUnitInteger(value);
  for (const value of [
    undefined,
    null,
    1,
    1n,
    '',
    '0',
    '-1',
    '+1',
    '01',
    '1.0',
    '1e2',
    '۱',
    '١',
    '100000000000000000000',
    ' 1',
    '1 ',
  ])
    assert.throws(() => assertUnitInteger(value), rejectsInvariant);
  for (const suffix of ['\n', '\r', '\r\n', '\u2028', '\u2029', '\0'])
    assert.throws(() => assertUnitInteger('1' + suffix), rejectsInvariant);
  assert.throws(() => assertUnitInteger('9'.repeat(100000)), rejectsInvariant);
  assert.equal(derivedOrderLineWeightKg('2000', '5'), '10000');
  assert.equal(derivedOrderLineWeightKg('10000000000000000000', '10'), '100000000000000000000');
  assert.equal(
    derivedOrderLineWeightKg('99999999999999999999', '99999999999999999999'),
    '9999999999999999999800000000000000000001',
  );
  assert.throws(() => derivedOrderLineWeightKg('0', '1'), rejectsInvariant);
  assert.throws(() => derivedOrderLineWeightKg('1', '1.5'), rejectsInvariant);
});

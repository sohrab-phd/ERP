import assert from 'node:assert/strict';
import test from 'node:test';
import { textValue } from '../../src/operator/display.js';
void test('P1 display preserves literal source text, exact numbers and missing-versus-confirmed-absent actual values', () => {
  for (const source of [
    'SAME',
    'CHANGED',
    'ACT-WH',
    'constructor',
    '__proto__',
    'jalali',
    '  RAL-۱۲  ',
    '99999999999999999999.123456789012345678',
  ]) {
    for (const field of ['orderReference', 'itemNumber', 'ralColorNumber', 'widthM', 'label'])
      assert.equal(textValue(source, field), source);
  }
  assert.equal(textValue({ optionId: 'identity', label: 'ACT-WH' }), 'ACT-WH');
  assert.equal(textValue('SAME', 'state'), 'مطابق');
  assert.equal(textValue('ACT-WH', 'role'), 'انبار');
  assert.equal(textValue('constructor', 'state'), 'constructor');
  assert.equal(textValue(undefined), 'ثبت نشده');
  assert.equal(textValue(null, 'weightEvidenceReference'), 'ثبت نشده');
  assert.equal(textValue(null, 'color', true), 'صریحاً بدون مقدار');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, parseBoundedJson, InvalidJson, JSON_LIMITS } from '../../src/index.js';
void test('UTF-8 canonical ordering and exact scalars/control escaping', () => {
  const value = parseBoundedJson('{"z":-0,"é":"\\n\\t\\u0000","a":"x","😀":"😀","ä":"ä"}');
  assert.equal(
    canonicalJson(value).toString(),
    '{"a":"x","z":0,"ä":"ä","é":"\\u000a\\u0009\\u0000","😀":"😀"}',
  );
});
void test('object order equivalent; array order and null/absence remain distinct', () => {
  assert.deepEqual(
    canonicalJson(parseBoundedJson('{"b":2,"a":1}')),
    canonicalJson(parseBoundedJson('{"a":1,"b":2}')),
  );
  assert.notDeepEqual(canonicalJson([1, 2]), canonicalJson([2, 1]));
  assert.notDeepEqual(canonicalJson({ a: null }), canonicalJson({}));
});
void test('duplicate and escaped-equivalent object names rejected at every depth', () => {
  for (const body of ['{"a":1,"a":2}', '{"nested":{"a":1,"\\u0061":2}}', '[{"a":1,"a":2}]']) {
    assert.throws(() => parseBoundedJson(body), InvalidJson);
  }
});
void test('lexical safe integers checked before conversion; exponent/fraction not admitted', () => {
  for (const body of [
    '9007199254740992',
    '-9007199254740992',
    '1.0',
    '1e0',
    '01',
    '+1',
    'NaN',
    'Infinity',
    '-',
  ]) {
    assert.throws(() => parseBoundedJson(body), InvalidJson);
  }
  assert.equal(parseBoundedJson('9007199254740991'), Number.MAX_SAFE_INTEGER);
  assert.equal(parseBoundedJson('-9007199254740991'), Number.MIN_SAFE_INTEGER);
  assert.equal(parseBoundedJson('-0'), 0);
});
void test('unpaired scalar Unicode, illegal UTF-8 and BOM refused', () => {
  for (const value of ['"\\ud800"', '"\\udfff"', '"\ud800"', '\ufeff{}']) {
    assert.throws(() => parseBoundedJson(value), InvalidJson);
  }
  assert.throws(() => parseBoundedJson(Uint8Array.from([0xff])), InvalidJson);
  assert.equal(parseBoundedJson('"\\ud83d\\ude00"'), '😀');
});
void test('malformed JSON delimiters, escape, whitespace and trailing tokens refused', () => {
  for (const value of [
    '{"a":1,}',
    '[1,]',
    'true false',
    '{"a" 1}',
    '"\\x"',
    '{',
    '[',
    '"a\n"',
    '\u00a0{}',
  ]) {
    assert.throws(() => parseBoundedJson(value), InvalidJson);
  }
  assert.deepEqual(parseBoundedJson(' \n\t{"a":1}\r '), { a: 1 });
});
void test('depth, total entries, body, string and canonical limits enforced', () => {
  assert.throws(() => parseBoundedJson('['.repeat(32) + '0' + ']'.repeat(32)), InvalidJson);
  assert.equal(canonicalJson(parseBoundedJson('['.repeat(31) + '0' + ']'.repeat(31))).length, 63);
  assert.throws(
    () => parseBoundedJson(JSON.stringify(Array.from({ length: 10_001 }, () => 0))),
    InvalidJson,
  );
  assert.throws(() => parseBoundedJson(' '.repeat(JSON_LIMITS.bodyBytes + 1)), InvalidJson);
  assert.throws(
    () => parseBoundedJson(JSON.stringify('x'.repeat(JSON_LIMITS.stringBytes + 1))),
    InvalidJson,
  );
  assert.throws(() => canonicalJson({ a: '123' }, 5), InvalidJson);
});
void test('prototype names preserved as data; Unicode normalization is never implicit', () => {
  const parsed = parseBoundedJson('{"__proto__":{"polluted":true}}');
  assert.equal(Object.getPrototypeOf(parsed), Object.prototype);
  assert.equal(({} as Record<string, unknown>)['polluted'], undefined);
  assert.equal(canonicalJson(parsed).toString(), '{"__proto__":{"polluted":true}}');
  assert.notDeepEqual(canonicalJson('é'), canonicalJson('e\u0301'));
});
void test('in-process invalid numeric values and unsupported objects refused', () => {
  for (const value of [0.1, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => canonicalJson(value), InvalidJson);
  }
  assert.throws(() => canonicalJson(new Date() as never), InvalidJson);
  assert.throws(() => canonicalJson({ a: undefined } as never), InvalidJson);
});

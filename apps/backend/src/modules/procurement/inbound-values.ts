import { Buffer } from 'node:buffer';
import { BusinessRejection, validUnicode } from '@navard/shared-kernel';

export const JALALI_CALENDAR_PROFILE = 'UT-JALALI-1206-1498-v1';

/** Frozen University of Tehran source markers; see the I1 calendar source receipt. */
export const JALALI_LEAP_YEARS: readonly number[] = Object.freeze([
  1210, 1214, 1218, 1222, 1226, 1230, 1234, 1238, 1243, 1247, 1251, 1255, 1259, 1263, 1267, 1271,
  1276, 1280, 1284, 1288, 1292, 1296, 1300, 1304, 1309, 1313, 1317, 1321, 1325, 1329, 1333, 1337,
  1342, 1346, 1350, 1354, 1358, 1362, 1366, 1370, 1375, 1379, 1383, 1387, 1391, 1395, 1399, 1403,
  1408, 1412, 1416, 1420, 1424, 1428, 1432, 1436, 1441, 1445, 1449, 1453, 1457, 1461, 1465, 1469,
  1474, 1478, 1482, 1486, 1490, 1494, 1498,
]);
const leapYears = new Set(JALALI_LEAP_YEARS);

function invalid(message: string): never {
  throw new BusinessRejection({ family: 'GUARD_INVARIANT', message });
}

/** R1 changes only a comparison working copy; callers retain the original string. */
export function normalizeOrderReference(raw: string): string {
  let start = 0;
  let end = raw.length;
  while (start < end && raw.charCodeAt(start) === 0x20) start++;
  while (end > start && raw.charCodeAt(end - 1) === 0x20) end--;
  let key = '';
  for (const character of raw.slice(start, end)) {
    const code = character.codePointAt(0)!;
    if (code >= 0x41 && code <= 0x5a) key += String.fromCodePoint(code + 0x20);
    else if (code >= 0x06f0 && code <= 0x06f9) key += String.fromCodePoint(code - 0x06f0 + 0x30);
    else if (code >= 0x0660 && code <= 0x0669) key += String.fromCodePoint(code - 0x0660 + 0x30);
    else if (code === 0x064a) key += '\u06cc';
    else if (code === 0x0643) key += '\u06a9';
    else key += character;
  }
  return key;
}

/** The frozen blank/Cc predicate validates without trimming or rewriting values. */
export function assertInboundText(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    !validUnicode(value) ||
    Buffer.byteLength(value, 'utf8') > 512 ||
    [...value].length > 128 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(value) ||
    !/[^\u0009-\u000d\u0020\u00a0\u1680\u2000-\u200a\u2028-\u2029\u202f\u205f\u3000\ufeff]/u.test(
      value,
    )
  )
    invalid('Invalid inbound text');
}

/** Exact positive source lexemes; a final newline is never a permitted suffix. */
export function assertDimension(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length > 39 ||
    !/^(?:0|[1-9][0-9]{0,19})(?:\.[0-9]{1,18})?(?![\s\S])/u.test(value) ||
    !/[1-9]/u.test(value)
  )
    invalid('Invalid inbound dimension');
}

export function assertUnitInteger(value: unknown): asserts value is string {
  if (typeof value !== 'string' || value.length > 20 || !/^[1-9][0-9]{0,19}(?![\s\S])/u.test(value))
    invalid('Invalid inbound whole-unit value');
}

export function parseJalaliDate(value: unknown): { year: number; month: number; day: number } {
  if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}(?![\s\S])/u.test(value))
    invalid('Invalid inbound Jalali date');
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1206 || year > 1498) invalid('I1_DATE_OUTSIDE_PROFILE');
  const maxDay = month <= 6 ? 31 : month <= 11 ? 30 : leapYears.has(year) ? 30 : 29;
  if (month < 1 || month > 12 || day < 1 || day > maxDay) invalid('Invalid inbound Jalali date');
  return Object.freeze({ year, month, day });
}

/** Procurement evidence total only: never an Inventory Kg or stock effect. */
export function derivedOrderLineWeightKg(weight: string, count: string): string {
  assertUnitInteger(weight);
  assertUnitInteger(count);
  return (BigInt(weight) * BigInt(count)).toString();
}

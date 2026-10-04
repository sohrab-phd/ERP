import { Buffer } from 'node:buffer';
export type JsonValue = null | boolean | number | string | JsonObject | readonly JsonValue[];
export interface JsonObject {
  readonly [name: string]: JsonValue;
}
export const JSON_LIMITS = Object.freeze({
  bodyBytes: 256 * 1024,
  canonicalBytes: 256 * 1024,
  resultBytes: 256 * 1024,
  stringBytes: 64 * 1024,
  depth: 32,
  entries: 10_000,
});
export class InvalidJson extends Error {
  constructor() {
    super('Invalid bounded JSON');
    this.name = 'InvalidJson';
  }
}
export function validUnicode(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = value.charCodeAt(++i);
      if (!(n >= 0xdc00 && n <= 0xdfff)) return false;
    } else if (c >= 0xdc00 && c <= 0xdfff) return false;
  }
  return true;
}
function checkString(value: string): void {
  if (!validUnicode(value) || Buffer.byteLength(value, 'utf8') > JSON_LIMITS.stringBytes)
    throw new InvalidJson();
}
/** Detect duplicate names and reject unsafe numbers BEFORE conversion. No JSON.parse object rounding. */
export function parseBoundedJson(input: string | Uint8Array): JsonValue {
  if (typeof input === 'string' && !validUnicode(input)) throw new InvalidJson();
  const bytes = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  if (bytes.byteLength > JSON_LIMITS.bodyBytes) throw new InvalidJson();
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new InvalidJson();
  }
  let offset = 0,
    entries = 0;
  const fail = (): never => {
    throw new InvalidJson();
  };
  const whitespace = (): void => {
    while (offset < text.length && /[\x20\x09\x0a\x0d]/u.test(text[offset] ?? '')) offset++;
  };
  const string = (): string => {
    if (text[offset++] !== '"') return fail();
    const start = offset - 1;
    for (;;) {
      if (offset >= text.length) return fail();
      const c = text.charCodeAt(offset++);
      if (c === 0x22) break;
      if (c < 0x20) return fail();
      if (c === 0x5c) {
        const escape = text[offset++];
        if (escape === 'u') {
          if (!/^[0-9a-fA-F]{4}$/u.test(text.slice(offset, offset + 4))) return fail();
          offset += 4;
        } else if (escape === undefined || !'"\\/bfnrt'.includes(escape)) return fail();
      }
    }
    let result: unknown;
    try {
      result = JSON.parse(text.slice(start, offset)) as unknown;
    } catch {
      return fail();
    }
    if (typeof result !== 'string') return fail();
    checkString(result);
    return result;
  };
  const count = (): void => {
    if (++entries > JSON_LIMITS.entries) fail();
  };
  const value = (depth: number): JsonValue => {
    if (depth > JSON_LIMITS.depth) return fail();
    whitespace();
    const c = text[offset];
    if (c === '"') return string();
    if (c === '{') {
      offset++;
      const object: Record<string, JsonValue> = {},
        names = new Set<string>();
      whitespace();
      if (text[offset] === '}') {
        offset++;
        return object;
      }
      for (;;) {
        whitespace();
        const name = string();
        if (names.has(name)) return fail();
        names.add(name);
        count();
        whitespace();
        if (text[offset++] !== ':') return fail();
        Object.defineProperty(object, name, {
          value: value(depth + 1),
          enumerable: true,
          writable: false,
          configurable: false,
        });
        whitespace();
        const end = text[offset++];
        if (end === '}') return object;
        if (end !== ',') return fail();
      }
    }
    if (c === '[') {
      offset++;
      const array: JsonValue[] = [];
      whitespace();
      if (text[offset] === ']') {
        offset++;
        return array;
      }
      for (;;) {
        count();
        array.push(value(depth + 1));
        whitespace();
        const end = text[offset++];
        if (end === ']') return array;
        if (end !== ',') return fail();
      }
    }
    for (const [literal, decoded] of [
      ['true', true],
      ['false', false],
      ['null', null],
    ] as const) {
      if (text.startsWith(literal, offset)) {
        offset += literal.length;
        return decoded;
      }
    }
    const number = /^-?(?:0|[1-9][0-9]*)/u.exec(text.slice(offset))?.[0];
    if (number === undefined) return fail();
    offset += number.length;
    if (/[.eE0-9]/u.test(text[offset] ?? '')) return fail();
    const integer = BigInt(number);
    if (integer < -9007199254740991n || integer > 9007199254740991n) return fail();
    return Number(integer);
  };
  const result = value(1);
  whitespace();
  if (offset !== text.length) fail();
  return result;
}
function quote(value: string): string {
  checkString(value);
  let result = '"';
  for (const c of value) {
    const point = c.codePointAt(0);
    if (c === '"') result += '\\"';
    else if (c === '\\') result += '\\\\';
    else if (point !== undefined && point < 0x20)
      result += '\\u' + point.toString(16).padStart(4, '0');
    else result += c;
  }
  return result + '"';
}
/** COMMAND_CANONICAL_V1: unsigned UTF-8 ordering, no Unicode normalization. */
export function canonicalJson(
  value: JsonValue,
  limit: number = JSON_LIMITS.canonicalBytes,
): Buffer {
  let entries = 0;
  const encode = (node: JsonValue, depth: number): string => {
    if (depth > JSON_LIMITS.depth) throw new InvalidJson();
    if (node === null) return 'null';
    if (typeof node === 'boolean') return node ? 'true' : 'false';
    if (typeof node === 'number') {
      if (!Number.isSafeInteger(node)) throw new InvalidJson();
      return Object.is(node, -0) ? '0' : String(node);
    }
    if (typeof node === 'string') return quote(node);
    if (typeof node !== 'object') throw new InvalidJson();
    if (Array.isArray(node)) {
      entries += node.length;
      if (entries > JSON_LIMITS.entries) throw new InvalidJson();
      return (
        '[' +
        (node as readonly JsonValue[]).map((child) => encode(child, depth + 1)).join(',') +
        ']'
      );
    }
    if (Object.getPrototypeOf(node) !== Object.prototype && Object.getPrototypeOf(node) !== null)
      throw new InvalidJson();
    const names = Object.keys(node).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
    entries += names.length;
    if (entries > JSON_LIMITS.entries) throw new InvalidJson();
    return (
      '{' +
      names
        .map((name) => {
          const child = (node as JsonObject)[name];
          if (child === undefined) throw new InvalidJson();
          return quote(name) + ':' + encode(child, depth + 1);
        })
        .join(',') +
      '}'
    );
  };
  let text: string;
  try {
    text = encode(value, 1);
  } catch {
    throw new InvalidJson();
  }
  const result = Buffer.from(text, 'utf8');
  if (result.byteLength > limit) throw new InvalidJson();
  return result;
}
export function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function freezeJson<T extends JsonValue>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) freezeJson(child);
    Object.freeze(value);
  }
  return value;
}

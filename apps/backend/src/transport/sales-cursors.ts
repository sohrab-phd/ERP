import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { canonicalJson, validUuid, type JsonObject } from '@navard/shared-kernel';
import { SalesReadError } from '../modules/sales/index.js';

export class SalesReadCursors {
  constructor(
    private readonly secret: string,
    private readonly origin: string,
    private readonly clock: () => number = Date.now,
  ) {}
  binding(value: unknown): string {
    return createHash('sha256')
      .update(canonicalJson(value as JsonObject))
      .digest('base64url');
  }
  private signature(payload: string): string {
    return createHmac('sha256', this.secret)
      .update(JSON.stringify(['sales-browser-read-v1', this.origin, payload]))
      .digest('base64url');
  }
  read(cursor: string | undefined, binding: string): { afterId?: string; issuedAt: number } {
    if (!cursor) return { issuedAt: this.clock() };
    try {
      if (cursor.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/u.test(cursor))
        throw new Error();
      const [payload, mac] = cursor.split('.');
      const expected = this.signature(payload!);
      if (!timingSafeEqual(Buffer.from(expected), Buffer.from(mac!))) throw new Error();
      const raw = Buffer.from(payload!, 'base64url');
      if (raw.toString('base64url') !== payload) throw new Error();
      const value = JSON.parse(raw.toString('utf8')) as {
        v: number;
        b: string;
        after: string;
        iat: number;
      };
      if (
        value.v !== 1 ||
        value.b !== binding ||
        !validUuid(value.after) ||
        !Number.isSafeInteger(value.iat) ||
        value.iat > this.clock() ||
        this.clock() - value.iat >= 600000
      )
        throw new Error();
      return { afterId: value.after, issuedAt: value.iat };
    } catch {
      throw new SalesReadError(400, 'invalid-cursor');
    }
  }
  next(afterId: string, issuedAt: number, binding: string): string {
    const payload = Buffer.from(
      JSON.stringify({ v: 1, b: binding, after: afterId, iat: issuedAt }),
    ).toString('base64url');
    return payload + '.' + this.signature(payload);
  }
}

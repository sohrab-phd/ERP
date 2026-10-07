import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { validUnicode } from '@navard/shared-kernel';
import { IdentityError } from './contracts.js';

const parameters = { N: 131_072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
const prefix = 'scrypt$v=1$N=131072,r=8,p=1$';
const format = /^scrypt\$v=1\$N=131072,r=8,p=1\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{43})$/u;
let active = 0;

/** Bound native memory use; never queue attacker-controlled credential work. */
async function derive(password: string, salt: Buffer): Promise<Buffer> {
  if (active >= 2) throw new IdentityError('busy');
  active++;
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 32, parameters, (error, key) => {
        if (error) reject(new IdentityError('busy'));
        else resolve(key);
      });
    });
  } finally {
    active--;
  }
}

export function validatePassword(password: unknown): asserts password is string {
  if (
    typeof password !== 'string' ||
    password.length > 128 ||
    Buffer.byteLength(password, 'utf8') > 128 ||
    !validUnicode(password) ||
    [...password].length < 15
  )
    throw new IdentityError('invalid');
}

export async function hashPassword(password: string): Promise<string> {
  validatePassword(password);
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `${prefix}${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (
    typeof password !== 'string' ||
    password.length > 128 ||
    Buffer.byteLength(password, 'utf8') > 128 ||
    !validUnicode(password) ||
    typeof encoded !== 'string'
  )
    return false;
  const match = format.exec(encoded);
  if (!match) return false;
  const saltText = match[1]!,
    keyText = match[2]!;
  const salt = Buffer.from(saltText, 'base64url'),
    expected = Buffer.from(keyText, 'base64url');
  if (salt.toString('base64url') !== saltText || expected.toString('base64url') !== keyText)
    return false;
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, expected);
}

/** Same fixed-cost KDF for unknown names. This value is never a provisioned credential. */
export const DUMMY_PASSWORD_HASH = `${prefix}AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;

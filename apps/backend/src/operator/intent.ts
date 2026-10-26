export interface Intent {
  accountId: string;
  personId: string;
  role: 'ACT-PROC' | 'ACT-WH';
  path: string;
  body: string;
}
export const pendingSlot = 'navard-p1-pending-v1';
const aad = new TextEncoder().encode(pendingSlot);
function from64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value.replace(/-/gu, '+').replace(/_/gu, '/')), (c) =>
    c.charCodeAt(0),
  );
}
function to64(value: Uint8Array): string {
  let result = '';
  for (const byte of value) result += String.fromCharCode(byte);
  return btoa(result);
}
async function key(value: string) {
  return crypto.subtle.importKey('raw', from64(value), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
/** One encrypted unresolved intent per tab, persisted before dispatch; never a command queue. */
export async function sealIntent(intent: Intent, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    await key(secret),
    new TextEncoder().encode(JSON.stringify(intent)),
  );
  return JSON.stringify({ version: 1, iv: to64(iv), ciphertext: to64(new Uint8Array(encrypted)) });
}
export async function openIntent(value: string, secret: string): Promise<Intent> {
  if (value.length > 800000) throw new Error('Invalid recovery data');
  const data = JSON.parse(value) as { version: number; iv: string; ciphertext: string };
  if (
    data.version !== 1 ||
    typeof data.iv !== 'string' ||
    from64(data.iv).length !== 12 ||
    typeof data.ciphertext !== 'string'
  )
    throw new Error('Invalid recovery data');
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: from64(data.iv), additionalData: aad },
    await key(secret),
    from64(data.ciphertext),
  );
  const intent = JSON.parse(new TextDecoder().decode(plain)) as Intent;
  if (
    typeof intent.accountId !== 'string' ||
    typeof intent.personId !== 'string' ||
    !['ACT-PROC', 'ACT-WH'].includes(intent.role) ||
    ![
      '/purchasing/operational-orders',
      '/purchasing/inbound-catalogues',
      '/purchasing/receiving/confirm',
    ].includes(intent.path) ||
    (intent.path === '/purchasing/receiving/confirm' && intent.role !== 'ACT-WH') ||
    typeof intent.body !== 'string'
  )
    throw new Error('Invalid recovery data');
  return Object.freeze(intent);
}
export function commandBody(command: string, kind: string, payload: unknown): string {
  return JSON.stringify({
    command,
    contract_version: 1,
    idempotency_key: crypto.randomUUID(),
    target: { kind, id: crypto.randomUUID() },
    payload,
    preconditions: {},
  });
}
/** Optional absence is exact; no trim, numeric conversion, date conversion or hidden normalization. */
export function linePayload(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
}

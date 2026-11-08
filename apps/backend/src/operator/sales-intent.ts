/** Separate namespace/AAD: existing PROC/WH ciphertext is never migrated or overwritten. */
export const salesPendingSlot = 'navard-p4b-sales-pending-v1';
const aad = new TextEncoder().encode(salesPendingSlot);
export interface SalesIntent {
  installationId: string;
  authorityScopeId: string;
  accountId: string;
  personId: string;
  role: 'ACT-SALES';
  customerId: string;
  path: '/sales/v1/commands';
  body: string;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const keyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const commands = new Map([
  ['DraftSalesOrder', 'sales-order'],
  ['SubmitSalesOrder', 'sales-order'],
  ['DraftFulfillmentAssessment', 'fulfillment-assessment'],
  ['RecordFulfillmentStock', 'fulfillment-assessment'],
  ['RecordFulfillmentMake', 'fulfillment-assessment'],
  ['ConfirmSalesOrder', 'sales-order'],
]);
const fields = [
  'installationId',
  'authorityScopeId',
  'accountId',
  'personId',
  'role',
  'customerId',
  'path',
  'body',
];
function valid(value: unknown): asserts value is SalesIntent {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid recovery');
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== fields.length ||
    fields.some((name) => !Object.hasOwn(record, name))
  )
    throw new Error('Invalid recovery');
  for (const name of ['installationId', 'authorityScopeId', 'accountId', 'personId', 'customerId'])
    if (typeof record[name] !== 'string' || !uuid.test(record[name]))
      throw new Error('Invalid recovery');
  if (
    record.role !== 'ACT-SALES' ||
    record.path !== '/sales/v1/commands' ||
    typeof record.body !== 'string' ||
    new TextEncoder().encode(record.body).length > 4096
  )
    throw new Error('Invalid recovery');
  const body = JSON.parse(record.body) as {
    command?: string;
    contract_version?: number;
    idempotency_key?: string;
    target?: { kind?: string; id?: string };
    payload?: { customerId?: string };
    preconditions?: unknown;
  };
  const target = body?.target;
  if (
    !body ||
    typeof body.command !== 'string' ||
    !commands.has(body.command) ||
    body.contract_version !== 1 ||
    typeof body.idempotency_key !== 'string' ||
    !keyUuid.test(body.idempotency_key) ||
    !target ||
    target.kind !== commands.get(body.command) ||
    typeof target.id !== 'string' ||
    !uuid.test(target.id) ||
    !body.payload ||
    typeof body.payload !== 'object' ||
    Array.isArray(body.payload) ||
    !body.preconditions ||
    typeof body.preconditions !== 'object' ||
    Array.isArray(body.preconditions) ||
    Object.keys(body.preconditions).length !== 0 ||
    (body.command === 'DraftSalesOrder' && body.payload.customerId !== record.customerId)
  )
    throw new Error('Invalid recovery');
}
function bytes(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(value)) throw new Error('Invalid recovery');
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
function base64(value: Uint8Array): string {
  let result = '';
  for (const byte of value) result += String.fromCharCode(byte);
  return btoa(result);
}
async function encryptionKey(secret: string) {
  const key = secret.replace(/-/gu, '+').replace(/_/gu, '/');
  return crypto.subtle.importKey('raw', bytes(key), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function sealSalesIntent(intent: SalesIntent, secret: string): Promise<string> {
  valid(intent);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    await encryptionKey(secret),
    new TextEncoder().encode(JSON.stringify(intent)),
  );
  return JSON.stringify({
    version: 1,
    iv: base64(iv),
    ciphertext: base64(new Uint8Array(ciphertext)),
  });
}
export async function openSalesIntent(value: string, secret: string): Promise<SalesIntent> {
  if (value.length > 12000) throw new Error('Invalid recovery');
  const record = JSON.parse(value) as { version?: number; iv?: string; ciphertext?: string };
  if (
    !record ||
    record.version !== 1 ||
    typeof record.iv !== 'string' ||
    typeof record.ciphertext !== 'string'
  )
    throw new Error('Invalid recovery');
  const iv = bytes(record.iv);
  if (iv.length !== 12) throw new Error('Invalid recovery');
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    await encryptionKey(secret),
    bytes(record.ciphertext),
  );
  const intent: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decrypted));
  valid(intent);
  return Object.freeze(intent);
}

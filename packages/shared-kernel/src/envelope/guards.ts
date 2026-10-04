export const GUARD_FAMILIES = [
  'GUARD_OPEN_POLICY',
  'GUARD_INVARIANT',
  'GUARD_ACTOR',
  'GUARD_STATE',
  'GUARD_IDEMPOTENT_DUP',
  'GUARD_CONFLICT',
  'GUARD_PORTAL_MVP',
] as const;
export type GuardFamily = (typeof GUARD_FAMILIES)[number];
export interface GuardRejection {
  readonly family: GuardFamily;
  readonly message: string;
  readonly openItem?: string;
}
export class BusinessRejection extends Error {
  constructor(readonly rejection: GuardRejection) {
    super('Command guard rejected');
    this.name = 'BusinessRejection';
  }
}
export type TechnicalKind = 'retryable' | 'uncertain' | 'incompatible';
export class TechnicalError extends Error {
  constructor(readonly kind: TechnicalKind = 'retryable') {
    super('Command infrastructure unavailable');
    this.name = 'TechnicalError';
  }
}
export function isTechnicalDatabaseError(error: unknown): boolean {
  if (error instanceof TechnicalError) return true;
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    typeof error.code !== 'string'
  )
    return false;
  const c = error.code;
  return (
    ['40P01', '40001', '57014', '55P03', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT'].includes(c) ||
    c.startsWith('08') ||
    c.startsWith('57P')
  );
}

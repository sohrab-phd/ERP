const values: Record<string, string> = {
  ORDER_LINE: 'مرتبط با خط سفارش',
  ORDER_ONLY: 'مرتبط با سفارش، بدون خط',
  UNLINKED: 'بدون ارتباط سفارش',
  'ACT-WH': 'انبار',
  'ACT-PROC': 'خرید',
  jalali: 'جلالی',
  WH_ACCEPTED_DECLARED_UNIT_WEIGHT: 'وزن اعلام‌شدهٔ هر واحد، پذیرفته‌شده توسط انبار',
  NOT_RECORDED: 'ثبت نشده',
  MATCH: 'مطابق',
  DIFFERENT: 'متفاوت',
  SAME: 'مطابق',
  CHANGED: 'متفاوت',
  CONFIRMED_ABSENT: 'نبود مقدار تأیید شده است',
};
const enumFields = new Set(['kind', 'role', 'state', 'status', 'calendar', 'weightProvenance']);
/** Translate only contract enums; original business strings must never be interpreted as codes. */
export function textValue(value: unknown, field = '', confirmedAbsent = false): string {
  if (value === undefined) return 'ثبت نشده';
  if (value === null) return confirmedAbsent ? 'صریحاً بدون مقدار' : 'ثبت نشده';
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر';
  if (typeof value === 'object')
    return 'label' in value && typeof value.label === 'string' ? value.label : 'اطلاعات مرتبط';
  if (typeof value === 'string')
    return enumFields.has(field) && Object.hasOwn(values, value) ? values[value]! : value;
  if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
  return 'ثبت نشده';
}

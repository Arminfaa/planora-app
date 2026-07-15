/**
 * Prisma MongoDB does not match missing optional fields with `{ field: null }`.
 * Use this helper for nullable DateTime/optional fields that may be unset.
 */
export function mongoNullOrUnset(field: string) {
  return {
    OR: [{ [field]: null }, { [field]: { isSet: false } }],
  };
}

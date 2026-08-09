/**
 * Helpers de conversión Decimal → number
 * Aísla Prisma.Decimal del resto de la aplicación.
 */

/**
 * Convierte un valor Decimal/number/string/null a `number | null`.
 * - null/undefined → null
 * - number → tal cual
 * - Prisma.Decimal → .toNumber()
 * - string → Number() (NaN → null)
 */
export function toNum(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  if (typeof v === 'object' && v !== null && 'toNumber' in v && typeof (v as { toNumber: unknown }).toNumber === 'function') {
    return (v as { toNumber: () => number }).toNumber()
  }
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

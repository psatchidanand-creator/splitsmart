// Amounts are stored as integer cents (or paise) to avoid floating-point errors.

const MAX_CENTS = 2_000_000_000 // keeps well inside Postgres `integer`

/** Parses user input like "12", "12.5" or "1,200.50" into cents. Returns null if invalid. */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/,/g, '').trim()
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(cleaned)
  if (!match || !/\d/.test(cleaned)) return null
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_CENTS) return null
  return cents
}

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
const wholeRupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** Formats paise as rupees with Indian digit grouping: 10000000 → "₹1,00,000", 3333 → "₹33.33". */
export function formatRupees(paise: number): string {
  return (paise % 100 === 0 ? wholeRupees : rupees).format(paise / 100)
}

/**
 * Splits `totalCents` equally between `count` people. Leftover cents go one each
 * to the first people, so the shares always add up exactly: 10000 / 3 → [3334, 3333, 3333].
 */
export function splitEqually(totalCents: number, count: number): number[] {
  const base = Math.floor(totalCents / count)
  const remainder = totalCents - base * count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}

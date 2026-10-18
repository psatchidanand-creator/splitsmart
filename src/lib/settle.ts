export type Balance = { memberId: string; name: string; netCents: number }
export type Payment = { from: Balance; to: Balance; amountCents: number }

// Exact search is 2^n; beyond this many non-zero balances fall back to greedy.
const EXACT_LIMIT = 16

/**
 * Returns the fewest payments that bring every balance to zero.
 *
 * The minimum is (people with a non-zero balance) − (most groups they can be split
 * into where each group's balances sum to zero), since each such group of size k
 * settles in k − 1 payments. We find that partition with a subset DP, then settle
 * each group greedily (largest debtor pays largest creditor).
 */
export function settleUp(balances: Balance[]): Payment[] {
  const people = balances.filter((b) => b.netCents !== 0)
  if (people.length === 0) return []
  if (people.length > EXACT_LIMIT) return settleGreedy(people)

  const n = people.length
  const full = (1 << n) - 1
  const sum = new Array<number>(full + 1).fill(0)
  for (let mask = 1; mask <= full; mask++) {
    const low = 31 - Math.clz32(mask & -mask)
    sum[mask] = sum[mask & (mask - 1)] + people[low].netCents
  }

  // best[mask] = most zero-sum groups the people in `mask` can be split into
  const best = new Array<number>(full + 1).fill(0)
  for (let mask = 1; mask <= full; mask++) {
    let most = 0
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) most = Math.max(most, best[mask ^ (1 << i)])
    }
    best[mask] = most + (sum[mask] === 0 ? 1 : 0)
  }

  // Walk back from the full set, removing people one at a time along an optimal
  // path; each time the remaining set sums to zero, the people removed since the
  // last boundary form one self-contained group.
  const groups: Balance[][] = []
  let current: Balance[] = []
  let mask = full
  while (mask) {
    const bonus = sum[mask] === 0 ? 1 : 0
    if (bonus && current.length) {
      groups.push(current)
      current = []
    }
    for (let i = 0; i < n; i++) {
      const bit = 1 << i
      if (mask & bit && best[mask ^ bit] + bonus === best[mask]) {
        current.push(people[i])
        mask ^= bit
        break
      }
    }
  }
  if (current.length) groups.push(current)

  return groups.flatMap(settleGreedy)
}

/** Largest debtor pays largest creditor until everyone is square. */
export function settleGreedy(balances: Balance[]): Payment[] {
  const debtors = balances.filter((b) => b.netCents < 0).map((b) => ({ b, left: -b.netCents }))
  const creditors = balances.filter((b) => b.netCents > 0).map((b) => ({ b, left: b.netCents }))
  debtors.sort((x, y) => y.left - x.left)
  creditors.sort((x, y) => y.left - x.left)

  const payments: Payment[] = []
  let d = 0
  let c = 0
  while (d < debtors.length && c < creditors.length) {
    const amount = Math.min(debtors[d].left, creditors[c].left)
    payments.push({ from: debtors[d].b, to: creditors[c].b, amountCents: amount })
    debtors[d].left -= amount
    creditors[c].left -= amount
    if (debtors[d].left === 0) d++
    if (creditors[c].left === 0) c++
  }
  return payments
}

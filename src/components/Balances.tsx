import { formatRupees as money } from '../lib/money'
import { settleUp, type Balance } from '../lib/settle'
import { EmptyCard } from './Expenses'

export function Balances({
  balances,
  hasExpenses,
  totalSpentCents,
  onGoTo,
}: {
  balances: Balance[]
  hasExpenses: boolean
  totalSpentCents: number
  onGoTo: (tab: 'expenses' | 'members') => void
}) {
  if (balances.length < 2) {
    return (
      <EmptyCard
        title="Step 1: Add the people sharing costs"
        body="Who's on this trip, flat or dinner? Add at least two people, including yourself."
        action={{ label: 'Add people', onClick: () => onGoTo('members') }}
      />
    )
  }

  if (!hasExpenses) {
    return (
      <EmptyCard
        title="Step 2: Log what someone paid for"
        body="Add an expense and SplitSmart shows who owes whom, right here."
        action={{ label: 'Add an expense', onClick: () => onGoTo('expenses') }}
      />
    )
  }

  // Safety check: what everyone is owed must exactly equal what everyone owes,
  // i.e. all balances sum to zero. If not, don't show a settle-up plan that can't be right.
  const imbalance = balances.reduce((sum, b) => sum + b.netCents, 0)
  const changesHands = balances.reduce((sum, b) => sum + Math.max(b.netCents, 0), 0)
  const payments = imbalance === 0 ? settleUp(balances) : []
  const sorted = [...balances].sort((a, b) => b.netCents - a.netCents)

  return (
    <div className="flex flex-col gap-8">
      {imbalance !== 0 && (
        <p
          role="alert"
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
        >
          These balances don't add up: they're off by {money(Math.abs(imbalance))}, so settle-up is
          hidden until the data is fixed.
        </p>
      )}

      <section>
        <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Settle up
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {money(totalSpentCents)} spent in total.{' '}
          {changesHands > 0 && (
            <>
              Only {money(changesHands)} needs to change hands, because each person's own share
              of what they paid cancels out.
            </>
          )}
        </p>
        {imbalance !== 0 ? null : payments.length === 0 ? (
          <div className="mt-3 rounded-3xl bg-emerald-600 p-6 text-center text-white shadow-sm">
            <p className="text-3xl font-bold">All settled up</p>
            <p className="mt-1 text-sm text-emerald-100">Nobody owes anybody anything.</p>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              {payments.length === 1 ? 'One payment clears' : `${payments.length} payments clear`} every debt:
            </p>
            <ol className="mt-3 flex flex-col gap-3">
              {payments.map((p) => (
                <li
                  key={`${p.from.memberId}-${p.to.memberId}`}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="flex flex-wrap items-center gap-x-2 text-lg text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-red-600 dark:text-red-400">{p.from.name}</span>
                    <span>pays</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{p.to.name}</span>
                  </p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
                    {money(p.amountCents)}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Balances
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {sorted.map((b) => {
            const owed = b.netCents > 0
            const owes = b.netCents < 0
            return (
              <li
                key={b.memberId}
                className={`flex items-center justify-between gap-4 rounded-3xl border p-5 ${
                  owed
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50'
                    : owes
                      ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">{b.name}</p>
                  <p
                    className={`text-sm font-medium ${
                      owed
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : owes
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {owed ? 'is owed' : owes ? 'owes' : 'settled up'}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-2xl font-bold tracking-tight tabular-nums min-[400px]:text-3xl ${
                    owed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : owes
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {owed ? '+' : owes ? '−' : ''}
                  {money(Math.abs(b.netCents))}
                </p>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

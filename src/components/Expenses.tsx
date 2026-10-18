import { useState, type FormEvent } from 'react'
import type { Tables } from '../lib/database.types'
import { formatRupees, parseAmountToCents, splitEqually } from '../lib/money'
import { supabase } from '../lib/supabase'

type Group = Tables<'groups'>
type Member = Tables<'members'>
type Expense = Tables<'expenses'>

const fieldClass =
  'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white'

export function AddExpense({
  group,
  members,
  onAdded,
  onAddMembers,
}: {
  group: Group
  members: Member[]
  onAdded: (expense: Expense) => void
  onAddMembers: () => void
}) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (members.length < 2) {
    return (
      <EmptyCard
        title="Add people first"
        body="You need at least two people in the group before you can split an expense."
        action={{ label: 'Add people', onClick: onAddMembers }}
      />
    )
  }

  const amountCents = parseAmountToCents(amount)
  const payerId = members.some((m) => m.id === paidBy) ? paidBy : ''
  const canSubmit = description.trim() !== '' && amountCents !== null && payerId !== '' && !saving

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || amountCents === null) return
    setSaving(true)
    setError(null)

    // One database call saves the expense and its equal split together, so an expense
    // can never exist without its shares (the database also rejects shares that don't add up).
    const { data: expense, error } = await supabase.rpc('add_expense', {
      p_group_id: group.id,
      p_paid_by: payerId,
      p_description: description.trim(),
      p_amount_cents: amountCents,
    })
    setSaving(false)

    if (error) {
      console.error(error)
      setError("Couldn't save the expense. Nothing was recorded, so please try again.")
      return
    }
    setDescription('')
    setAmount('')
    onAdded(expense)
  }

  const splitHint = amountCents !== null ? describeSplit(amountCents, members.length) : null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-medium text-slate-900 dark:text-white">Add an expense</h2>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
        <div>
          <label htmlFor="expense-description" className="sr-only">
            Description
          </label>
          <input
            id="expense-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was it for? e.g. Dinner"
            maxLength={120}
            autoComplete="off"
            className={fieldClass}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative w-2/5 shrink-0">
            <label htmlFor="expense-amount" className="sr-only">
              Amount in rupees
            </label>
            <input
              id="expense-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={amount !== '' && amountCents === null}
              className={`${fieldClass} pl-9 tabular-nums aria-invalid:border-red-400`}
            />
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-slate-400">
              ₹
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="expense-paid-by" className="sr-only">
              Paid by
            </label>
            <select
              id="expense-paid-by"
              value={payerId}
              onChange={(e) => setPaidBy(e.target.value)}
              className={`${fieldClass} ${payerId ? '' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <option value="" disabled>
                Who paid?
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {amount !== '' && amountCents === null
            ? 'Enter an amount like 250 or 12.50.'
            : (splitHint ?? `Split equally between all ${members.length} members.`)}
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-base font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Add expense'}
        </button>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>
    </section>
  )
}

/** "₹33.34 for 1 person, ₹33.33 for 2", so the hint accounts for every paisa. */
function describeSplit(amountCents: number, count: number): string {
  const shares = splitEqually(amountCents, count)
  const high = shares[0]
  const low = shares[count - 1]
  const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`
  if (high === low) return `Split equally: ${formatRupees(high)} each for all ${count}.`
  const highCount = shares.filter((s) => s === high).length
  return `Split equally: ${formatRupees(high)} for ${people(highCount)}, ${formatRupees(low)} for ${people(count - highCount)}.`
}

export function EmptyCard({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 px-6 py-8 text-center dark:border-slate-700">
      <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          {action.label}
        </button>
      )}
    </section>
  )
}

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })

export function ExpenseList({ members, expenses }: { members: Member[]; expenses: Expense[] }) {
  const nameById = new Map(members.map((m) => [m.id, m.name]))

  if (expenses.length === 0) {
    return members.length < 2 ? null : (
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        No expenses yet. Your first one will show up here.
      </p>
    )
  }

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        History · {expenses.length}
      </h2>
      <ul className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {expenses.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900 dark:text-white">{e.description}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {nameById.get(e.paid_by) ?? 'Someone'} paid · {dateFormat.format(new Date(e.created_at))}
              </p>
            </div>
            <span className="shrink-0 text-lg font-semibold text-slate-900 tabular-nums dark:text-white">
              {formatRupees(e.amount_cents)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

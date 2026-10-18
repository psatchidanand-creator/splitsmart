import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

const STEPS = [
  { title: 'Name your group', body: 'A trip, a flat, a dinner.' },
  { title: 'Add the people', body: 'Including yourself.' },
  { title: 'Log who paid', body: 'We split it equally.' },
]

/** A sample of the result, so first-time visitors see the payoff before they start. */
function ExamplePreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-xs select-none">
      <div className="absolute inset-x-6 -bottom-2 h-full rounded-3xl bg-emerald-100 dark:bg-emerald-950/60" />
      <div className="relative rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Settle up</p>
        <p className="mt-2 text-base text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-red-600 dark:text-red-400">Ben</span> pays{' '}
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Asha</span>
        </p>
        <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
          ₹975
        </p>
      </div>
    </div>
  )
}

export function CreateGroup({ onCreated }: { onCreated: (groupId: string) => void }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    setError(null)
    const { data, error } = await supabase.from('groups').insert({ name: trimmed }).select('id').single()
    setSaving(false)
    if (error) {
      setError("Couldn't create the group. Check your connection and try again.")
      console.error(error)
      return
    }
    onCreated(data.id)
  }

  return (
    <main className="flex flex-1 flex-col px-5 pt-8 pb-10">
      <h1 className="text-3xl leading-tight font-bold tracking-tight text-balance text-slate-900 dark:text-white">
        Split shared costs.{' '}
        <span className="text-emerald-600 dark:text-emerald-400">See who owes whom.</span>
      </h1>
      <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
        Log who paid for what. SplitSmart works out the fewest payments to settle up. No sign-up.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <label htmlFor="group-name" className="text-sm font-medium text-slate-900 dark:text-white">
          Start by naming your group
        </label>
        <input
          id="group-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          placeholder="e.g. Goa trip"
          maxLength={80}
          autoComplete="off"
          enterKeyHint="go"
          className="h-14 rounded-2xl border border-slate-300 bg-white px-4 text-lg text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-lg font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create group'}
          {!saving && <span aria-hidden="true">→</span>}
        </button>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>

      <ol className="mt-10 grid grid-cols-3 gap-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-col items-start gap-1">
            <span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              {i + 1}
            </span>
            <span className="text-sm leading-tight font-semibold text-slate-900 dark:text-white">{s.title}</span>
            <span className="text-xs leading-snug text-slate-500 dark:text-slate-400">{s.body}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10">
        <p className="mb-3 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
          You'll end up with something like this
        </p>
        <ExamplePreview />
      </div>
    </main>
  )
}

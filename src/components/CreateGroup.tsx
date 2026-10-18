import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-auto" aria-hidden="true">
      <circle cx="80" cy="60" r="52" className="fill-emerald-50 dark:fill-emerald-950/60" />
      <rect x="42" y="34" width="56" height="64" rx="8" className="fill-white stroke-slate-200 dark:fill-slate-800 dark:stroke-slate-700" strokeWidth="2" />
      <rect x="52" y="48" width="30" height="5" rx="2.5" className="fill-slate-200 dark:fill-slate-600" />
      <rect x="52" y="60" width="36" height="5" rx="2.5" className="fill-slate-200 dark:fill-slate-600" />
      <rect x="52" y="72" width="22" height="5" rx="2.5" className="fill-slate-200 dark:fill-slate-600" />
      <circle cx="106" cy="44" r="16" className="fill-emerald-500" />
      <text x="106" y="50" textAnchor="middle" className="fill-white text-[16px] font-bold">$</text>
      <circle cx="44" cy="92" r="9" className="fill-amber-300 dark:fill-amber-400" />
      <circle cx="62" cy="96" r="9" className="fill-sky-300 dark:fill-sky-400" />
    </svg>
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
      setError("Couldn't create the group. Please try again.")
      console.error(error)
      return
    }
    onCreated(data.id)
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <EmptyIllustration />
      <h1 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">Start a group</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        A trip, a shared flat or dinner with friends. Log who paid, and SplitSmart works out
        who owes whom.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <label htmlFor="group-name" className="sr-only">
          Group name
        </label>
        <input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Goa trip"
          maxLength={80}
          autoComplete="off"
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-base font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create group'}
        </button>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>
    </main>
  )
}

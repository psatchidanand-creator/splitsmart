import { useEffect, useState, type FormEvent } from 'react'
import type { Tables } from '../lib/database.types'
import { groupLink, isValidGroupId } from '../lib/groupUrl'
import { supabase } from '../lib/supabase'

type Group = Tables<'groups'>
type Member = Tables<'members'>

type LoadState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; group: Group }

const inputClass =
  'h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white'

export function GroupView({ groupId, onLeave }: { groupId: string; onLeave: () => void }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setState({ status: 'loading' })
      if (!isValidGroupId(groupId)) {
        setState({ status: 'not-found' })
        return
      }
      const [groupRes, membersRes] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).maybeSingle(),
        supabase.from('members').select('*').eq('group_id', groupId).order('created_at'),
      ])
      if (cancelled) return
      if (groupRes.error || membersRes.error) {
        console.error(groupRes.error ?? membersRes.error)
        setState({ status: 'error' })
        return
      }
      if (!groupRes.data) {
        setState({ status: 'not-found' })
        return
      }
      setMembers(membersRes.data)
      setState({ status: 'ready', group: groupRes.data })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [groupId])

  if (state.status === 'loading') {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
        Loading group…
      </main>
    )
  }

  if (state.status !== 'ready') {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          {state.status === 'not-found' ? 'Group not found' : 'Something went wrong'}
        </h1>
        <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
          {state.status === 'not-found'
            ? 'This link may be mistyped, or the group no longer exists.'
            : "We couldn't load this group. Check your connection and refresh."}
        </p>
        <button
          type="button"
          onClick={onLeave}
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Start a new group
        </button>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {state.group.name}
      </h1>
      <ShareLink groupId={groupId} />
      <MemberList
        groupId={groupId}
        members={members}
        onAdded={(m) => setMembers((prev) => [...prev, m])}
      />
    </main>
  )
}

function ShareLink({ groupId }: { groupId: string }) {
  const link = groupLink(groupId)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (e.g. non-secure origin); the link is still selectable.
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
      <h2 className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Share this group</h2>
      <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
        Anyone with this link can view and add to the group.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Shareable group link"
          className="h-10 min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-emerald-900 dark:bg-slate-900 dark:text-slate-300"
        />
        <button
          type="button"
          onClick={copy}
          className="h-10 shrink-0 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </section>
  )
}

function MemberList({
  groupId,
  members,
  onAdded,
}: {
  groupId: string
  members: Member[]
  onAdded: (member: Member) => void
}) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || saving) return
    if (members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`${trimmed} is already in this group.`)
      return
    }
    setSaving(true)
    setError(null)
    const { data, error } = await supabase
      .from('members')
      .insert({ group_id: groupId, name: trimmed })
      .select('*')
      .single()
    setSaving(false)
    if (error) {
      console.error(error)
      setError("Couldn't add that member. Please try again.")
      return
    }
    onAdded(data)
    setName('')
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-slate-900 dark:text-white">
        Members <span className="text-slate-400">({members.length})</span>
      </h2>

      {members.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          No one here yet. Add the people sharing costs, including yourself.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                {m.name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-slate-900 dark:text-white">{m.name}</span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <label htmlFor="member-name" className="sr-only">
          Member name
        </label>
        <input
          id="member-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          placeholder="Add a name"
          maxLength={60}
          autoComplete="off"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="h-12 shrink-0 rounded-2xl bg-emerald-600 px-5 text-base font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  )
}

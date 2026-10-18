import { useEffect, useState } from 'react'
import { CreateGroup } from './components/CreateGroup'
import { GroupView } from './components/GroupView'
import { navigateToGroup, readGroupId } from './lib/groupUrl'

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="size-4.5" aria-hidden="true">
          <path d="M12 3v18" />
          <path d="M5 8l-2 4 2 4" />
          <path d="M19 8l2 4-2 4" />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
        Split<span className="text-emerald-600 dark:text-emerald-400">Smart</span>
      </span>
    </div>
  )
}

function App() {
  const [groupId, setGroupId] = useState(readGroupId)

  useEffect(() => {
    const onPop = () => setGroupId(readGroupId())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <div className="min-h-dvh bg-slate-50 font-sans text-slate-700 antialiased dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-slate-50/85 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              navigateToGroup(null)
            }}
            aria-label="SplitSmart home"
          >
            <Logo />
          </a>
          {groupId && (
            <button
              type="button"
              onClick={() => navigateToGroup(null)}
              className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              New group
            </button>
          )}
        </header>

        {groupId ? (
          <GroupView key={groupId} groupId={groupId} onLeave={() => navigateToGroup(null)} />
        ) : (
          <CreateGroup onCreated={navigateToGroup} />
        )}

        <footer className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-slate-400 dark:text-slate-600">
          Split expenses, not friendships.
        </footer>
      </div>
    </div>
  )
}

export default App

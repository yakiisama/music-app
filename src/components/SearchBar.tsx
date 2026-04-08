import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'

type Props = {
  onSearch: (query: string) => Promise<void> | void
  loading?: boolean
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) await onSearch(query)
  }

  return (
    <form onSubmit={submit} className="sticky top-0 z-20 bg-[#0a0a0a]/95 pb-4 pt-2 backdrop-blur-sm">
      <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 transition-colors focus-within:border-zinc-600">
        <SearchIcon />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-zinc-100 outline-none placeholder:text-zinc-500"
          placeholder="搜索歌曲、歌手..."
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 hover:text-zinc-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
        <button
          disabled={loading || !query.trim()}
          className="flex h-7 items-center rounded-md bg-cyan-400 px-3 text-xs font-medium text-zinc-950 transition-all hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M12 2a10 10 0 019.17 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
          ) : '搜索'}
        </button>
      </div>
    </form>
  )
}

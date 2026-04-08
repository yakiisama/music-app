import { invoke } from '@tauri-apps/api/core'
import { useCallback } from 'react'
import { isTauri } from '../lib/tauri'
import { usePlayerStore } from '../stores/playerStore'
import type { Track } from '../types'

export const useSearch = () => {
  const setResults = usePlayerStore((s) => s.setResults)
  const setSearchLoading = usePlayerStore((s) => s.setSearchLoading)
  const setError = usePlayerStore((s) => s.setError)

  const search = useCallback(
    async (query: string) => {
      const q = query.trim()
      if (!q) {
        setResults([])
        return
      }
      if (!isTauri()) {
        setError('请在 Tauri 桌面端运行以使用搜索功能')
        return
      }
      setSearchLoading(true)
      setError(undefined)
      try {
        const tracks = await invoke<Track[]>('search_youtube', { query: q })
        setResults(tracks)
      } catch (e) {
        setError(String(e))
      } finally {
        setSearchLoading(false)
      }
    },
    [setError, setResults, setSearchLoading],
  )

  return { search }
}

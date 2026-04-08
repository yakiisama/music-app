import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect } from 'react'
import { isTauri } from '../lib/tauri'
import { usePlayerStore } from '../stores/playerStore'
import type { AppSettings } from '../types'

export const useSettings = () => {
  const setSettings = usePlayerStore((s) => s.setSettings)
  const setError = usePlayerStore((s) => s.setError)

  const load = useCallback(async () => {
    if (!isTauri()) return
    try {
      const s = await invoke<AppSettings>('get_settings')
      setSettings(s)
    } catch { /* ignore */ }
  }, [setSettings])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (s: AppSettings) => {
    if (!isTauri()) return
    try {
      await invoke('save_settings', { settings: s })
      setSettings(s)
    } catch (e) {
      setError(String(e))
    }
  }, [setSettings, setError])

  const pickFolder = useCallback(async (): Promise<string | null> => {
    if (!isTauri()) return null
    try {
      const result = await invoke<string | null>('pick_folder')
      return result
    } catch {
      return null
    }
  }, [])

  return { load, save, pickFolder }
}

import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { useCallback, useState } from 'react'
import { isTauri } from '../lib/tauri'

export type UpdateUiState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'latest' }
  | { kind: 'error'; message: string }
  | { kind: 'downloading'; percent?: number }
  | { kind: 'installing' }

const CHECK_TIMEOUT_MS = 45_000

/** 静默检查是否有新版本（生产环境安装包内使用） */
export async function checkUpdateSilently(): Promise<{ version: string; body?: string } | null> {
  if (!isTauri()) return null
  try {
    const u = await check({ timeout: CHECK_TIMEOUT_MS })
    if (!u) return null
    const meta = { version: u.version, body: u.body }
    await u.close()
    return meta
  } catch {
    return null
  }
}

export function useUpdater() {
  const [state, setState] = useState<UpdateUiState>({ kind: 'idle' })

  const checkManual = useCallback(async () => {
    if (!isTauri()) {
      setState({ kind: 'error', message: '请在桌面端应用内使用更新功能' })
      return null
    }
    setState({ kind: 'checking' })
    try {
      const u = await check({ timeout: CHECK_TIMEOUT_MS })
      if (!u) {
        setState({ kind: 'latest' })
        return null
      }
      const meta = { version: u.version, body: u.body }
      await u.close()
      setState({ kind: 'idle' })
      return meta
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setState({ kind: 'error', message })
      return null
    }
  }, [])

  const downloadInstallAndRelaunch = useCallback(async () => {
    if (!isTauri()) return
    setState({ kind: 'checking' })
    try {
      const u = await check({ timeout: CHECK_TIMEOUT_MS })
      if (!u) {
        setState({ kind: 'latest' })
        return
      }
      let downloaded = 0
      let total = 0
      await u.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength ?? 0
            downloaded = 0
            setState({ kind: 'downloading', percent: 0 })
            break
          case 'Progress':
            downloaded += event.data.chunkLength
            if (total > 0) {
              setState({ kind: 'downloading', percent: Math.min(99, (downloaded / total) * 100) })
            }
            break
          case 'Finished':
            setState({ kind: 'installing' })
            break
        }
      })
      await relaunch()
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setState({ kind: 'error', message })
    }
  }, [])

  const resetState = useCallback(() => setState({ kind: 'idle' }), [])

  return { state, checkManual, downloadInstallAndRelaunch, resetState }
}

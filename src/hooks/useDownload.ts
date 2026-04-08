import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useCallback, useEffect } from 'react'
import { isTauri } from '../lib/tauri'
import { usePlayerStore } from '../stores/playerStore'
import type { DownloadedFile, DownloadQuality, DownloadTask } from '../types'

export const useDownload = () => {
  const upsertDownloadTask = usePlayerStore((s) => s.upsertDownloadTask)
  const setError = usePlayerStore((s) => s.setError)
  const setDownloadedFiles = usePlayerStore((s) => s.setDownloadedFiles)

  const refreshFiles = useCallback(async () => {
    if (!isTauri()) return
    try {
      const files = await invoke<DownloadedFile[]>('list_downloaded_files')
      setDownloadedFiles(files)
    } catch { /* ignore */ }
  }, [setDownloadedFiles])

  useEffect(() => {
    refreshFiles()
  }, [refreshFiles])

  useEffect(() => {
    if (!isTauri()) return
    let unlisten: (() => void) | undefined
    listen<DownloadTask>('download-progress', (event) => {
      upsertDownloadTask(event.payload)
      if (event.payload.error) setError(event.payload.error)
      if (event.payload.done && !event.payload.error) {
        refreshFiles()
      }
    }).then((fn) => {
      unlisten = fn
    })
    return () => { unlisten?.() }
  }, [setError, upsertDownloadTask, refreshFiles])

  const download = useCallback(
    async (videoId: string, quality: DownloadQuality) => {
      if (!isTauri()) {
        setError('请在 Tauri 桌面端运行以使用下载功能')
        return
      }
      upsertDownloadTask({ videoId, percent: 0, message: '准备下载...', done: false })
      try {
        await invoke('download_track', { videoId, quality })
      } catch (e) {
        setError(String(e))
      }
    },
    [setError, upsertDownloadTask],
  )

  const openInFinder = useCallback(async (path: string) => {
    if (!isTauri()) return
    try {
      await invoke('open_in_finder', { path })
    } catch { /* ignore */ }
  }, [])

  return { download, openInFinder, refreshFiles }
}

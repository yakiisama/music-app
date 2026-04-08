import { create } from 'zustand'
import type { AppSettings, DownloadTask, DownloadedFile, Track } from '../types'

export type TabId = 'search' | 'downloads' | 'settings'

type PlayerState = {
  tab: TabId
  results: Track[]
  queue: Track[]
  current?: Track
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  streamUrl?: string
  loadingStream: boolean
  searchLoading: boolean
  error?: string
  downloadTasks: Record<string, DownloadTask>
  downloadedFiles: DownloadedFile[]
  settings: AppSettings

  setTab: (tab: TabId) => void
  setResults: (tracks: Track[]) => void
  setCurrent: (track?: Track) => void
  setPlaying: (v: boolean) => void
  setVolume: (v: number) => void
  setCurrentTime: (v: number) => void
  setDuration: (v: number) => void
  setStreamUrl: (v?: string) => void
  setLoadingStream: (v: boolean) => void
  setSearchLoading: (v: boolean) => void
  setError: (v?: string) => void
  upsertDownloadTask: (task: DownloadTask) => void
  setDownloadedFiles: (files: DownloadedFile[]) => void
  setSettings: (s: AppSettings) => void
}

const defaultSettings: AppSettings = {
  downloadDir: '',
  defaultQuality: 'mp3_320',
  searchCount: 10,
}

export const usePlayerStore = create<PlayerState>((set) => ({
  tab: 'search',
  results: [],
  queue: [],
  current: undefined,
  isPlaying: false,
  volume: 0.85,
  currentTime: 0,
  duration: 0,
  streamUrl: undefined,
  loadingStream: false,
  searchLoading: false,
  error: undefined,
  downloadTasks: {},
  downloadedFiles: [],
  settings: defaultSettings,

  setTab: (tab) => set({ tab }),
  setResults: (tracks) => set({ results: tracks, queue: tracks }),
  setCurrent: (track) => set({ current: track, currentTime: 0, duration: 0 }),
  setPlaying: (v) => set({ isPlaying: v }),
  setVolume: (v) => set({ volume: v }),
  setCurrentTime: (v) => set({ currentTime: v }),
  setDuration: (v) => set({ duration: v }),
  setStreamUrl: (v) => set({ streamUrl: v }),
  setLoadingStream: (v) => set({ loadingStream: v }),
  setSearchLoading: (v) => set({ searchLoading: v }),
  setError: (v) => set({ error: v }),
  upsertDownloadTask: (task) =>
    set((state) => ({
      downloadTasks: { ...state.downloadTasks, [task.videoId]: task },
    })),
  setDownloadedFiles: (files) => set({ downloadedFiles: files }),
  setSettings: (s) => set({ settings: s }),
}))

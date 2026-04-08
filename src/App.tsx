import { useEffect, useState, useCallback } from 'react'
import DownloadList from './components/DownloadList'
import DownloadModal from './components/DownloadModal'
import Player from './components/Player'
import SearchBar from './components/SearchBar'
import Settings from './components/Settings'
import TrackList from './components/TrackList'
import { useAudio } from './hooks/useAudio'
import { useDownload } from './hooks/useDownload'
import { useSearch } from './hooks/useSearch'
import { useSettings } from './hooks/useSettings'
import { checkUpdateSilently, useUpdater } from './hooks/useUpdater'
import { usePlayerStore } from './stores/playerStore'
import type { Track } from './types'

const tabConfig = [
  { id: 'search' as const, label: '搜索', icon: SearchIcon },
  { id: 'downloads' as const, label: '下载', icon: DownloadTabIcon },
  { id: 'settings' as const, label: '设置', icon: GearIcon },
]

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function DownloadTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}
function GearIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
}

function App() {
  const [downloadTarget, setDownloadTarget] = useState<Track | undefined>()
  const { search } = useSearch()
  const { download, openInFinder, refreshFiles } = useDownload()
  const { audioRef, playTrack, togglePlay, seek } = useAudio()
  const { save: saveSettings, pickFolder } = useSettings()
  const updater = useUpdater()

  const tab = usePlayerStore((s) => s.tab)
  const setTab = usePlayerStore((s) => s.setTab)
  const results = usePlayerStore((s) => s.results)
  const searchLoading = usePlayerStore((s) => s.searchLoading)
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const loadingStream = usePlayerStore((s) => s.loadingStream)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const error = usePlayerStore((s) => s.error)
  const setError = usePlayerStore((s) => s.setError)
  const downloadTasks = usePlayerStore((s) => s.downloadTasks)
  const downloadedFiles = usePlayerStore((s) => s.downloadedFiles)
  const settings = usePlayerStore((s) => s.settings)
  const pendingUpdate = usePlayerStore((s) => s.pendingUpdate)
  const setPendingUpdate = usePlayerStore((s) => s.setPendingUpdate)

  useEffect(() => {
    if (!import.meta.env.PROD) return
    checkUpdateSilently().then((m) => {
      if (m) setPendingUpdate(m)
    })
  }, [setPendingUpdate])

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target instanceof HTMLElement && e.target.tagName !== 'INPUT') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [togglePlay])

  useEffect(() => {
    if (tab === 'downloads') refreshFiles()
  }, [tab, refreshFiles])

  const handleOpenDir = useCallback(() => {
    if (settings.downloadDir) openInFinder(settings.downloadDir)
  }, [settings.downloadDir, openInFinder])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(undefined), 5000)
    return () => clearTimeout(t)
  }, [error, setError])

  return (
    <div className="flex h-full flex-col">
      <audio ref={audioRef} className="ytm-hidden-audio" />

      {/* 顶部栏 */}
      <header className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-3">
        <h1 className="text-[15px] font-semibold tracking-tight text-zinc-100">Music</h1>
        <nav className="flex rounded-lg bg-zinc-800/50 p-0.5">
          {tabConfig.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                tab === id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {pendingUpdate && (
        <div className="mx-5 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-900/40 bg-cyan-950/25 px-3 py-2.5">
          <p className="text-xs text-cyan-200/90">
            发现新版本 <span className="font-medium text-cyan-300">v{pendingUpdate.version}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPendingUpdate(undefined)}
              className="rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              稍后
            </button>
            <button
              type="button"
              onClick={() => updater.downloadInstallAndRelaunch()}
              className="rounded-md bg-cyan-400 px-3 py-1 text-xs font-medium text-zinc-950 transition-colors hover:bg-cyan-300"
            >
              下载并安装
            </button>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mx-5 mt-3 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* 内容区 */}
      <main className={`flex-1 overflow-y-auto px-5 ${current ? 'pb-24' : 'pb-6'}`}>
        {tab === 'search' && (
          <>
            <SearchBar onSearch={search} loading={searchLoading} />
            <TrackList
              tracks={results}
              loading={searchLoading}
              onPlay={playTrack}
              onOpenDownload={setDownloadTarget}
              tasks={downloadTasks}
              currentId={current?.id}
              isPlaying={isPlaying}
            />
          </>
        )}
        {tab === 'downloads' && (
          <div className="pt-4">
            <DownloadList
              files={downloadedFiles}
              tasks={downloadTasks}
              downloadDir={settings.downloadDir}
              onOpenInFinder={openInFinder}
              onOpenDir={handleOpenDir}
            />
          </div>
        )}
        {tab === 'settings' && (
          <Settings
            settings={settings}
            onSave={saveSettings}
            onPickFolder={pickFolder}
            onOpenFolder={openInFinder}
            updaterState={updater.state}
            onCheckUpdate={updater.checkManual}
            onInstallUpdate={updater.downloadInstallAndRelaunch}
            onResetUpdaterState={updater.resetState}
          />
        )}
      </main>

      {/* 下载品质弹窗 */}
      <DownloadModal
        open={Boolean(downloadTarget)}
        track={downloadTarget}
        downloadDir={settings.downloadDir}
        defaultQuality={settings.defaultQuality}
        onClose={() => setDownloadTarget(undefined)}
        onConfirm={(quality) => {
          if (downloadTarget) download(downloadTarget.id, quality)
          setDownloadTarget(undefined)
        }}
      />

      {/* 底部播放栏 */}
      <Player
        current={current}
        isPlaying={isPlaying}
        loading={loadingStream}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onVolume={setVolume}
      />
    </div>
  )
}

export default App

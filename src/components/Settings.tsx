import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { AppSettings, DownloadQuality } from '../types'
import type { UpdateUiState } from '../hooks/useUpdater'

type Props = {
  settings: AppSettings
  onSave: (s: AppSettings) => Promise<void>
  onPickFolder: () => Promise<string | null>
  onOpenFolder: (path: string) => void
  updaterState: UpdateUiState
  onCheckUpdate: () => Promise<{ version: string; body?: string } | null>
  onInstallUpdate: () => Promise<void>
  onResetUpdaterState: () => void
}

const qualityOptions: { id: DownloadQuality; label: string; desc: string }[] = [
  { id: 'flac', label: 'FLAC 无损', desc: '体积大，音质最佳' },
  { id: 'mp3_320', label: 'MP3 320kbps', desc: '兼顾音质与体积' },
  { id: 'mp3_128', label: 'MP3 128kbps', desc: '体积小，下载快' },
]

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SavedToast() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-900/60 px-3 py-1.5 text-xs text-emerald-300"
    >
      <CheckIcon /> 已保存
    </motion.div>
  )
}

export default function Settings({
  settings,
  onSave,
  onPickFolder,
  onOpenFolder,
  updaterState,
  onCheckUpdate,
  onInstallUpdate,
  onResetUpdaterState,
}: Props) {
  const [local, setLocal] = useState<AppSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [offerUpdate, setOfferUpdate] = useState<{ version: string; body?: string } | null>(null)

  useEffect(() => {
    setLocal(settings)
    setDirty(false)
  }, [settings])

  const update = (patch: Partial<AppSettings>) => {
    setLocal((prev) => ({ ...prev, ...patch }))
    setDirty(true)
    setSaved(false)
  }

  const handleSave = async () => {
    await onSave(local)
    setSaved(true)
    setDirty(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePickFolder = async () => {
    const folder = await onPickFolder()
    if (folder) {
      update({ downloadDir: folder })
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-4">
      <h2 className="text-[15px] font-semibold text-zinc-100">设置</h2>

      {/* 应用更新 */}
      <section className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">应用更新</label>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3">
          {updaterState.kind === 'checking' && (
            <p className="text-[13px] text-zinc-400">正在检查更新…</p>
          )}
          {updaterState.kind === 'downloading' && (
            <div>
              <p className="text-[13px] text-zinc-300">正在下载更新…</p>
              {updaterState.percent != null && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-cyan-400 transition-[width] duration-200"
                    style={{ width: `${Math.round(updaterState.percent)}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {updaterState.kind === 'installing' && (
            <p className="text-[13px] text-zinc-300">正在安装，即将重启…</p>
          )}
          {updaterState.kind === 'latest' && (
            <p className="text-[13px] text-emerald-400/90">当前已是最新版本</p>
          )}
          {updaterState.kind === 'error' && (
            <p className="text-[13px] text-red-400/90">{updaterState.message}</p>
          )}
          {(updaterState.kind === 'idle' ||
            updaterState.kind === 'checking' ||
            updaterState.kind === 'latest' ||
            updaterState.kind === 'error') && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  onResetUpdaterState()
                  setOfferUpdate(null)
                  const m = await onCheckUpdate()
                  if (m) setOfferUpdate(m)
                }}
                disabled={updaterState.kind === 'checking'}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                检查更新
              </button>
              {offerUpdate && (
                <button
                  type="button"
                  onClick={() => onInstallUpdate()}
                  className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-medium text-zinc-950 transition-colors hover:bg-cyan-300"
                >
                  下载并安装 v{offerUpdate.version}
                </button>
              )}
            </div>
          )}
          {offerUpdate?.body && updaterState.kind === 'idle' && (
            <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-500">{offerUpdate.body}</p>
          )}
        </div>
        <p className="text-[11px] text-zinc-600">从 GitHub Releases 获取更新（正式安装包）</p>
      </section>

      {/* 下载路径 */}
      <section className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">下载路径</label>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5">
            <FolderIcon />
            <span className="min-w-0 truncate text-[13px] text-zinc-300">
              {local.downloadDir || '未设置'}
            </span>
          </div>
          <button
            onClick={handlePickFolder}
            className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            浏览...
          </button>
        </div>
        {local.downloadDir && (
          <button
            onClick={() => onOpenFolder(local.downloadDir)}
            className="flex items-center gap-1.5 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <FolderIcon />
            <span>打开下载文件夹</span>
          </button>
        )}
      </section>

      {/* 默认下载品质 */}
      <section className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">默认下载品质</label>
        <div className="space-y-1.5">
          {qualityOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => update({ defaultQuality: opt.id })}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                local.defaultQuality === opt.id
                  ? 'border-cyan-400/40 bg-cyan-400/6'
                  : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-600'
              }`}
            >
              <div>
                <p className={`text-[13px] ${local.defaultQuality === opt.id ? 'text-cyan-400' : 'text-zinc-200'}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-zinc-500">{opt.desc}</p>
              </div>
              {local.defaultQuality === opt.id && (
                <span className="text-cyan-400"><CheckIcon /></span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* 搜索结果数量 */}
      <section className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">搜索结果数量</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={local.searchCount}
            onChange={(e) => update({ searchCount: Number(e.target.value) })}
            className="track-slider flex-1"
          />
          <span className="w-8 text-right text-[13px] tabular-nums text-zinc-300">{local.searchCount}</span>
        </div>
        <p className="text-[11px] text-zinc-600">每次搜索返回的最大结果数</p>
      </section>

      {/* 保存按钮 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!dirty}
          className={`rounded-lg px-5 py-2 text-xs font-medium transition-all ${
            dirty
              ? 'bg-cyan-400 text-zinc-950 hover:bg-cyan-300'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          保存设置
        </button>
        {saved && <SavedToast />}
      </div>

      {/* 关于 */}
      <section className="border-t border-zinc-800/60 pt-4">
        <p className="text-[11px] text-zinc-600">
          Music v0.1.0 — 基于 yt-dlp + Tauri 构建
        </p>
      </section>
    </div>
  )
}

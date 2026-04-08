import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { DownloadQuality, Track } from '../types'

type Props = {
  open: boolean
  track?: Track
  downloadDir: string
  defaultQuality: DownloadQuality
  onClose: () => void
  onConfirm: (quality: DownloadQuality) => void
}

type DownloadCategory = 'audio' | 'video'

const audioOptions: { id: DownloadQuality; label: string; tag: string }[] = [
  { id: 'flac', label: '无损品质', tag: 'FLAC' },
  { id: 'mp3_320', label: '高品质', tag: '320K' },
  { id: 'mp3_128', label: '标准品质', tag: '128K' },
]

const videoOptions: { id: DownloadQuality; label: string; tag: string }[] = [
  { id: 'mp4_1080', label: '高清', tag: '1080P' },
  { id: 'mp4_720', label: '标清', tag: '720P' },
  { id: 'mp4_480', label: '流畅', tag: '480P' },
]

function MusicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polygon points="10 9 15 12 10 15" />
    </svg>
  )
}

export default function DownloadModal({ open, track, downloadDir, defaultQuality, onClose, onConfirm }: Props) {
  const [category, setCategory] = useState<DownloadCategory>('audio')

  const options = category === 'audio' ? audioOptions : videoOptions

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="mx-4 w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl shadow-black/40"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-semibold text-zinc-100">选择下载格式</h3>
            <p className="mt-1 truncate text-xs text-zinc-500">{track?.title}</p>

            {/* 音频/视频切换 */}
            <div className="mt-3 flex rounded-lg bg-zinc-800/60 p-0.5">
              {([
                { id: 'audio' as DownloadCategory, label: '音频', Icon: MusicIcon },
                { id: 'video' as DownloadCategory, label: '视频', Icon: VideoIcon },
              ]).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    category === id
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {options.map((item) => {
                const isDefault = category === 'audio' && item.id === defaultQuality
                return (
                  <button
                    key={item.id}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                      isDefault
                        ? 'border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/10'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/80'
                    }`}
                    onClick={() => onConfirm(item.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] ${isDefault ? 'text-cyan-400' : 'text-zinc-200'}`}>{item.label}</span>
                      {isDefault && (
                        <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[10px] text-cyan-400">默认</span>
                      )}
                    </div>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">{item.tag}</span>
                  </button>
                )
              })}
            </div>

            {downloadDir && (
              <p className="mt-3 text-[11px] text-zinc-600">
                保存至 {downloadDir}
              </p>
            )}

            <button
              onClick={onClose}
              className="mt-3 w-full rounded-lg py-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              取消
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

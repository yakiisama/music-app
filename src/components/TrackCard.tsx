import { motion } from 'framer-motion'
import type { DownloadTask, Track } from '../types'

type Props = {
  track: Track
  onPlay: (track: Track) => void
  onOpenDownload: (track: Track) => void
  task?: DownloadTask
  isCurrentPlaying?: boolean
}

const fmt = (sec?: number) => {
  if (!sec) return '--:--'
  const m = Math.floor(sec / 60)
  const s = `${Math.floor(sec % 60)}`.padStart(2, '0')
  return `${m}:${s}`
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  )
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
  )
}

export default function TrackCard({ track, onPlay, onOpenDownload, task, isCurrentPlaying }: Props) {
  const downloading = task && !task.done && !task.error
  const downloaded = task?.done && !task.error

  return (
    <motion.article
      layout
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        isCurrentPlaying ? 'bg-cyan-400/[0.07]' : 'hover:bg-zinc-800/60'
      }`}
    >
      {/* 封面 */}
      <button
        onClick={() => onPlay(track)}
        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-zinc-800"
      >
        <img
          src={track.thumbnail ?? ''}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {isCurrentPlaying ? <PauseIcon /> : <PlayIcon />}
        </span>
        {isCurrentPlaying && (
          <span className="absolute bottom-0.5 left-0.5 flex gap-[2px]">
            {[1,2,3].map(i => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-cyan-400"
                animate={{ height: [4, 10, 4] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </span>
        )}
      </button>

      {/* 信息 */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] font-medium ${isCurrentPlaying ? 'text-cyan-400' : 'text-zinc-100'}`}>
          {track.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {track.uploader ?? '未知'} · {fmt(track.durationSec)}
        </p>
      </div>

      {/* 下载进度 */}
      {downloading && (
        <div className="flex w-16 flex-col items-end gap-0.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-700">
            <motion.div
              className="h-full bg-cyan-400"
              animate={{ width: `${Math.max(2, task.percent ?? 0)}%` }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            />
          </div>
          <span className="text-[10px] text-zinc-500">{Math.round(task.percent ?? 0)}%</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onPlay(track)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
          title="播放"
        >
          {isCurrentPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          onClick={() => !downloading && onOpenDownload(track)}
          disabled={!!downloading}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            downloaded
              ? 'text-emerald-400'
              : downloading
                ? 'text-zinc-600'
                : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
          }`}
          title={downloaded ? '已下载' : '下载'}
        >
          {downloaded ? <CheckIcon /> : <DownloadIcon />}
        </button>
      </div>
    </motion.article>
  )
}

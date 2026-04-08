import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useCallback } from 'react'
import type { Track } from '../types'

type Props = {
  current?: Track
  isPlaying: boolean
  loading?: boolean
  currentTime: number
  duration: number
  volume: number
  onTogglePlay: () => void
  onSeek: (time: number) => void
  onVolume: (value: number) => void
}

const fmt = (sec: number) => {
  if (!sec || !isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = `${Math.floor(sec % 60)}`.padStart(2, '0')
  return `${m}:${s}`
}

function PrevIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/></svg>
}
function NextIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z"/></svg>
}
function PlayIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
}
function PauseIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
}
function VolumeIcon({ level }: { level: number }) {
  if (level === 0) return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
  if (level < 0.5) return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
}
function LoadingSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.15" />
      <path d="M12 2a10 10 0 019.17 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function Player({
  current,
  isPlaying,
  loading,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onSeek,
  onVolume,
}: Props) {
  const [showVolume, setShowVolume] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(ratio * duration)
  }, [duration, onSeek])

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <AnimatePresence>
      {current && (
        <motion.footer
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-md"
        >
          {/* 播放进度 — 极简顶部细线 */}
          <div
            ref={progressRef}
            className="group relative h-1 cursor-pointer bg-zinc-800 transition-all hover:h-1.5"
            onClick={handleProgressClick}
          >
            <motion.div
              className="absolute left-0 top-0 h-full bg-cyan-400"
              style={{ width: `${progress}%` }}
              transition={{ type: 'tween', duration: 0.3 }}
            />
          </div>

          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2.5">
            {/* 左：曲目信息 */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                {current.thumbnail && (
                  <img src={current.thumbnail} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-zinc-100">{current.title}</p>
                <p className="truncate text-xs text-zinc-500">{current.uploader ?? ''}</p>
              </div>
            </div>

            {/* 中：播放控件 */}
            <div className="flex items-center gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:text-zinc-100">
                <PrevIcon />
              </button>
              <button
                onClick={onTogglePlay}
                disabled={loading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:text-zinc-100">
                <NextIcon />
              </button>
            </div>

            {/* 右：时间 + 音量 */}
            <div className="flex flex-1 items-center justify-end gap-3">
              <span className="text-[11px] tabular-nums text-zinc-500">
                {fmt(currentTime)} / {fmt(duration)}
              </span>

              <div className="relative">
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:text-zinc-100"
                >
                  <VolumeIcon level={volume} />
                </button>

                <AnimatePresence>
                  {showVolume && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-3"
                      onMouseLeave={() => setShowVolume(false)}
                    >
                      <div className="flex h-24 items-center justify-center">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={volume}
                          onChange={(e) => onVolume(Number(e.target.value))}
                          className="track-slider"
                          style={{
                            writingMode: 'vertical-lr',
                            direction: 'rtl',
                            width: '4px',
                            height: '80px',
                          }}
                        />
                      </div>
                      <p className="mt-1 text-center text-[10px] text-zinc-400">
                        {Math.round(volume * 100)}%
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  )
}

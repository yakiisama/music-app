import { AnimatePresence, motion } from 'framer-motion'
import type { DownloadTask, Track } from '../types'
import TrackCard from './TrackCard'

type Props = {
  tracks: Track[]
  loading?: boolean
  onPlay: (track: Track) => void
  onOpenDownload: (track: Track) => void
  tasks: Record<string, DownloadTask>
  currentId?: string
  isPlaying?: boolean
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="h-11 w-11 shrink-0 rounded-md bg-zinc-800 skeleton-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/5 rounded bg-zinc-800 skeleton-pulse" />
        <div className="h-2.5 w-2/5 rounded bg-zinc-800 skeleton-pulse" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-700">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <p className="mt-4 text-sm text-zinc-500">搜索你想听的音乐</p>
      <p className="mt-1 text-xs text-zinc-600">支持歌名、歌手、专辑关键词</p>
    </div>
  )
}

export default function TrackList({ tracks, loading, onPlay, onOpenDownload, tasks, currentId, isPlaying }: Props) {
  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    )
  }

  if (!tracks.length) {
    return <EmptyState />
  }

  return (
    <motion.section layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0.5">
      <AnimatePresence initial={false}>
        {tracks.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025 }}
          >
            <TrackCard
              track={track}
              onPlay={onPlay}
              onOpenDownload={onOpenDownload}
              task={tasks[track.id]}
              isCurrentPlaying={currentId === track.id && isPlaying}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.section>
  )
}

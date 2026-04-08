import { motion, AnimatePresence } from 'framer-motion'
import type { DownloadedFile, DownloadTask } from '../types'

type Props = {
  files: DownloadedFile[]
  tasks: Record<string, DownloadTask>
  downloadDir: string
  onOpenInFinder: (path: string) => void
  onOpenDir: () => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  )
}

function MusicNoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function ActiveDownloads({ tasks }: { tasks: Record<string, DownloadTask> }) {
  const active = Object.values(tasks).filter((t) => !t.done && !t.error)
  if (active.length === 0) return null

  return (
    <div className="mb-4 space-y-2">
      <p className="text-xs font-medium text-zinc-400">正在下载</p>
      {active.map((task) => (
        <div key={task.videoId} className="rounded-lg bg-zinc-800/50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="truncate text-[13px] text-zinc-300">{task.videoId}</span>
            <span className="ml-2 text-xs tabular-nums text-zinc-500">
              {Math.round(task.percent ?? 0)}%
            </span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-700">
            <motion.div
              className="h-full bg-cyan-400"
              animate={{ width: `${Math.max(2, task.percent ?? 0)}%` }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DownloadList({ files, tasks, downloadDir, onOpenInFinder, onOpenDir }: Props) {
  return (
    <div>
      <ActiveDownloads tasks={tasks} />

      {/* 标题行 */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400">
          已下载 ({files.length})
        </p>
        <button
          onClick={onOpenDir}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <FolderIcon />
          打开文件夹
        </button>
      </div>

      {downloadDir && (
        <p className="mb-3 text-[11px] text-zinc-600">
          {downloadDir}
        </p>
      )}

      {files.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <MusicNoteIcon />
          <p className="mt-3 text-sm text-zinc-500">还没有下载的歌曲</p>
          <p className="mt-1 text-xs text-zinc-600">搜索音乐后点击下载按钮开始</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-0.5">
            {files.map((file) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-800/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-500">
                  <MusicNoteIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-zinc-200">{file.name}</p>
                  <p className="text-[11px] text-zinc-600">{formatSize(file.sizeBytes)}</p>
                </div>
                <button
                  onClick={() => onOpenInFinder(file.path)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 opacity-0 transition-all hover:bg-zinc-700 hover:text-zinc-300 group-hover:opacity-100"
                  title="在 Finder 中显示"
                >
                  <ExternalIcon />
                </button>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}

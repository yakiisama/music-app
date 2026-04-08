export type Track = {
  id: string
  title: string
  durationSec?: number
  thumbnail?: string
  uploader?: string
}

export type DownloadQuality = 'flac' | 'mp3_320' | 'mp3_128' | 'mp4_1080' | 'mp4_720' | 'mp4_480'

export type DownloadTask = {
  videoId: string
  percent?: number
  message: string
  done: boolean
  error?: string
  savePath?: string
}

export type DownloadedFile = {
  name: string
  path: string
  sizeBytes: number
}

export type AppSettings = {
  downloadDir: string
  defaultQuality: DownloadQuality
  searchCount: number
}

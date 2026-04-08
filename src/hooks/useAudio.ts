import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useRef } from 'react'
import { isTauri } from '../lib/tauri'
import { usePlayerStore } from '../stores/playerStore'
import type { Track } from '../types'

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement>(null)

  const current = usePlayerStore((s) => s.current)
  const streamUrl = usePlayerStore((s) => s.streamUrl)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const setCurrent = usePlayerStore((s) => s.setCurrent)
  const setPlaying = usePlayerStore((s) => s.setPlaying)
  const setStreamUrl = usePlayerStore((s) => s.setStreamUrl)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const setLoadingStream = usePlayerStore((s) => s.setLoadingStream)
  const setError = usePlayerStore((s) => s.setError)

  const playTrack = useCallback(
    async (track: Track) => {
      if (!isTauri()) {
        setError('请在 Tauri 桌面端运行以使用播放功能')
        return
      }
      setCurrent(track)
      setLoadingStream(true)
      setError(undefined)
      try {
        const url = await invoke<string>('get_stream_url', { videoId: track.id })
        setStreamUrl(url)
        setPlaying(true)
      } catch (e) {
        setError(String(e))
      } finally {
        setLoadingStream(false)
      }
    },
    [setCurrent, setError, setLoadingStream, setPlaying, setStreamUrl],
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !streamUrl) return
    audio.src = streamUrl
    audio
      .play()
      .then(() => setPlaying(true))
      .catch((err) => setError(String(err)))
  }, [setError, setPlaying, streamUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, setPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0)
    const onLoaded = () => setDuration(audio.duration || 0)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
    }
  }, [setCurrentTime, setDuration, setPlaying])

  const togglePlay = useCallback(() => setPlaying(!isPlaying), [isPlaying, setPlaying])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
  }, [])

  return {
    audioRef,
    current,
    playTrack,
    togglePlay,
    seek,
  }
}

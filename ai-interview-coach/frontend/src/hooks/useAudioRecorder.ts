import { useState, useRef, useCallback } from 'react'

export type RecorderState = 'idle' | 'recording' | 'stopped'

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [durationSeconds, setDurationSeconds] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      mr.start(250) // collect data every 250ms
      startTimeRef.current = Date.now()
      setState('recording')

      timerRef.current = setInterval(() => {
        setDurationSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
      alert('Microphone access is required. Please allow it in your browser settings.')
    }
  }, [])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
      setState('stopped')
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state])

  const reset = useCallback(() => {
    setState('idle')
    setAudioBlob(null)
    setDurationSeconds(0)
    chunksRef.current = []
  }, [])

  return { state, audioBlob, durationSeconds, start, stop, reset }
}

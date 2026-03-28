import { useState, useRef, useCallback } from 'react'
import { blink } from '../blink/client'

type STTStatus = 'idle' | 'recording' | 'processing' | 'error'
type TTSStatus = 'idle' | 'loading' | 'playing' | 'error'

export function useVoice() {
  const [sttStatus, setSttStatus] = useState<STTStatus>('idle')
  const [ttsStatus, setTtsStatus] = useState<TTSStatus>('idle')
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const resolveRef = useRef<((text: string) => void) | null>(null)
  const rejectRef = useRef<((err: Error) => void) | null>(null)

  const isRecording = sttStatus === 'recording'
  const isProcessing = sttStatus === 'processing'

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        setSttStatus('processing')
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const arrayBuffer = await audioBlob.arrayBuffer()
          const { text } = await blink.ai.transcribeAudio({
            audio: arrayBuffer,
            mimeType: 'audio/webm',
          })
          setSttStatus('idle')
          resolveRef.current?.(text)
        } catch {
          setSttStatus('error')
          setTimeout(() => setSttStatus('idle'), 3000)
          rejectRef.current?.(new Error('Transcription failed'))
        }
      }

      mediaRecorder.start()
      setSttStatus('recording')
    } catch {
      setSttStatus('error')
      setTimeout(() => setSttStatus('idle'), 3000)
    }
  }, [])

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve
      rejectRef.current = reject

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    })
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setSttStatus('idle')
  }, [])

  const speak = useCallback(async (text: string, messageId: string) => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setSpeakingMessageId(messageId)
    setTtsStatus('loading')

    try {
      const { audio } = await blink.ai.generateSpeech({
        text: text.slice(0, 4000), // Limit for TTS
        voice: 'nova',
      })

      const blob = new Blob([audio], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audioEl = new Audio(url)
      audioRef.current = audioEl

      audioEl.onplay = () => setTtsStatus('playing')
      audioEl.onended = () => {
        setTtsStatus('idle')
        setSpeakingMessageId(null)
        URL.revokeObjectURL(url)
      }
      audioEl.onerror = () => {
        setTtsStatus('error')
        setSpeakingMessageId(null)
        setTimeout(() => setTtsStatus('idle'), 2000)
      }

      await audioEl.play()
    } catch {
      setTtsStatus('error')
      setSpeakingMessageId(null)
      setTimeout(() => setTtsStatus('idle'), 2000)
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setTtsStatus('idle')
    setSpeakingMessageId(null)
  }, [])

  return {
    sttStatus,
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
    ttsStatus,
    speakingMessageId,
    speak,
    stopSpeaking,
  }
}

import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mic, MicOff, Send, ChevronRight, Loader2, Clock, Volume2 } from 'lucide-react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { submitAudioAnswer, submitTextAnswer, AnswerFeedback } from '../utils/api'
import FeedbackCard from '../components/FeedbackCard'

interface LocationState {
  session_id: string
  first_question: string
  total_questions: number
  role: string
  company: string
}

export default function Interview() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  const [currentQuestion, setCurrentQuestion] = useState(state?.first_question || '')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [textMode, setTextMode] = useState(false)
  const [textAnswer, setTextAnswer] = useState('')
  const [timer, setTimer] = useState(0)
  const [inputStart, setInputStart] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const recorder = useAudioRecorder()

  useEffect(() => {
    if (!state?.session_id) navigate('/')
  }, [])

  useEffect(() => {
    if (recorder.state === 'recording' && !timerRef.current) {
      setInputStart(Date.now())
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000)
    } else if (recorder.state !== 'recording' && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [recorder.state])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleSubmitAudio = async () => {
    if (!recorder.audioBlob) return
    setLoading(true)
    try {
      const duration = inputStart ? (Date.now() - inputStart) / 1000 : recorder.durationSeconds
      const fb = await submitAudioAnswer(state.session_id, questionIndex, duration, recorder.audioBlob)
      setFeedback(fb)
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Error analyzing answer. Try text mode instead.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitText = async () => {
    if (!textAnswer.trim()) return
    setLoading(true)
    try {
      const duration = inputStart ? (Date.now() - inputStart) / 1000 : 60
      const fb = await submitTextAnswer(state.session_id, questionIndex, textAnswer, duration)
      setFeedback(fb)
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Error analyzing answer.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (!feedback) return
    if (feedback.is_last_question) {
      navigate(`/results/${state.session_id}`, { state: { role: state.role, company: state.company } })
      return
    }
    setCurrentQuestion(feedback.next_question!)
    setQuestionIndex((i) => i + 1)
    setFeedback(null)
    setTextAnswer('')
    setTimer(0)
    setInputStart(null)
    recorder.reset()
  }

  const startTextTimer = () => {
    if (!inputStart) {
      setInputStart(Date.now())
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000)
    }
  }

  const progress = ((questionIndex + (feedback ? 1 : 0)) / state.total_questions) * 100

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest">{state?.company}</p>
          <p className="text-sm text-gray-300">{state?.role}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Question</p>
          <p className="text-lg font-bold text-white">{questionIndex + 1} / {state?.total_questions}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 fade-in-up">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Volume2 size={14} className="text-brand-400" />
          </div>
          <p className="text-white text-lg leading-relaxed">{currentQuestion}</p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="fade-in-up mb-6">
          <FeedbackCard feedback={feedback} />
          <button
            onClick={handleNext}
            className="mt-4 w-full py-3.5 bg-brand-600 hover:bg-brand-700 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all"
          >
            {feedback.is_last_question ? 'View Full Report →' : (<>Next Question <ChevronRight size={18} /></>)}
          </button>
        </div>
      )}

      {/* Input area */}
      {!feedback && (
        <div className="fade-in-up space-y-4">
          {/* Mode toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setTextMode(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!textMode ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              🎙 Voice Answer
            </button>
            <button
              onClick={() => setTextMode(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${textMode ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              ⌨️ Type Answer
            </button>
          </div>

          {!textMode ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-5">
              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Clock size={14} />
                <span className="font-mono text-sm">{formatTime(timer)}</span>
              </div>

              {recorder.state === 'idle' && (
                <button
                  onClick={recorder.start}
                  className="w-20 h-20 rounded-full bg-brand-600 hover:bg-brand-700 flex items-center justify-center mx-auto transition-all hover:scale-105"
                >
                  <Mic size={32} className="text-white" />
                </button>
              )}

              {recorder.state === 'recording' && (
                <>
                  <button
                    onClick={recorder.stop}
                    className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center mx-auto recording-pulse"
                  >
                    <MicOff size={32} className="text-white" />
                  </button>
                  <p className="text-red-400 text-sm animate-pulse">Recording... tap to stop</p>
                </>
              )}

              {recorder.state === 'stopped' && (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center mx-auto">
                    <Mic size={24} className="text-green-400" />
                  </div>
                  <p className="text-green-400 text-sm">Recording complete ({recorder.durationSeconds}s)</p>
                  <div className="flex gap-3">
                    <button
                      onClick={recorder.reset}
                      className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Re-record
                    </button>
                    <button
                      onClick={handleSubmitAudio}
                      disabled={loading}
                      className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> Analyze</>}
                    </button>
                  </div>
                </div>
              )}

              {recorder.state === 'idle' && (
                <p className="text-gray-500 text-xs">Tap the mic to start recording your answer</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={textAnswer}
                onChange={(e) => { setTextAnswer(e.target.value); startTextTimer() }}
                placeholder="Type your answer here... Be as detailed as you would speak."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500 resize-none transition-colors placeholder-gray-600"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">{formatTime(timer)} elapsed · {textAnswer.split(/\s+/).filter(Boolean).length} words</span>
                <button
                  onClick={handleSubmitText}
                  disabled={loading || !textAnswer.trim()}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl text-sm font-medium text-white flex items-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> Analyze</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

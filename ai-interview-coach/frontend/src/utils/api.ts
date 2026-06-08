import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface StartSessionPayload {
  role: string
  company: string
  difficulty: string
  interview_type: string
}

export interface StartSessionResponse {
  session_id: string
  first_question: string
  total_questions: number
}

export interface AnswerFeedback {
  score: number
  relevance: string
  clarity: string
  depth: string
  filler_words: { word: string; count: number }[]
  filler_word_count: number
  words_per_minute: number
  suggested_answer: string
  next_question: string | null
  is_last_question: boolean
}

export interface SessionSummary {
  session_id: string
  role: string
  company: string
  overall_score: number
  total_questions: number
  avg_wpm: number
  total_filler_words: number
  strengths: string[]
  improvements: string[]
  question_scores: number[]
  detailed_feedbacks: AnswerFeedback[]
}

export const startSession = async (payload: StartSessionPayload): Promise<StartSessionResponse> => {
  const { data } = await api.post('/interview/start', payload)
  return data
}

export const submitAudioAnswer = async (
  sessionId: string,
  questionIndex: number,
  durationSeconds: number,
  audioBlob: Blob
): Promise<AnswerFeedback> => {
  const form = new FormData()
  form.append('session_id', sessionId)
  form.append('question_index', String(questionIndex))
  form.append('duration_seconds', String(durationSeconds))
  form.append('audio', audioBlob, 'answer.webm')
  const { data } = await api.post('/feedback/audio', form)
  return data
}

export const submitTextAnswer = async (
  sessionId: string,
  questionIndex: number,
  transcript: string,
  durationSeconds: number
): Promise<AnswerFeedback> => {
  const { data } = await api.post('/feedback/text', {
    session_id: sessionId,
    question_index: questionIndex,
    transcript,
    duration_seconds: durationSeconds,
  })
  return data
}

export const getSummary = async (sessionId: string): Promise<SessionSummary> => {
  const { data } = await api.get(`/report/summary/${sessionId}`)
  return data
}

export const getPdfUrl = (sessionId: string) => `/api/report/pdf/${sessionId}`

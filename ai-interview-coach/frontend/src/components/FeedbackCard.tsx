import React, { useState } from 'react'
import { AnswerFeedback } from '../utils/api'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  feedback: AnswerFeedback
}

const scoreColor = (s: number) => s >= 75 ? 'text-green-400' : s >= 50 ? 'text-amber-400' : 'text-red-400'
const scoreBg   = (s: number) => s >= 75 ? 'bg-green-500/10 border-green-500/30' : s >= 50 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'

export default function FeedbackCard({ feedback }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`rounded-2xl border p-5 ${scoreBg(feedback.score)} fade-in-up`}>
      {/* Score row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Answer Feedback</h3>
        <span className={`text-2xl font-bold ${scoreColor(feedback.score)}`}>{feedback.score}/100</span>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">WPM</p>
          <p className="text-sm font-medium text-white">{feedback.words_per_minute}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Filler words</p>
          <p className={`text-sm font-medium ${feedback.filler_word_count > 5 ? 'text-red-400' : feedback.filler_word_count > 2 ? 'text-amber-400' : 'text-green-400'}`}>
            {feedback.filler_word_count}
          </p>
        </div>
        {feedback.filler_words.length > 0 && (
          <div className="flex-1">
            <p className="text-xs text-gray-500">Detected</p>
            <p className="text-xs text-amber-400">{feedback.filler_words.map(f => `"${f.word}"`).join(', ')}</p>
          </div>
        )}
      </div>

      {/* Quick feedback */}
      <div className="space-y-2 text-sm text-gray-300">
        <p><span className="text-gray-500">Relevance: </span>{feedback.relevance}</p>
        <p><span className="text-gray-500">Clarity: </span>{feedback.clarity}</p>
      </div>

      {/* Expand for model answer */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-4 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Hide' : 'Show'} depth feedback & model answer
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3 text-sm fade-in-up">
          <p className="text-gray-300"><span className="text-gray-500">Depth: </span>{feedback.depth}</p>
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Model answer:</p>
            <p className="text-gray-200 italic leading-relaxed">{feedback.suggested_answer}</p>
          </div>
        </div>
      )}
    </div>
  )
}

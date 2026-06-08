import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSummary, getPdfUrl, SessionSummary } from '../utils/api'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { Download, Trophy, TrendingUp, AlertCircle, RotateCcw, Loader2 } from 'lucide-react'

const scoreColor = (s: number) => s >= 75 ? '#059669' : s >= 50 ? '#d97706' : '#dc2626'
const scoreBg = (s: number) => s >= 75 ? 'bg-green-500/10 border-green-500/30' : s >= 50 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'

export default function Results() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const meta = location.state as { role: string; company: string } | null

  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) return
    getSummary(sessionId)
      .then(setSummary)
      .catch(() => setError('Failed to load results. The session may have expired.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin text-brand-500 mx-auto" size={36} />
        <p className="text-gray-400">Generating your report...</p>
      </div>
    </div>
  )

  if (error || !summary) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-red-400">{error || 'Something went wrong.'}</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-brand-600 rounded-xl text-white">Back to Home</button>
      </div>
    </div>
  )

  const barData = summary.question_scores.map((s, i) => ({ name: `Q${i + 1}`, score: s }))

  const radarData = [
    { subject: 'Relevance', value: Math.round(summary.question_scores.reduce((a, b) => a + b, 0) / summary.question_scores.length) },
    { subject: 'Communication', value: Math.min(100, Math.round(summary.avg_wpm / 1.5)) },
    { subject: 'Depth', value: Math.max(0, 100 - summary.total_filler_words * 5) },
    { subject: 'Consistency', value: 100 - Math.round(Math.abs(Math.max(...summary.question_scores) - Math.min(...summary.question_scores)) / 2) },
    { subject: 'Fluency', value: Math.max(0, 100 - summary.total_filler_words * 4) },
  ]

  const grade = summary.overall_score >= 85 ? 'A' : summary.overall_score >= 70 ? 'B' : summary.overall_score >= 55 ? 'C' : 'D'

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto space-y-8 fade-in-up">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-500/30 rounded-full px-4 py-1.5 text-brand-400 text-sm mb-4">
          <Trophy size={14} /> Interview Complete
        </div>
        <h1 className="text-3xl font-bold text-white">{summary.role} · {summary.company}</h1>
        <p className="text-gray-400 mt-1">Here's your detailed performance breakdown</p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Score', value: `${summary.overall_score}/100`, highlight: true },
          { label: 'Grade', value: grade, highlight: false },
          { label: 'Avg WPM', value: summary.avg_wpm.toFixed(0), highlight: false },
          { label: 'Filler Words', value: summary.total_filler_words, highlight: false },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl border p-4 text-center ${m.highlight ? scoreBg(summary.overall_score) : 'bg-white/5 border-white/10'}`}>
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-2xl font-bold" style={{ color: m.highlight ? scoreColor(summary.overall_score) : 'white' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-medium text-gray-300 mb-4">Score per Question</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e8e8f0' }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={scoreColor(entry.score)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-medium text-gray-300 mb-4">Skill Radar</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-green-400" />
            <p className="font-medium text-green-400">Strengths</p>
          </div>
          <ul className="space-y-2">
            {summary.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-green-500 mt-0.5">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-amber-400" />
            <p className="font-medium text-amber-400">Improve On</p>
          </div>
          <ul className="space-y-2">
            {summary.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-amber-500 mt-0.5">→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Q&A Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Question Breakdown</h2>
        <div className="space-y-4">
          {summary.detailed_feedbacks.map((fb, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-gray-500">Q{i + 1}</span>
                <span className="text-sm font-bold" style={{ color: scoreColor(fb.score) }}>{fb.score}/100</span>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-gray-500">Relevance:</span> {fb.relevance}</p>
                <p><span className="text-gray-500">Clarity:</span> {fb.clarity}</p>
                <p><span className="text-gray-500">Depth:</span> {fb.depth}</p>
                {fb.filler_words.length > 0 && (
                  <p className="text-amber-400/80 text-xs">
                    Filler words: {fb.filler_words.map(f => `"${f.word}" ×${f.count}`).join(', ')}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Model answer:</p>
                  <p className="text-gray-200 text-sm italic">{fb.suggested_answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pb-10">
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3.5 border border-white/10 rounded-xl text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw size={16} /> New Interview
        </button>
        <a
          href={getPdfUrl(sessionId!)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={16} /> Download PDF Report
        </a>
      </div>
    </div>
  )
}

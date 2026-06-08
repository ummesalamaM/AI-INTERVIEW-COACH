import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startSession } from '../utils/api'
import { BrainCircuit, Loader2 } from 'lucide-react'

const ROLES = ['Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Product Manager']
const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Uber', 'Flipkart', 'Infosys', 'TCS', 'Startup']
const TYPES = [
  { value: 'technical', label: 'Technical', desc: 'DSA, coding concepts, CS fundamentals' },
  { value: 'behavioral', label: 'Behavioral', desc: 'STAR-format, teamwork, leadership' },
  { value: 'system_design', label: 'System Design', desc: 'Scalability, architecture, design' },
]
const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function Home() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    role: 'Software Engineer',
    company: 'Google',
    difficulty: 'medium',
    interview_type: 'technical',
    custom_company: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleStart = async () => {
    setLoading(true)
    setError('')
    try {
      const company = form.company === 'Startup' ? form.custom_company || 'a Startup' : form.company
      const res = await startSession({
        role: form.role,
        company,
        difficulty: form.difficulty,
        interview_type: form.interview_type,
      })
      navigate('/interview', { state: { ...res, role: form.role, company } })
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to start. Check your API keys.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl fade-in-up">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <BrainCircuit className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Interview Coach</h1>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-7">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target Role</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
            >
              {ROLES.map((r) => <option key={r} value={r} className="bg-gray-900">{r}</option>)}
            </select>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target Company</label>
            <select
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
            >
              {COMPANIES.map((c) => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
            </select>
            {form.company === 'Startup' && (
              <input
                type="text"
                placeholder="Enter company name..."
                value={form.custom_company}
                onChange={(e) => set('custom_company', e.target.value)}
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            )}
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Interview Type</label>
            <div className="grid grid-cols-3 gap-3">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => set('interview_type', t.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.interview_type === t.value
                      ? 'border-brand-500 bg-brand-600/20 text-white'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-medium text-sm">{t.label}</div>
                  <div className="text-xs mt-1 opacity-70">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Difficulty</label>
            <div className="flex gap-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => set('difficulty', d)}
                  className={`flex-1 py-2.5 rounded-xl border capitalize text-sm font-medium transition-all ${
                    form.difficulty === d
                      ? 'border-brand-500 bg-brand-600/20 text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={18} /> Generating Questions...</>
            ) : (
              'Start Interview →'
            )}
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">5 questions · AI-powered feedback · Downloadable PDF report</p>
      </div>
    </div>
  )
}

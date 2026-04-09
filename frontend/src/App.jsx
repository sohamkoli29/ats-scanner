import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Scan, ChevronRight, AlertCircle, FileSearch, RotateCcw, ChevronDown, Briefcase, Check } from 'lucide-react'
import JD_TEMPLATES from './utils/JD.json'
import DropZone from './components/DropZone'
import ScoreRing from './components/ScoreRing'
import SkillsPanel from './components/SkillsPanel'
import SuggestionsPanel from './components/SuggestionsPanel'
import KeywordDensityChart from './components/KeywordDensityChart'
import ScoreBreakdown from './components/ScoreBreakdown'
import LoadingSkeleton from './components/LoadingSkeleton'

const API_BASE = import.meta.env.VITE_API_URL || '/api'


const CATEGORIES = ['All', ...Array.from(new Set(JD_TEMPLATES.map(t => t.category)))]

export default function App() {
  const [resumeFile, setResumeFile] = useState(null)
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState([])

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedRole, setSelectedRole] = useState(null)
  const dropdownRef = useRef(null)

  const canSubmit = resumeFile && jdText.trim().length >= 50 && !loading

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelectRole = (template) => {
    setJdText(template.jd)
    setSelectedRole(template.role)
    setDropdownOpen(false)
  }

  const filteredTemplates = activeCategory === 'All'
    ? JD_TEMPLATES
    : JD_TEMPLATES.filter(t => t.category === activeCategory)

  const handleAnalyze = async () => {
    setErrors([])
    setResult(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('resume', resumeFile)
    formData.append('jd', jdText)

    try {
      const { data } = await axios.post(`${API_BASE}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors?.length) {
        setErrors(apiErrors)
      } else {
        setErrors(['Something went wrong. Please ensure the backend is running.'])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setErrors([])
    setResumeFile(null)
    setJdText('')
    setSelectedRole(null)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* ── Header ── */}
      <header className="border-b border-cream sticky top-0 z-50 backdrop-blur-sm bg-paper/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
              <FileSearch size={14} className="text-accent" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight">ATS Scanner</span>
          </div>
          <span className="text-muted text-xs font-mono hidden sm:block">
            TF-IDF · Cosine Similarity · NLP
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* ── Hero ── */}
        <div className="mb-10 animate-fade-up">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight tracking-tight">
            Beat the{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Algorithm.</span>
              <span
                className="absolute bottom-1 left-0 w-full h-3 rounded-sm -z-0"
                style={{ background: 'var(--accent)', opacity: 0.5 }}
              />
            </span>
          </h1>
          <p className="mt-3 text-muted text-base max-w-lg">
            Upload your resume, paste the job description — get an instant ATS compatibility
            score with matched skills, gaps, and actionable suggestions.
          </p>
        </div>

        {!result ? (
          /* ── Input Panel ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resume Upload */}
            <div
              className="rounded-2xl border border-cream bg-white/50 p-6 animate-fade-up stagger-1"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <label className="block font-display font-semibold text-sm mb-3">
                01 — Resume
              </label>
              <DropZone file={resumeFile} onFile={setResumeFile} />
            </div>

            {/* JD Input */}
            <div
              className="rounded-2xl border border-cream bg-white/50 p-6 animate-fade-up stagger-2"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              {/* Label row with dropdown trigger */}
              <div className="flex items-center justify-between mb-3">
                <label className="block font-display font-semibold text-sm">
                  02 — Job Description
                </label>

                {/* ── Role Selector Dropdown ── */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-body font-medium
                      transition-all duration-150 cursor-pointer
                      ${dropdownOpen
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-cream border-cream hover:border-muted text-ink hover:bg-cream/80'
                      }
                    `}
                  >
                    <Briefcase size={11} />
                    {selectedRole ? (
                      <span className="max-w-[100px] truncate">{selectedRole}</span>
                    ) : (
                      'Select Role'
                    )}
                    <ChevronDown
                      size={11}
                      className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Panel */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-cream bg-white shadow-xl z-50 overflow-hidden"
                      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
                    >
                      {/* Category filter pills */}
                      <div className="flex gap-1.5 p-3 border-b border-cream overflow-x-auto scrollbar-none flex-wrap">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`
                              flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-colors
                              ${activeCategory === cat
                                ? 'bg-ink text-paper'
                                : 'bg-cream text-muted hover:bg-cream/80 hover:text-ink'
                              }
                            `}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Role list */}
                      <div className="max-h-64 overflow-y-auto">
                        {filteredTemplates.map((template) => (
                          <button
                            key={template.role}
                            type="button"
                            onClick={() => handleSelectRole(template)}
                            className="w-full text-left px-4 py-3 hover:bg-cream/60 transition-colors flex items-center justify-between group border-b border-cream/60 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-body font-medium text-ink group-hover:text-teal transition-colors">
                                {template.role}
                              </p>
                              <p className="text-xs text-muted font-mono mt-0.5">{template.category}</p>
                            </div>
                            {selectedRole === template.role ? (
                              <Check size={13} className="text-teal flex-shrink-0" />
                            ) : (
                              <ChevronRight size={13} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Footer hint */}
                      <div className="px-4 py-2.5 border-t border-cream bg-cream/30">
                        <p className="text-xs text-muted font-mono">
                          Template loads as editable text
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected role badge */}
              {selectedRole && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-mono">
                    <Briefcase size={10} />
                    {selectedRole}
                  </span>
                  <span className="text-muted text-xs">— editable below</span>
                </div>
              )}

              <textarea
                className="w-full h-48 rounded-xl border border-cream bg-paper p-4 text-sm font-body
                           resize-none focus:outline-none focus:border-teal transition-colors
                           placeholder:text-muted/60"
                placeholder="Paste the full job description here…&#10;&#10;Or use 'Select Role' above to load a template."
                value={jdText}
                onChange={(e) => {
                  setJdText(e.target.value)
                  // If user edits, clear the selected role badge so it feels "custom"
                  // but keep the text — only swap happens when a new role is selected
                }}
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-muted text-xs">Min. 50 characters</span>
                <span className={`text-xs font-mono ${jdText.length < 50 ? 'text-rust' : 'text-teal'}`}>
                  {jdText.length} chars
                </span>
              </div>
            </div>

            {/* Error messages */}
            {errors.length > 0 && (
              <div className="lg:col-span-2 rounded-xl bg-rust/8 border border-rust/20 p-4 flex gap-3 animate-fade-up">
                <AlertCircle size={16} className="text-rust flex-shrink-0 mt-0.5" />
                <ul className="space-y-1">
                  {errors.map((e, i) => (
                    <li key={i} className="text-sm text-rust/90">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analyze Button */}
            <div className="lg:col-span-2 flex justify-center animate-fade-up stagger-3">
              <button
                onClick={handleAnalyze}
                disabled={!canSubmit}
                className={`
                  flex items-center gap-3 px-8 py-3.5 rounded-xl font-display font-semibold text-sm
                  transition-all duration-200 shadow-sm
                  ${canSubmit
                    ? 'bg-ink text-paper hover:bg-teal hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
                    : 'bg-cream text-muted cursor-not-allowed'
                  }
                `}
              >
                <Scan size={16} />
                Analyze Resume
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* ── Results Panel ── */
          <div className="space-y-6">
            {/* Top bar */}
            <div className="flex items-center justify-between animate-fade-up">
              <h2 className="font-display font-bold text-xl">Analysis Results</h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cream
                           text-sm font-body hover:border-ink hover:bg-cream/50 transition-all"
              >
                <RotateCcw size={14} />
                New Scan
              </button>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* Score + stats */}
                <div
                  className="rounded-2xl border border-cream bg-white/50 p-8 animate-fade-up stagger-1"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <ScoreRing score={result.match_score} />
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                      {[
                        { label: 'Matched Skills', value: result.matched_skills.length, color: 'text-teal' },
                        { label: 'Missing Skills', value: result.missing_skills.length, color: 'text-rust' },
                        { label: 'Resume Words', value: result.resume_word_count, color: 'text-ink' },
                        { label: 'JD Words', value: result.jd_word_count, color: 'text-muted' },
                        { label: 'Suggestions', value: result.suggestions.length, color: 'text-amber-600' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl bg-cream/60 p-4">
                          <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
                          <p className="text-muted text-xs mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score breakdown model */}
                <div className="animate-fade-up stagger-2">
                  <ScoreBreakdown breakdown={result.score_breakdown} />
                </div>

                {/* Skills */}
                <div className="animate-fade-up stagger-3">
                  <SkillsPanel
                    matched={result.matched_skills}
                    missing={result.missing_skills}
                  />
                </div>

                {/* Keyword density chart */}
                {Object.keys(result.keyword_density).length > 0 && (
                  <div className="animate-fade-up stagger-4">
                    <KeywordDensityChart density={result.keyword_density} />
                  </div>
                )}

                {/* Suggestions */}
                <div className="animate-fade-up stagger-5">
                  <SuggestionsPanel suggestions={result.suggestions} />
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-cream py-6 text-center">
        <p className="text-muted text-xs font-mono">
          ATS Scanner · TF-IDF + Cosine Similarity · scikit-learn · NLTK · Flask · React
        </p>
      </footer>
    </div>
  )
}
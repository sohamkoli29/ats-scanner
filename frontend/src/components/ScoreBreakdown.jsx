import { Target, Hash, TrendingUp, Star } from 'lucide-react'

const signals = [
  {
    key: 'skill_coverage',
    label: 'Skill Coverage',
    icon: Target,
    weight: '40%',
    color: '#1A6B5C',
    bg: '#D4F5E8',
    desc: 'JD skills found in resume',
  },
  {
    key: 'keyword_overlap',
    label: 'Keyword Overlap',
    icon: Hash,
    weight: '25%',
    color: '#2563EB',
    bg: '#DBEAFE',
    desc: 'TF-IDF + char n-gram similarity',
  },
  {
    key: 'keyword_density',
    label: 'Keyword Density',
    icon: TrendingUp,
    weight: '20%',
    color: '#D97706',
    bg: '#FEF3C7',
    desc: 'Richness of JD terms in resume',
  },
  {
    key: 'resume_quality',
    label: 'Resume Quality',
    icon: Star,
    weight: '15%',
    color: '#7C3AED',
    bg: '#EDE9FE',
    desc: 'Action verbs, metrics, structure',
  },
]

export default function ScoreBreakdown({ breakdown }) {
  if (!breakdown) return null

  return (
    <div className="rounded-2xl border border-cream bg-white/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm">Score Breakdown</h3>
        <span className="text-muted text-xs font-mono">4-signal hybrid model</span>
      </div>

      <div className="space-y-3">
        {signals.map(({ key, label, icon: Icon, weight, color, bg, desc }) => {
          const val = breakdown[key] ?? 0
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}
                  >
                    <Icon size={12} style={{ color }} />
                  </div>
                  <span className="text-xs font-body font-medium">{label}</span>
                  <span className="text-muted text-xs hidden sm:block">— {desc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono font-semibold"
                    style={{ color }}
                  >
                    {val}%
                  </span>
                  <span className="text-muted text-xs font-mono">×{weight}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-cream overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${val}%`,
                    background: color,
                    transitionDelay: '200ms',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Formula */}
      <div className="mt-4 pt-4 border-t border-cream">
        <p className="text-muted text-xs font-mono text-center">
          Score = (Skill×0.4) + (Overlap×0.25) + (Density×0.2) + (Quality×0.15)
        </p>
      </div>
    </div>
  )
}

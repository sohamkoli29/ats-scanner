import { CheckCircle2, XCircle } from 'lucide-react'

export default function SkillsPanel({ matched, missing }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Matched */}
      <div className="rounded-2xl border border-cream bg-white/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={16} className="text-teal" />
          <h3 className="font-display font-semibold text-sm">
            Matched Skills
            <span className="ml-2 px-2 py-0.5 rounded-full bg-teal/10 text-teal text-xs font-mono">
              {matched.length}
            </span>
          </h3>
        </div>
        {matched.length === 0 ? (
          <p className="text-muted text-xs italic">No common skills detected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {matched.map((skill) => (
              <span key={skill} className="skill-tag skill-tag-matched">
                ✓ {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Missing */}
      <div className="rounded-2xl border border-cream bg-white/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <XCircle size={16} className="text-rust" />
          <h3 className="font-display font-semibold text-sm">
            Missing Skills
            <span className="ml-2 px-2 py-0.5 rounded-full bg-rust/10 text-rust text-xs font-mono">
              {missing.length}
            </span>
          </h3>
        </div>
        {missing.length === 0 ? (
          <p className="text-muted text-xs italic">No missing skills — great coverage!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {missing.map((skill) => (
              <span key={skill} className="skill-tag skill-tag-missing">
                ✗ {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

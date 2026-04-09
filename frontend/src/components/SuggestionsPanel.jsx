import { Lightbulb } from 'lucide-react'

export default function SuggestionsPanel({ suggestions }) {
  return (
    <div className="rounded-2xl border border-cream bg-white/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={16} className="text-amber-500" />
        <h3 className="font-display font-semibold text-sm">Improvement Suggestions</h3>
      </div>
      <ol className="space-y-3">
        {suggestions.map((tip, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-mono font-medium flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-ink/80">{tip}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

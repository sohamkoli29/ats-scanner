export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Score ring placeholder */}
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-48 h-48 rounded-full shimmer" />
        <div className="w-32 h-7 rounded-full shimmer" />
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div key={i} className="rounded-2xl border border-cream p-5 space-y-3">
            <div className="w-32 h-5 rounded shimmer" />
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-6 rounded-full shimmer" style={{ width: `${60 + j * 10}px` }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div className="rounded-2xl border border-cream p-5 space-y-3">
        <div className="w-40 h-5 rounded shimmer" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 rounded shimmer" style={{ width: `${85 - i * 10}%` }} />
        ))}
      </div>
    </div>
  )
}

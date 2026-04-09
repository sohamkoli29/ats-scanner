import { useEffect, useRef } from 'react'

const getColor = (score) => {
  if (score >= 75) return '#1A6B5C'
  if (score >= 50) return '#C8F135'
  if (score >= 30) return '#E8A020'
  return '#C44B2B'
}

const getLabel = (score) => {
  if (score >= 75) return 'Excellent Match'
  if (score >= 50) return 'Good Match'
  if (score >= 30) return 'Partial Match'
  return 'Low Match'
}

export default function ScoreRing({ score }) {
  const pathRef = useRef(null)
  const circumference = 440
  const offset = circumference - (score / 100) * circumference
  const color = getColor(score)

  useEffect(() => {
    if (!pathRef.current) return
    // Trigger animation on mount
    pathRef.current.style.strokeDashoffset = circumference
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pathRef.current.style.strokeDashoffset = offset
      })
    })
  }, [score, offset])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="#EDE8DF"
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            ref={pathRef}
            cx="80" cy="80" r="70"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-800 text-4xl" style={{ color }}>
            {score}%
          </span>
        </div>
      </div>
      <span
        className="font-display font-semibold text-sm tracking-wider uppercase px-4 py-1.5 rounded-full"
        style={{ background: color + '22', color }}
      >
        {getLabel(score)}
      </span>
    </div>
  )
}

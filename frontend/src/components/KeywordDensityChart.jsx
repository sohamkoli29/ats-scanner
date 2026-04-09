import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { BarChart2 } from 'lucide-react'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink text-paper px-3 py-2 rounded-lg text-xs font-mono shadow-lg">
      <p className="font-semibold">{payload[0].payload.name}</p>
      <p className="text-accent">{payload[0].value}× in resume</p>
    </div>
  )
}

export default function KeywordDensityChart({ density }) {
  const data = Object.entries(density)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  if (data.length === 0) return null

  const COLORS = ['#1A6B5C', '#2A8A78', '#3AA090', '#4AB8A8', '#C8F135', '#D4F555']

  return (
    <div className="rounded-2xl border border-cream bg-white/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={16} className="text-teal" />
        <h3 className="font-display font-semibold text-sm">Keyword Density in Resume</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={24} margin={{ top: 4, right: 8, bottom: 24, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#8A8478' }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#8A8478' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

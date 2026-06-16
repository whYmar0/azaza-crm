import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import Ring from './Ring'
import type { MatchResult } from '../types'

interface MatchCardProps {
  match: MatchResult
  compact?: boolean
}

const icons = {
  ok: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
  warn: <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  bad: <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
}

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0">
        <Ring value={match.score} size={compact ? 80 : 100} />
      </div>
      {!compact && (
        <div className="flex-1 space-y-1.5 pt-1">
          {match.rows.map((row, i) => (
            <div key={i} className="flex items-start gap-2">
              {icons[row.status]}
              <span className="text-sm text-slate-700">{row.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

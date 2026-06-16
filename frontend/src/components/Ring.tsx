import { useEffect, useRef } from 'react'

interface RingProps {
  value: number
  size?: number
}

export default function Ring({ value, size = 120 }: RingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const clamped = Math.min(100, Math.max(0, value))

  const r = (size - 16) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (clamped / 100) * circumference

  const color =
    clamped >= 80 ? '#10b981' : clamped >= 55 ? '#f59e0b' : '#ef4444'

  useEffect(() => {
    if (!circleRef.current) return
    circleRef.current.style.strokeDashoffset = String(offset)
  }, [offset])

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={8}
        />
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="flex flex-col items-center" style={{ marginTop: `-${size * 0.72}px` }}>
        <span className="text-2xl font-bold text-slate-900" style={{ lineHeight: 1 }}>
          {clamped}
        </span>
        <span className="text-xs text-slate-500 mt-0.5">совпадение</span>
      </div>
    </div>
  )
}

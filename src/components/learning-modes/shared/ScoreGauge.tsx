import React from 'react'

interface ScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score))
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius
  const filled = (clampedScore / 100) * circumference
  const center = size / 2

  // Color based on score - using new warm palette
  let gradientColors = ['#EF4444', '#DC2626']
  if (clampedScore >= 70) gradientColors = ['#10B981', '#059669']
  else if (clampedScore >= 40) gradientColors = ['#F59E0B', '#D97706']

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${center + strokeWidth}`}>
        <defs>
          <linearGradient id={`scoreGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="100%" stopColor={gradientColors[1]} />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          style={{ color: 'var(--border-subtle)' }}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
          fill="none"
          stroke={`url(#scoreGradient-${score})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dasharray 700ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          strokeDasharray={`${filled} ${circumference}`}
        />
        {/* Score text */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          className="text-2xl font-bold"
          style={{ fill: 'var(--text-primary)' }}
        >
          {clampedScore}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          className="text-xs"
          style={{ fill: 'var(--text-tertiary)' }}
        >
          / 100
        </text>
      </svg>
    </div>
  )
}

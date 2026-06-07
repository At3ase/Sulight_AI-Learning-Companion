import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, BarChart3, Clock, Play, X } from 'lucide-react'
import { useSessionStore } from '@/stores/session.store'

/** Shows consecutive learning days with a flame icon */
export function StreakWidget({ onRemove }: { onRemove?: () => void }) {
  const [streak, setStreak] = useState<{ streak: number; recentDates: string[] } | null>(null)

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.db.analytics.learningStreak().then(setStreak).catch(() => {})
  }, [])

  return (
    <div className="card p-4 relative group">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <X size={14} />
        </button>
      )}
      <div className="flex items-center gap-2 mb-2">
        <Flame size={16} className="text-red-500" />
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          学习连续
        </span>
      </div>
      <div className="text-2xl font-bold" style={{ color: '#EF4444' }}>
        🔥 {streak?.streak || 0} 天
      </div>
      <p className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
        {streak && streak.streak > 0 ? '继续保持！' : '今天开始学习吧'}
      </p>
    </div>
  )
}

/** Shows today's study stats */
export function TodayStatsWidget({ onRemove }: { onRemove?: () => void }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState<{ sessions: number; minutes: number; cards: number } | null>(null)

  useEffect(() => {
    if (!window.electronAPI) return
    Promise.all([
      window.electronAPI.db.sessions.getStats().catch(() => null),
      window.electronAPI.db.flashcards.getStats().catch(() => null),
    ]).then(([s, f]) => {
      setStats({
        sessions: s?.totalSessions || 0,
        minutes: Math.round((s?.totalSeconds || 0) / 60),
        cards: f?.reviewedToday || 0,
      })
    })
  }, [])

  return (
    <div className="card p-4 relative group">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <X size={14} />
        </button>
      )}
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={16} className="text-primary-500" />
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          今日统计
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: stats?.sessions ?? '-', label: '会话', color: '#F97316' },
          { value: stats ? `${stats.minutes}分` : '-', label: '时长', color: '#10B981' },
          { value: stats?.cards ?? '-', label: '卡片', color: '#6366F1' },
        ].map((s, i) => (
          <div key={i}>
            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/progress')}
        className="mt-3 w-full text-caption py-1.5 rounded-md transition-colors hover:underline"
        style={{ color: 'var(--text-tertiary)' }}
      >
        查看详情 →
      </button>
    </div>
  )
}

/** Quick-launch focus mode */
export function FocusMiniWidget({ onRemove }: { onRemove?: () => void }) {
  const navigate = useNavigate()

  return (
    <div className="card p-4 relative group">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <X size={14} />
        </button>
      )}
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-amber-500" />
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          专注模式
        </span>
      </div>
      <p className="text-body-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
        番茄钟计时，25 分钟专注 + 5 分钟休息。
      </p>
      <button
        onClick={() => navigate('/focus')}
        className="w-full py-2 rounded-lg text-sm font-medium text-white transition-all duration-fast hover:shadow-md active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          boxShadow: '0 2px 8px rgba(249, 115, 22, 0.2)',
        }}
      >
        <Play size={14} className="inline mr-1" />
        开始专注
      </button>
    </div>
  )
}

/** Renders a single widget by ID */
export function renderExtraWidget(id: string, onRemove: () => void): React.ReactNode {
  switch (id) {
    case 'streak':
      return <StreakWidget key={id} onRemove={onRemove} />
    case 'today-stats':
      return <TodayStatsWidget key={id} onRemove={onRemove} />
    case 'focus-mini':
      return <FocusMiniWidget key={id} onRemove={onRemove} />
    default:
      return null
  }
}

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, Calendar, ArrowRight } from 'lucide-react'
import { useCourseStore } from '@/stores/course.store'

interface ExamCountdownBannerProps {
  onStartReview?: () => void
}

export function ExamCountdownBanner({ onStartReview }: ExamCountdownBannerProps) {
  const navigate = useNavigate()
  const { examCountdowns, loadExamCountdowns } = useCourseStore()

  useEffect(() => {
    loadExamCountdowns()
  }, [])

  if (examCountdowns.length === 0) return null

  const urgencyConfig = {
    critical: {
      bg: 'rgba(239, 68, 68, 0.06)',
      border: 'rgba(239, 68, 68, 0.25)',
      dotColor: '#EF4444',
      textColor: '#EF4444',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      label: '紧迫',
    },
    high: {
      bg: 'rgba(245, 158, 11, 0.06)',
      border: 'rgba(245, 158, 11, 0.25)',
      dotColor: '#F59E0B',
      textColor: '#F59E0B',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      label: '临近',
    },
    medium: {
      bg: 'rgba(20, 184, 166, 0.04)',
      border: 'rgba(20, 184, 166, 0.2)',
      dotColor: '#14B8A6',
      textColor: '#14B8A6',
      badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      label: '准备中',
    },
    low: {
      bg: 'rgba(99, 102, 241, 0.03)',
      border: 'rgba(99, 102, 241, 0.15)',
      dotColor: '#6366F1',
      textColor: '#6366F1',
      badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      label: '充裕',
    },
  }

  const urgent = examCountdowns.filter(e => e.urgency === 'critical' || e.urgency === 'high')
  const nonUrgent = examCountdowns.filter(e => e.urgency === 'medium' || e.urgency === 'low')

  // Show urgent first, then up to 2 non-urgent
  const visible = [...urgent, ...nonUrgent].slice(0, 5)

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-primary-500" />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            考试倒计时
          </h3>
          {urgent.length > 0 && (
            <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${urgencyConfig.critical.badge}`}>
              {urgent.length} 门临近
            </span>
          )}
        </div>
        {examCountdowns.length > 5 && (
          <button
            onClick={() => navigate('/courses')}
            className="text-caption flex items-center gap-1 transition-colors hover:text-primary-600"
            style={{ color: 'var(--text-tertiary)' }}
          >
            全部 {examCountdowns.length} 门 <ArrowRight size={12} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visible.map(c => {
          const config = urgencyConfig[c.urgency] || urgencyConfig.low
          const isUrgent = c.urgency === 'critical' || c.urgency === 'high'

          return (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-lg transition-all duration-fast"
              style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex-shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.dotColor }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {c.name}
                    </p>
                    <span className={`text-caption px-1.5 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-caption mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    距离考试还需{' '}
                    <span className="font-semibold" style={{ color: config.textColor }}>
                      {c.days_until_exam}
                    </span>{' '}
                    天
                    {c.days_until_exam <= 3 && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5" style={{ color: '#EF4444' }}>
                        <AlertTriangle size={10} />
                        急需复习
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Countdown bar */}
              <div className="flex-shrink-0 w-16 ml-3">
                <div className="flex items-center justify-between mb-0.5">
                  <Clock size={10} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-caption font-bold" style={{ color: config.textColor }}>
                    {c.days_until_exam < 1 ? '今天!' : `${c.days_until_exam}天`}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, 100 - (c.days_until_exam / 30) * 100))}%`,
                      background: config.textColor,
                    }}
                  />
                </div>
              </div>

              {isUrgent && onStartReview && (
                <button
                  onClick={onStartReview}
                  className="flex-shrink-0 ml-3 px-3 py-1.5 text-xs rounded-md text-white transition-all duration-fast hover:shadow-md active:scale-95"
                  style={{
                    background: c.urgency === 'critical'
                      ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                      : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  }}
                >
                  复习
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

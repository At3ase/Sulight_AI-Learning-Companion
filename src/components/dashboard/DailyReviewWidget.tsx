import React, { useEffect } from 'react'
import { useReviewStore } from '@/stores/review.store'
import { RefreshCw, BookOpen } from 'lucide-react'

interface DailyReviewWidgetProps {
  topicId?: string
  onStartReview?: () => void
  compact?: boolean
}

export const DailyReviewWidget: React.FC<DailyReviewWidgetProps> = ({ topicId, onStartReview, compact }) => {
  const { stats, isLoading, loadStats } = useReviewStore()

  useEffect(() => {
    loadStats(topicId)
  }, [topicId, loadStats])

  if (!stats || (stats.dueCards === 0 && stats.totalCards === 0)) {
    return null
  }

  if (compact) {
    return (
      <div
        className="card p-4 h-full"
        style={{
          borderLeft: '3px solid #14B8A6',
          backgroundColor: 'rgba(20, 184, 166, 0.04)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-teal-500" />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              每日复习
            </h3>
          </div>
          {stats.dueCards > 0 && (
            <span className="badge badge-warning text-caption">
              <RefreshCw size={12} className="mr-1" />
              {stats.dueCards} 待复习
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalCards}</div>
            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>总计</div>
          </div>
          <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.masteredCards}</div>
            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>已掌握</div>
          </div>
          <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--bg-inset)' }}>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stats.reviewedToday}</div>
            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>今日已复习</div>
          </div>
        </div>

        {/* Mini progress bar for due cards */}
        {stats.totalCards > 0 && (
          <div className="mb-3">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-inset)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round((stats.masteredCards / stats.totalCards) * 100)}%`,
                  background: 'linear-gradient(90deg, #14B8A6, #10B981)',
                }}
              />
            </div>
            <p className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
              掌握率 {stats.totalCards > 0 ? Math.round((stats.masteredCards / stats.totalCards) * 100) : 0}%
            </p>
          </div>
        )}

        {stats.dueCards > 0 && onStartReview && (
          <button
            onClick={onStartReview}
            className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all duration-fast hover:shadow-md active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
              boxShadow: '0 2px 8px rgba(20, 184, 166, 0.2)',
            }}
          >
            <RefreshCw size={14} className="inline mr-1" />
            开始复习
          </button>
        )}
      </div>
    )
  }

  // Original full layout
  return (
    <div
      className="card p-5"
      style={{
        borderLeft: '3px solid #14B8A6',
        backgroundColor: 'rgba(20, 184, 166, 0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-teal-500" />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            今日复习
          </h3>
        </div>
        {stats.dueCards > 0 && (
          <span className="badge badge-warning">
            <RefreshCw size={12} className="mr-1" />
            {stats.dueCards} 张待复习
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-inset)' }}>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalCards}</div>
          <div className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>总计</div>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-inset)' }}>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.masteredCards}</div>
          <div className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>已掌握</div>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-inset)' }}>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.reviewedToday}</div>
          <div className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>今日已复习</div>
        </div>
      </div>

      {stats.dueCards > 0 && onStartReview && (
        <button
          onClick={onStartReview}
          className="mt-4 w-full py-2.5 px-4 btn-primary text-sm"
        >
          <RefreshCw size={16} className="inline mr-1.5" />
          开始复习
        </button>
      )}
    </div>
  )
}

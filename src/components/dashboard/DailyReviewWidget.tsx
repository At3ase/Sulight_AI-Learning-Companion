import React, { useEffect } from 'react'
import { useReviewStore } from '@/stores/review.store'
import { RefreshCw, BookOpen, CheckCircle, TrendingUp } from 'lucide-react'

interface DailyReviewWidgetProps {
  topicId?: string
  onStartReview?: () => void
}

export const DailyReviewWidget: React.FC<DailyReviewWidgetProps> = ({ topicId, onStartReview }) => {
  const { stats, isLoading, loadStats } = useReviewStore()

  useEffect(() => {
    loadStats(topicId)
  }, [topicId, loadStats])

  if (!stats || (stats.dueCards === 0 && stats.totalCards === 0)) {
    return null
  }

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
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: 'var(--bg-inset)' }}
        >
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.totalCards}
          </div>
          <div className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>总计</div>
        </div>
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: 'var(--bg-inset)' }}
        >
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.masteredCards}
          </div>
          <div className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>已掌握</div>
        </div>
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: 'var(--bg-inset)' }}
        >
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.reviewedToday}
          </div>
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

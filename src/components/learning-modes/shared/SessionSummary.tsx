import React from 'react'

interface SessionSummaryProps {
  durationMinutes: number
  understandingScore: number | null
  previousScore?: number | null
  gapsCount: number
  jargonIssues: number
  streakDays: number
  cardsGenerated: number
  onGenerateMoreCards?: () => void
  onContinueLearning?: () => void
  onViewProgress?: () => void
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  durationMinutes,
  understandingScore,
  previousScore,
  gapsCount,
  jargonIssues,
  streakDays,
  cardsGenerated,
  onGenerateMoreCards,
  onContinueLearning,
  onViewProgress,
}) => {
  const scoreDelta = previousScore != null && understandingScore != null
    ? understandingScore - previousScore
    : null

  return (
    <div
      className="max-w-md mx-auto p-6 rounded-xl text-center space-y-5 animate-scale-in"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Title */}
      <div className="space-y-1">
        <div className="text-3xl mb-2">🎉</div>
        <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
          学习会话完成！
        </h2>
        <p className="text-body-sm" style={{ color: 'var(--text-tertiary)' }}>
          又是一次充实的学习之旅
        </p>
      </div>

      {/* Duration */}
      <div
        className="py-3 px-4 rounded-lg"
        style={{ backgroundColor: 'var(--bg-inset)' }}
      >
        <span className="text-3xl font-bold text-gradient-primary">{durationMinutes}</span>
        <span className="text-body-sm ml-1" style={{ color: 'var(--text-secondary)' }}>分钟</span>
      </div>

      {/* Score with delta */}
      {understandingScore != null && (
        <div className="space-y-1">
          <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
            理解力分数
          </div>
          <div className="text-3xl font-bold text-gradient-primary">
            {understandingScore}<span className="text-lg font-normal" style={{ color: 'var(--text-tertiary)' }}>/100</span>
          </div>
          {scoreDelta != null && (
            <div className={`text-sm font-medium ${scoreDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {scoreDelta >= 0 ? '↑' : '↓'} {Math.abs(scoreDelta)} 分
              {scoreDelta >= 0 ? ' 提升！' : ''}
            </div>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div
          className="rounded-lg p-3 space-y-1"
          style={{ backgroundColor: 'var(--bg-inset)' }}
        >
          <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">{gapsCount}</div>
          <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>发现知识盲区</div>
        </div>
        <div
          className="rounded-lg p-3 space-y-1"
          style={{ backgroundColor: 'var(--bg-inset)' }}
        >
          <div className="text-lg font-semibold text-teal-600 dark:text-teal-400">{jargonIssues}</div>
          <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>术语问题</div>
        </div>
        <div
          className="rounded-lg p-3 space-y-1"
          style={{ backgroundColor: 'var(--bg-inset)' }}
        >
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{cardsGenerated}</div>
          <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>生成复习卡片</div>
        </div>
        <div
          className="rounded-lg p-3 space-y-1"
          style={{ backgroundColor: 'var(--bg-inset)' }}
        >
          <div className="text-lg font-semibold text-gradient-primary">🔥 {streakDays}</div>
          <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>连续学习天数</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 pt-2">
        {onGenerateMoreCards && (
          <button
            onClick={onGenerateMoreCards}
            className="w-full py-2.5 px-4 btn-primary text-sm"
          >
            ✨ 生成更多复习卡片
          </button>
        )}
        {onContinueLearning && (
          <button
            onClick={onContinueLearning}
            className="w-full py-2.5 px-4 btn-secondary text-sm"
          >
            继续学习
          </button>
        )}
        {onViewProgress && (
          <button
            onClick={onViewProgress}
            className="w-full py-2 px-4 text-sm transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            查看学习进度 →
          </button>
        )}
      </div>
    </div>
  )
}

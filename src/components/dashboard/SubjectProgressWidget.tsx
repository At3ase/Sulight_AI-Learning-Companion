import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, Target, GraduationCap, Layers, ChevronRight } from 'lucide-react'
import { useKnowledgeStore, type SubjectProgressItem } from '@/stores/knowledge.store'

interface SubjectProgressWidgetProps {
  onStartReview?: () => void
}

export function SubjectProgressWidget({ onStartReview }: SubjectProgressWidgetProps) {
  const navigate = useNavigate()
  const { subjects, subjectProgress, loadSubjects, loadSubjectProgress } = useKnowledgeStore()

  useEffect(() => {
    loadSubjects()
    loadSubjectProgress()
  }, [])

  // Show nothing if no subjects exist
  if (subjects.length === 0) return null

  const progressMap = new Map(subjectProgress.map(p => [p.subjectId, p]))

  const getUrgencyClass = (days: number) => {
    if (days <= 3) return { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', text: '#EF4444', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    if (days <= 7) return { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', text: '#F59E0B', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    if (days <= 14) return { bg: 'rgba(20, 184, 166, 0.06)', border: 'rgba(20, 184, 166, 0.2)', text: '#14B8A6', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' }
    return { bg: 'rgba(99, 102, 241, 0.04)', border: 'rgba(99, 102, 241, 0.15)', text: '#6366F1', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' }
  }

  const progressBarColor = (pct: number) => {
    if (pct >= 80) return 'linear-gradient(90deg, #10B981, #34D399)'
    if (pct >= 40) return 'linear-gradient(90deg, #F59E0B, #FBBF24)'
    if (pct > 0) return 'linear-gradient(90deg, #F97316, #FB923C)'
    return 'var(--bg-inset)'
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-indigo-500" />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            学习进度概览
          </h3>
        </div>
        {subjects.length > 0 && (
          <button
            onClick={() => navigate('/knowledge')}
            className="text-caption flex items-center gap-1 transition-colors hover:text-primary-600"
            style={{ color: 'var(--text-tertiary)' }}
          >
            知识库 <ChevronRight size={12} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {subjects.map(subject => {
          const progress = progressMap.get(subject.id)
          const topicPct = progress?.topicProgress ?? 0
          const cardPct = progress?.cardProgress ?? 0
          const goalPct = progress?.goalProgress ?? 0
          const exam = progress?.upcomingExam ?? null

          return (
            <div
              key={subject.id}
              className="rounded-lg p-4 transition-all duration-fast"
              style={{
                backgroundColor: 'var(--bg-inset)',
                borderLeft: `3px solid ${subject.color || '#6366F1'}`,
              }}
            >
              {/* Subject header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color || '#6366F1' }}
                  />
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {subject.name}
                  </span>
                  {progress && progress.totalMinutes > 0 && (
                    <span className="text-caption flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                      <Clock size={11} />
                      {progress.totalMinutes >= 60
                        ? `${Math.floor(progress.totalMinutes / 60)} 小时`
                        : `${progress.totalMinutes} 分钟`}
                    </span>
                  )}
                </div>
                {exam && (
                  <div
                    className={`text-caption font-medium px-2 py-0.5 rounded-full ${getUrgencyClass(exam.daysUntil).badge}`}
                  >
                    {exam.daysUntil} 天
                  </div>
                )}
              </div>

              {/* Exam countdown bar */}
              {exam && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                      <Target size={11} />
                      考试: {exam.name}
                    </span>
                    <span className="text-caption font-semibold" style={{ color: getUrgencyClass(exam.daysUntil).text }}>
                      {exam.daysUntil} 天
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0, 100 - (exam.daysUntil / 30) * 100)}%`,
                        background: getUrgencyClass(exam.daysUntil).text,
                        opacity: 0.4,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Topic progress */}
              {progress && progress.totalTopics > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                      <BookOpen size={11} />
                      章节进度
                    </span>
                    <span className="text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {progress.studiedTopics}/{progress.totalTopics} ({topicPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${topicPct}%`, background: progressBarColor(topicPct) }}
                    />
                  </div>
                </div>
              )}

              {/* Flashcard progress */}
              {progress && progress.totalCards > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                      <GraduationCap size={11} />
                      卡片掌握
                    </span>
                    <span className="text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {progress.masteredCards}/{progress.totalCards} ({cardPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cardPct}%`, background: progressBarColor(cardPct) }}
                    />
                  </div>
                </div>
              )}

              {/* Goals progress */}
              {progress && progress.totalGoals > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                      <Target size={11} />
                      学习目标
                    </span>
                    <span className="text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {progress.completedGoals}/{progress.totalGoals} ({goalPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${goalPct}%`, background: progressBarColor(goalPct) }}
                    />
                  </div>
                </div>
              )}

              {/* Empty state for subject with no content yet */}
              {(!progress || (progress.totalTopics === 0 && progress.totalCards === 0 && progress.totalGoals === 0)) && (
                <div className="flex items-center gap-2">
                  <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                    暂无学习内容 — 添加课程和资料开始学习
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/knowledge')
                    }}
                    className="text-caption font-medium transition-colors hover:underline"
                    style={{ color: subject.color }}
                  >
                    前往 →
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

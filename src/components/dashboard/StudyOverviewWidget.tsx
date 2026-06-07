import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, Target, Layers, AlertTriangle } from 'lucide-react'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { useCourseStore } from '@/stores/course.store'

/**
 * Merged widget: subject progress + exam countdown in one compact card.
 * Takes ~55% width in a 2-column row.
 */
export function StudyOverviewWidget() {
  const navigate = useNavigate()
  const { subjects, subjectProgress, loadSubjects, loadSubjectProgress } = useKnowledgeStore()
  const { examCountdowns, loadExamCountdowns } = useCourseStore()

  useEffect(() => {
    loadSubjects()
    loadSubjectProgress()
    loadExamCountdowns()
  }, [])

  if (subjects.length === 0 && examCountdowns.length === 0) return null

  const progressMap = new Map(subjectProgress.map(p => [p.subjectId, p]))
  const examMap = new Map(examCountdowns.map(e => [e.subject_id || e.id, e]))

  const urgencyBadge = (days: number) => {
    if (days <= 3) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
    if (days <= 7) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
  }

  const progressColor = (pct: number) => {
    if (pct >= 80) return 'linear-gradient(90deg, #10B981, #34D399)'
    if (pct >= 40) return 'linear-gradient(90deg, #F59E0B, #FBBF24)'
    if (pct > 0) return 'linear-gradient(90deg, #F97316, #FB923C)'
    return 'var(--bg-base)'
  }

  // Merge subjects + exam countdowns into unified rows
  const rows: Array<{
    key: string
    name: string
    color: string
    pct: number
    detail: string
    examDays: number | null
    examName: string | null
    type: 'subject' | 'exam-only'
  }> = []

  subjects.forEach(s => {
    const p = progressMap.get(s.id)
    const e = examMap.get(s.id)
    const pct = p?.topicProgress ?? 0
    const detail = p && p.totalTopics > 0
      ? `${p.studiedTopics}/${p.totalTopics} 章节`
      : '暂无内容'
    rows.push({
      key: s.id,
      name: s.name,
      color: s.color || '#6366F1',
      pct,
      detail,
      examDays: e?.days_until_exam ?? p?.upcomingExam?.daysUntil ?? null,
      examName: e?.name ?? p?.upcomingExam?.name ?? null,
      type: 'subject',
    })
  })

  // Add exam-only entries (exams not linked to any subject)
  examCountdowns.forEach(e => {
    const alreadyListed = subjects.some(s => s.id === e.subject_id)
    if (!alreadyListed) {
      rows.push({
        key: `exam-${e.id}`,
        name: e.name,
        color: '#EF4444',
        pct: Math.max(0, 100 - (e.days_until_exam / 30) * 100),
        detail: e.name || '',
        examDays: e.days_until_exam,
        examName: e.name,
        type: 'exam-only',
      })
    }
  })

  return (
    <div className="card p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-indigo-500" />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            学习概览
          </h3>
        </div>
        {subjects.length > 0 && (
          <button
            onClick={() => navigate('/knowledge')}
            className="text-caption transition-colors hover:text-primary-600"
            style={{ color: 'var(--text-tertiary)' }}
          >
            知识库 →
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {rows.slice(0, 6).map(row => (
          <div key={row.key} className="group">
            {/* Row header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {row.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                  {row.pct}%
                </span>
                {row.examDays != null && (
                  <span className={`text-caption px-1.5 py-0.5 rounded-full font-medium ${urgencyBadge(row.examDays)}`}>
                    {row.examDays <= 0 ? '今天!' : `${row.examDays}天`}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-inset)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${row.pct}%`, background: progressColor(row.pct) }}
              />
            </div>

            {/* Sub-detail */}
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                {row.detail}
              </span>
              {row.examDays != null && row.examDays <= 3 && (
                <span className="text-caption flex items-center gap-0.5" style={{ color: '#EF4444' }}>
                  <AlertTriangle size={10} />
                  急需复习
                </span>
              )}
            </div>
          </div>
        ))}

        {rows.length > 6 && (
          <p className="text-caption text-center" style={{ color: 'var(--text-tertiary)' }}>
            +{rows.length - 6} 更多...
          </p>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCourseStore } from '@/stores/course.store'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import toast from 'react-hot-toast'
import type { Course } from '@/types/database'

interface CourseFormProps {
  course: Course | null
  onClose: () => void
  onSaved: () => void
}

export function CourseForm({ course, onClose, onSaved }: CourseFormProps) {
  const { createCourse, updateCourse } = useCourseStore()
  const { subjects, loadSubjects } = useKnowledgeStore()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: course?.name || '',
    subject_id: course?.subject_id || '',
    instructor: course?.instructor || '',
    semester: course?.semester || getCurrentSemester(),
    exam_date: course?.exam_date || '',
    credits: course?.credits || 0,
  })

  useEffect(() => {
    loadSubjects()
  }, [])

  function getCurrentSemester(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    return month >= 2 && month <= 7 ? `${year}-spring` : `${year}-fall`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('请输入课程名称')
      return
    }
    if (!form.subject_id) {
      toast.error('请选择关联学科')
      return
    }

    setSaving(true)
    try {
      if (course) {
        await updateCourse(course.id, form)
        toast.success('课程已更新')
      } else {
        await createCourse(form)
        toast.success('课程已创建')
      }
      onSaved()
    } catch (err: any) {
      toast.error(`保存失败：${err?.message || '未知错误'}`)
    } finally {
      setSaving(false)
    }
  }

  const update = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div
        className="rounded-xl w-full max-w-md mx-4 p-6 animate-scale-in"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.10)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3" style={{ color: 'var(--text-primary)' }}>{course ? '编辑课程' : '添加课程'}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course name */}
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>课程名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="例如：高等数学、数据结构"
              className="input-field"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>关联学科 *</label>
            <select
              value={form.subject_id}
              onChange={e => update('subject_id', e.target.value)}
              className="input-field"
            >
              <option value="">选择学科...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          {/* Instructor */}
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>授课教师</label>
            <input
              type="text"
              value={form.instructor}
              onChange={e => update('instructor', e.target.value)}
              placeholder="教师姓名（可选）"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Semester */}
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>学期</label>
              <select
                value={form.semester}
                onChange={e => update('semester', e.target.value)}
                className="input-field"
              >
                <option value="2025-spring">2025 春季</option>
                <option value="2025-fall">2025 秋季</option>
                <option value="2026-spring">2026 春季</option>
                <option value="2026-fall">2026 秋季</option>
              </select>
            </div>

            {/* Credits */}
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>学分</label>
              <input
                type="number"
                value={form.credits}
                onChange={e => update('credits', parseInt(e.target.value) || 0)}
                min="0"
                max="10"
                step="0.5"
                className="input-field"
              />
            </div>
          </div>

          {/* Exam date */}
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-primary)' }}>考试日期</label>
            <input
              type="date"
              value={form.exam_date}
              onChange={e => update('exam_date', e.target.value)}
              className="input-field"
            />
            {form.exam_date && (
              <p className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {(() => {
                  const exam = new Date(form.exam_date)
                  const now = new Date()
                  const diff = Math.ceil((exam.getTime() - now.getTime()) / 86400000)
                  if (diff < 0) return '考试日期已过'
                  if (diff === 0) return '考试就在今天！'
                  return `距离考试还有 ${diff} 天`
                })()}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 btn-secondary text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 btn-primary text-sm disabled:opacity-50"
            >
              {saving ? '保存中...' : course ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Trash2, Clock, AlertTriangle, Award, Sparkles } from 'lucide-react'
import { useCourseStore } from '@/stores/course.store'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { CourseForm } from './CourseForm'
import type { Course } from '@/types/database'

export function CourseListView() {
  const navigate = useNavigate()
  const { courses, isLoading, loadCourses, loadExamCountdowns, examCountdowns, deleteCourse } = useCourseStore()
  const { subjects, loadSubjects } = useKnowledgeStore()
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  useEffect(() => {
    loadCourses()
    loadExamCountdowns()
    loadSubjects()
  }, [])

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || '未分类'
  }

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'critical': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#DC2626', border: 'rgba(239, 68, 68, 0.2)' }
      case 'high': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#B45309', border: 'rgba(245, 158, 11, 0.2)' }
      case 'medium': return { bg: 'rgba(249, 115, 22, 0.1)', text: '#C2410C', border: 'rgba(249, 115, 22, 0.2)' }
      case 'low': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' }
      default: return { bg: 'var(--bg-inset)', text: 'var(--text-secondary)', border: 'var(--border-subtle)' }
    }
  }

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '紧急'
      case 'high': return '临近'
      case 'medium': return '适中'
      case 'low': return '充裕'
      default: return ''
    }
  }

  const countdownForCourse = (courseId: string) => {
    return examCountdowns.find(e => e.id === courseId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: 'var(--text-tertiary)' }}>加载课程...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-primary-500" />
            <span className="text-caption font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
              学期规划
            </span>
          </div>
          <h1 className="text-h1 mb-1" style={{ color: 'var(--text-primary)' }}>课程管理</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            管理课程与考试倒计时，将学习与学期节奏同步。
          </p>
        </div>
        <button
          onClick={() => { setEditingCourse(null); setShowForm(true) }}
          className="btn-primary text-sm"
        >
          + 添加课程
        </button>
      </div>

      {/* Exam Urgency Alerts */}
      {examCountdowns.filter(e => e.urgency === 'critical' || e.urgency === 'high').length > 0 && (
        <div className="space-y-2">
          {examCountdowns
            .filter(e => e.urgency === 'critical' || e.urgency === 'high')
            .map(c => {
              const style = getUrgencyStyle(c.urgency)
              return (
                <div
                  key={c.id}
                  className="card p-4 flex items-center justify-between"
                  style={{
                    borderLeft: `3px solid ${style.text}`,
                    backgroundColor: style.bg,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {c.urgency === 'critical'
                      ? <AlertTriangle size={18} className="text-red-500" />
                      : <Clock size={18} className="text-amber-500" />
                    }
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                      <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>
                        距离考试还有 <strong style={{ color: style.text }}>{c.days_until_exam}</strong> 天
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/review')}
                    className="px-3 py-1.5 text-xs rounded-md text-white transition-all duration-fast"
                    style={{
                      background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.2)',
                    }}
                  >
                    去复习
                  </button>
                </div>
              )
            })}
        </div>
      )}

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto mb-3" style={{ color: 'var(--border-strong)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>还没有添加课程</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>添加课程以跟踪考试倒计时和学习进度</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {courses.map(course => {
            const cd = countdownForCourse(course.id)
            const urgencyStyle = cd ? getUrgencyStyle(cd.urgency) : null
            return (
              <div key={course.id} className="card p-4 card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{course.name}</h3>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{getSubjectName(course.subject_id)}</span>
                      {cd && urgencyStyle && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: urgencyStyle.bg,
                            color: urgencyStyle.text,
                          }}
                        >
                          {cd.days_until_exam} 天 · {getUrgencyLabel(cd.urgency)}
                        </span>
                      )}
                    </div>
                    {course.instructor && (
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{course.instructor}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-caption" style={{ color: 'var(--text-tertiary)' }}>
                      <span>学期：{course.semester || '未设置'}</span>
                      {course.credits > 0 && <span>学分：{course.credits}</span>}
                      {course.exam_date && <span>考试日期：{course.exam_date}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingCourse(course); setShowForm(true) }}
                      className="text-xs transition-colors hover:text-primary-600"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定删除此课程？相关的学习目标也会被删除。')) {
                          deleteCourse(course.id)
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          course={editingCourse}
          onClose={() => { setShowForm(false); setEditingCourse(null) }}
          onSaved={() => { setShowForm(false); setEditingCourse(null); loadCourses(); loadExamCountdowns() }}
        />
      )}
    </div>
  )
}

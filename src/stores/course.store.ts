import { create } from 'zustand'
import type { Course, StudyGoal } from '@/types/database'

interface ExamCountdown extends Course {
  days_until_exam: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
}

interface CourseState {
  courses: Course[]
  goals: StudyGoal[]
  examCountdowns: ExamCountdown[]
  isLoading: boolean

  loadCourses: () => Promise<void>
  loadGoals: (courseId: string) => Promise<void>
  loadExamCountdowns: () => Promise<void>
  createCourse: (data: Partial<Course>) => Promise<Course | null>
  updateCourse: (id: string, data: Partial<Course>) => Promise<Course | null>
  deleteCourse: (id: string) => Promise<void>
  createGoal: (data: Partial<StudyGoal>) => Promise<StudyGoal | null>
  toggleGoal: (id: string) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  goals: [],
  examCountdowns: [],
  isLoading: false,

  loadCourses: async () => {
    if (!window.electronAPI) return
    set({ isLoading: true })
    try {
      const courses = await window.electronAPI.db.courses.list()
      set({ courses, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadGoals: async (courseId: string) => {
    if (!window.electronAPI) return
    try {
      const goals = await window.electronAPI.db.studyGoals.listByCourse(courseId)
      set({ goals })
    } catch { /* keep previous */ }
  },

  loadExamCountdowns: async () => {
    if (!window.electronAPI) return
    try {
      const examCountdowns = await window.electronAPI.db.courses.getExamCountdown()
      set({ examCountdowns })
    } catch { /* keep previous */ }
  },

  createCourse: async (data) => {
    if (!window.electronAPI) return null
    try {
      const course = await window.electronAPI.db.courses.create(data)
      set(state => ({ courses: [...state.courses, course] }))
      get().loadExamCountdowns()
      return course
    } catch { return null }
  },

  updateCourse: async (id, data) => {
    if (!window.electronAPI) return null
    try {
      const course = await window.electronAPI.db.courses.update(id, data)
      set(state => ({
        courses: state.courses.map(c => c.id === id ? course : c),
        examCountdowns: state.examCountdowns.map(e => e.id === id ? { ...e, ...course } as ExamCountdown : e),
      }))
      return course
    } catch { return null }
  },

  deleteCourse: async (id) => {
    if (!window.electronAPI) return
    try {
      await window.electronAPI.db.courses.delete(id)
      set(state => ({
        courses: state.courses.filter(c => c.id !== id),
        examCountdowns: state.examCountdowns.filter(e => e.id !== id),
      }))
    } catch { /* silent */ }
  },

  createGoal: async (data) => {
    if (!window.electronAPI) return null
    try {
      const goal = await window.electronAPI.db.studyGoals.create(data)
      set(state => ({ goals: [...state.goals, goal] }))
      return goal
    } catch { return null }
  },

  toggleGoal: async (id) => {
    if (!window.electronAPI) return
    try {
      const updated = await window.electronAPI.db.studyGoals.toggle(id)
      if (updated) {
        set(state => ({
          goals: state.goals.map(g => g.id === id ? updated : g),
        }))
      }
    } catch { /* silent */ }
  },

  deleteGoal: async (id) => {
    if (!window.electronAPI) return
    try {
      await window.electronAPI.db.studyGoals.delete(id)
      set(state => ({ goals: state.goals.filter(g => g.id !== id) }))
    } catch { /* silent */ }
  },
}))

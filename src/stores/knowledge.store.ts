import { create } from 'zustand'
import type { Subject, Topic, Material } from '../types/database'

export interface SubjectProgressItem {
  subjectId: string
  subjectName: string
  subjectColor: string
  totalTopics: number
  studiedTopics: number
  topicProgress: number
  totalGoals: number
  completedGoals: number
  goalProgress: number
  totalMinutes: number
  totalCards: number
  masteredCards: number
  cardProgress: number
  upcomingExam: {
    name: string
    examDate: string
    daysUntil: number
  } | null
}

interface KnowledgeState {
  subjects: Subject[]
  selectedSubjectId: string | null
  selectedSubject: Subject | null
  topics: Topic[]
  materials: Material[]
  selectedTopicId: string | null
  subjectProgress: SubjectProgressItem[]

  loadSubjects: () => Promise<void>
  createSubject: (data: Partial<Subject>) => Promise<Subject | null>
  updateSubject: (id: string, data: Partial<Subject>) => Promise<Subject | null>
  deleteSubject: (id: string) => Promise<void>
  selectSubject: (id: string | null) => void
  loadTopics: (subjectId: string) => Promise<void>
  createTopic: (data: Partial<Topic>) => Promise<Topic | null>
  updateTopic: (id: string, data: Partial<Topic>) => Promise<Topic | null>
  deleteTopic: (id: string) => Promise<void>
  selectTopic: (id: string | null) => void
  loadMaterials: (topicId: string) => Promise<void>
  updateMaterial: (id: string, data: { title: string }) => Promise<Material | null>
  searchMaterials: (query: string) => Promise<void>
  loadSubjectProgress: () => Promise<void>
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  subjects: [],
  selectedSubjectId: null,
  selectedSubject: null,
  topics: [],
  materials: [],
  selectedTopicId: null,

  subjectProgress: [],

  loadSubjects: async () => {
    if (!window.electronAPI) return
    const subjects = await window.electronAPI.db.subjects.list()
    set({ subjects })
  },

  createSubject: async (data) => {
    if (!window.electronAPI) return null
    const subject = await window.electronAPI.db.subjects.create(data)
    await get().loadSubjects()
    return subject
  },

  updateSubject: async (id, data) => {
    if (!window.electronAPI) return null
    const updated = await window.electronAPI.db.subjects.update(id, data)
    if (updated) {
      set((s) => ({
        subjects: s.subjects.map((sub) => sub.id === id ? updated : sub),
        selectedSubject: s.selectedSubjectId === id ? updated : s.selectedSubject,
      }))
    }
    return updated
  },

  deleteSubject: async (id) => {
    if (!window.electronAPI) return
    await window.electronAPI.db.subjects.delete(id)
    set((s) => ({
      subjects: s.subjects.filter((sub) => sub.id !== id),
      selectedSubjectId: s.selectedSubjectId === id ? null : s.selectedSubjectId,
      topics: s.selectedSubjectId === id ? [] : s.topics,
    }))
  },

  selectSubject: (id) => {
    const subject = id ? get().subjects.find((s) => s.id === id) || null : null
    set({ selectedSubjectId: id, selectedSubject: subject, topics: [], materials: [], selectedTopicId: null })
    if (id) get().loadTopics(id)
  },

  loadTopics: async (subjectId) => {
    if (!window.electronAPI) return
    const topics = await window.electronAPI.db.topics.listBySubject(subjectId)
    set({ topics })
  },

  createTopic: async (data) => {
    if (!window.electronAPI) return null
    const topic = await window.electronAPI.db.topics.create(data)
    const selectedSubjectId = get().selectedSubjectId
    if (selectedSubjectId) await get().loadTopics(selectedSubjectId)
    return topic
  },

  updateTopic: async (id, data) => {
    if (!window.electronAPI) return null
    const updated = await window.electronAPI.db.topics.update(id, data)
    if (updated) {
      set((s) => ({
        topics: s.topics.map((t) => t.id === id ? updated : t),
      }))
    }
    return updated
  },

  deleteTopic: async (id) => {
    if (!window.electronAPI) return
    await window.electronAPI.db.topics.delete(id)
    set((s) => ({
      topics: s.topics.filter((t) => t.id !== id),
      selectedTopicId: s.selectedTopicId === id ? null : s.selectedTopicId,
      materials: s.selectedTopicId === id ? [] : s.materials,
    }))
  },

  selectTopic: (id) => {
    set({ selectedTopicId: id })
    if (id) get().loadMaterials(id)
  },

  loadMaterials: async (topicId) => {
    if (!window.electronAPI) return
    const materials = await window.electronAPI.db.materials.listByTopic(topicId)
    set({ materials })
  },

  updateMaterial: async (id, data) => {
    if (!window.electronAPI) return null
    const updated = await window.electronAPI.db.materials.update(id, data)
    if (updated) {
      set((s) => ({
        materials: s.materials.map((m) => m.id === id ? updated : m),
      }))
    }
    return updated
  },

  searchMaterials: async (query) => {
    if (!window.electronAPI) return
    if (!query) {
      set({ materials: [] })
      return
    }
    const materials = await window.electronAPI.db.materials.search(query)
    set({ materials })
  },

  loadSubjectProgress: async () => {
    if (!window.electronAPI) return
    try {
      const subjectProgress = await window.electronAPI.db.analytics.subjectProgress()
      set({ subjectProgress })
    } catch { /* keep previous */ }
  },
}))

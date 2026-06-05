import { create } from 'zustand'
import type { StudySession, SessionMode } from '../types/database'

interface SessionState {
  activeSession: StudySession | null
  sessions: StudySession[]
  elapsedSeconds: number
  timerInterval: ReturnType<typeof setInterval> | null
  autoGenerateCards: boolean

  startSession: (title: string, mode: SessionMode, subjectId?: string, topicId?: string) => Promise<StudySession | null>
  resumeExistingSession: (sessionId: string) => Promise<StudySession | null>
  pauseSession: () => void
  resumeTimer: () => void
  endSession: (notes?: string) => Promise<void>
  loadSessions: () => Promise<void>
  loadActiveSession: () => Promise<void>
  setAutoGenerateCards: (enabled: boolean) => void
  loadAutoGeneratePref: () => Promise<void>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  sessions: [],
  elapsedSeconds: 0,
  timerInterval: null,
  autoGenerateCards: true,

  startSession: async (title, mode, subjectId, topicId) => {
    if (!window.electronAPI) return null
    const session = await window.electronAPI.db.sessions.create({
      title,
      mode,
      subject_id: subjectId || null,
      topic_id: topicId || null,
    })
    set({ activeSession: session, elapsedSeconds: 0 })
    get().resumeTimer()
    return session
  },

  resumeExistingSession: async (sessionId) => {
    if (!window.electronAPI) return null
    // Reactivate the session in DB
    const session = await window.electronAPI.db.sessions.update(sessionId, {
      status: 'active',
    })
    if (session) {
      // Set duration from DB (accumulated)
      set({ activeSession: session, elapsedSeconds: session.duration_seconds || 0 })
      get().resumeTimer()
    }
    return session
  },

  pauseSession: () => {
    const interval = get().timerInterval
    if (interval) clearInterval(interval)
    set({ timerInterval: null })
  },

  resumeTimer: () => {
    const interval = get().timerInterval
    if (interval) clearInterval(interval)
    const newInterval = setInterval(() => {
      set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }))
    }, 1000)
    set({ timerInterval: newInterval })
  },

  endSession: async (notes) => {
    const { activeSession, elapsedSeconds } = get()
    if (!activeSession || !window.electronAPI) return

    await window.electronAPI.db.sessions.update(activeSession.id, {
      status: 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: elapsedSeconds,
      overall_notes: notes || '',
    })

    const interval = get().timerInterval
    if (interval) clearInterval(interval)

    // Trigger achievement check (Barrier 3: 微反馈系统)
    try { await window.electronAPI.db.achievements.check() } catch { /* non-blocking */ }

    // Card generation is handled by each learning-mode view's handleEndSession
    // after endSession() returns — removed the duplicate auto-generation here
    // to avoid generating cards twice for the same session.

    set({ activeSession: null, elapsedSeconds: 0, timerInterval: null })
    get().loadSessions()
  },

  loadSessions: async () => {
    if (!window.electronAPI) return
    const sessions = await window.electronAPI.db.sessions.list()
    set({ sessions })
  },

  loadActiveSession: async () => {
    if (!window.electronAPI) return
    const session = await window.electronAPI.db.sessions.getActive()
    if (session) {
      set({ activeSession: session })
      get().resumeTimer()
    }
  },

  setAutoGenerateCards: (enabled: boolean) => {
    set({ autoGenerateCards: enabled })
    if (window.electronAPI) {
      window.electronAPI.settings.set('auto_generate_cards', enabled ? '1' : '0')
    }
  },

  loadAutoGeneratePref: async () => {
    if (!window.electronAPI) return
    try {
      const val = await window.electronAPI.settings.get('auto_generate_cards')
      set({ autoGenerateCards: val !== '0' }) // default true if not set
    } catch { /* keep default */ }
  },
}))

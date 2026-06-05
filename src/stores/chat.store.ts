import { create } from 'zustand'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  score?: number
  gaps?: string[]
  jargon?: string[]
  questionType?: string
  decompTree?: any
}

interface ChatState {
  // Messages keyed by sessionId
  messagesBySession: Record<string, ChatMessage[]>
  isLoading: boolean

  loadMessages: (sessionId: string) => Promise<void>
  addMessage: (sessionId: string, message: ChatMessage) => Promise<void>
  updateLastMessage: (sessionId: string, content: string) => void
  clearMessages: (sessionId: string) => void
  getMessages: (sessionId: string) => ChatMessage[]
  cleanupOldSessions: (activeSessionId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesBySession: {},
  isLoading: false,

  loadMessages: async (sessionId: string) => {
    if (!window.electronAPI) return
    // Don't reload if already loaded
    if (get().messagesBySession[sessionId]?.length > 0) return

    set({ isLoading: true })
    try {
      const rows = await window.electronAPI.db.chatMessages.listBySession(sessionId)
      const messages: ChatMessage[] = rows.map((row: any) => {
        let metadata: any = {}
        if (row.metadata) {
          try { metadata = JSON.parse(row.metadata) } catch {}
        }
        return {
          role: row.role,
          content: row.content,
          ...metadata,
        }
      })
      set(s => ({
        messagesBySession: { ...s.messagesBySession, [sessionId]: messages },
        isLoading: false,
      }))
    } catch {
      set({ isLoading: false })
      // Initialize empty array on error so we don't retry infinitely
      set(s => ({
        messagesBySession: { ...s.messagesBySession, [sessionId]: [] },
      }))
    }
  },

  addMessage: async (sessionId: string, message: ChatMessage) => {
    // Update local state immediately
    set(s => ({
      messagesBySession: {
        ...s.messagesBySession,
        [sessionId]: [...(s.messagesBySession[sessionId] || []), message],
      },
    }))

    // Persist to DB in background
    if (window.electronAPI) {
      const { score, gaps, jargon, questionType, decompTree, ...rest } = message as any
      const metadata: any = {}
      if (score != null) metadata.score = score
      if (gaps?.length) metadata.gaps = gaps
      if (jargon?.length) metadata.jargon = jargon
      if (questionType) metadata.questionType = questionType

      try {
        await window.electronAPI.db.chatMessages.create({
          sessionId,
          role: rest.role,
          content: rest.content,
          metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : undefined,
        })
      } catch {
        // Non-blocking — message is already in local state
      }
    }
  },

  updateLastMessage: (sessionId: string, content: string) => {
    set(s => {
      const msgs = [...(s.messagesBySession[sessionId] || [])]
      if (msgs.length > 0) {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
      }
      return {
        messagesBySession: { ...s.messagesBySession, [sessionId]: msgs },
      }
    })
  },

  clearMessages: (sessionId: string) => {
    set(s => {
      const { [sessionId]: _, ...rest } = s.messagesBySession
      return { messagesBySession: rest }
    })
    // Also delete from DB
    if (window.electronAPI) {
      window.electronAPI.db.chatMessages.deleteBySession(sessionId).catch(() => {})
    }
  },

  getMessages: (sessionId: string) => {
    return get().messagesBySession[sessionId] || []
  },

  cleanupOldSessions: (activeSessionId: string) => {
    // Remove all non-active sessions from memory (DB data stays)
    set(s => ({
      messagesBySession: { [activeSessionId]: s.messagesBySession[activeSessionId] || [] },
    }))
  },
}))

import { create } from 'zustand'
import type { Flashcard, FlashcardStats, ReviewRating, SessionMode } from '@/types/database'

interface ReviewState {
  // Data
  dueCards: Flashcard[]
  topicCards: Flashcard[]
  stats: FlashcardStats | null
  // UI state
  currentCardIndex: number
  isFlipped: boolean
  isLoading: boolean
  // Actions
  loadDueCards: (topicId?: string) => Promise<void>
  loadCardsByTopic: (topicId: string) => Promise<void>
  reviewCard: (cardId: string, rating: ReviewRating) => Promise<Flashcard | null>
  generateCardsFromSession: (
    sessionContent: string,
    topicId?: string,
    topicName?: string,
    materialExcerpt?: string
  ) => Promise<Flashcard[]>
  loadStats: (topicId?: string) => Promise<void>
  // Card navigation
  setCurrentIndex: (index: number) => void
  nextCard: () => void
  flipCard: () => void
  unflipCard: () => void
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  dueCards: [],
  topicCards: [],
  stats: null,
  currentCardIndex: 0,
  isFlipped: false,
  isLoading: false,

  loadDueCards: async (topicId?: string) => {
    if (!window.electronAPI) return
    set({ isLoading: true })
    try {
      const cards = await window.electronAPI.db.flashcards.listDue(topicId)
      set({ dueCards: cards, currentCardIndex: 0, isFlipped: false, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadCardsByTopic: async (topicId: string) => {
    if (!window.electronAPI) return
    set({ isLoading: true })
    try {
      const cards = await window.electronAPI.db.flashcards.listByTopic(topicId)
      set({ topicCards: cards, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  reviewCard: async (cardId: string, rating: ReviewRating) => {
    if (!window.electronAPI) return null
    try {
      const updated = await window.electronAPI.db.flashcards.review(cardId, rating)
      // Remove reviewed card from the due queue
      if (updated) {
        const { dueCards, currentCardIndex } = get()
        const newCards = dueCards.filter(c => c.id !== cardId)
        const newIndex = Math.min(currentCardIndex, newCards.length - 1)
        set({ dueCards: newCards, currentCardIndex: newIndex >= 0 ? newIndex : 0, isFlipped: false })
      }
      return updated
    } catch {
      return null
    }
  },

  generateCardsFromSession: async (sessionContent, topicId?, topicName?, materialExcerpt?) => {
    if (!window.electronAPI) return []

    // Content quality threshold: need enough conversation to extract concepts.
    const MIN_CONTENT_LENGTH = 100
    if (!sessionContent || sessionContent.trim().length < MIN_CONTENT_LENGTH) {
      console.log(
        `[Review] Skipping card generation: content too short (${sessionContent?.trim().length || 0} chars, need ${MIN_CONTENT_LENGTH})`
      )
      throw new Error(`学习内容不足（${sessionContent?.trim().length || 0} 字），至少需要 ${MIN_CONTENT_LENGTH} 字才能生成复习卡片。请进行更多对话后再结束会话。`)
    }

    try {
      const cards = await window.electronAPI.db.flashcards.generate({
        sessionContent,
        topicId,
        topicName,
        materialExcerpt,
      })
      // Refresh stats after generation
      if (topicId) {
        get().loadStats(topicId)
      }
      return cards
    } catch (err: any) {
      console.error('[Review] Card generation failed:', err?.message || err)
      throw err
    }
  },

  loadStats: async (topicId?: string) => {
    if (!window.electronAPI) return
    try {
      const stats = await window.electronAPI.db.flashcards.getStats(topicId)
      set({ stats })
    } catch { /* stats stay null */ }
  },

  setCurrentIndex: (index: number) => {
    set({ currentCardIndex: index, isFlipped: false })
  },

  nextCard: () => {
    const { currentCardIndex, dueCards } = get()
    if (currentCardIndex < dueCards.length - 1) {
      set({ currentCardIndex: currentCardIndex + 1, isFlipped: false })
    }
  },

  flipCard: () => set({ isFlipped: true }),
  unflipCard: () => set({ isFlipped: false }),
}))

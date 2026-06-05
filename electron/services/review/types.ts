// Minimal type definitions for review services (mirrors src/types/database.ts).
// Duplicated here because tsconfig.node.json has rootDir=electron and cannot
// import from src/. These must stay in sync with the canonical definitions in
// src/types/database.ts.

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface Flashcard {
  id: string
  material_id: string | null
  feynman_attempt_id: string | null
  socratic_turn_id: string | null
  topic_id: string | null
  front: string
  back: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_review_at: string | null
  last_rating: ReviewRating | null
  created_at: string
}

import type { Flashcard, ReviewRating } from './types'

/**
 * Simplified SM-2 spaced repetition algorithm.
 * Runs in the main process, called by the db:flashcards:review IPC handler.
 *
 * SM-2 parameters:
 * - ease_factor: starts at 2.5, minimum 1.3
 * - interval_days: current interval between reviews
 * - repetitions: consecutive correct reviews
 *
 * Rating effects:
 * - again: reset interval to 1 day, decrease ease, reset repetitions
 * - hard: interval × 1.2, slight ease penalty
 * - good: interval × ease, standard progression
 * - easy: interval × ease × 1.3, ease bonus
 */
export interface SM2Result {
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_review_at: string
  last_rating: ReviewRating
}

export function applySM2(card: Flashcard, rating: ReviewRating): SM2Result {
  let { ease_factor, interval_days, repetitions } = card

  switch (rating) {
    case 'again':
      interval_days = 1
      ease_factor = Math.max(ease_factor - 0.20, 1.3)
      repetitions = 0
      break
    case 'hard':
      interval_days = Math.max(1, Math.round(interval_days * 1.2))
      ease_factor = Math.max(ease_factor - 0.15, 1.3)
      // repetitions unchanged — "hard" is not a fail
      break
    case 'good':
      if (repetitions === 0) {
        interval_days = 1
      } else if (repetitions === 1) {
        interval_days = 3
      } else {
        interval_days = Math.round(interval_days * ease_factor)
      }
      repetitions++
      break
    case 'easy':
      if (repetitions === 0) {
        interval_days = 3
      } else if (repetitions === 1) {
        interval_days = 7
      } else {
        interval_days = Math.round(interval_days * ease_factor * 1.3)
      }
      ease_factor = ease_factor + 0.15
      repetitions++
      break
  }

  const now = Date.now()
  const next_review_at = new Date(now + interval_days * 86400000).toISOString()
  const last_review_at = new Date(now).toISOString()

  return {
    ease_factor: Math.round(ease_factor * 100) / 100, // round to 2 decimals
    interval_days,
    repetitions,
    next_review_at,
    last_review_at,
    last_rating: rating,
  }
}

/**
 * Returns the UTC midnight timestamp for today.
 * Used to compare next_review_at against "due today".
 */
export function todayUTC(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
}

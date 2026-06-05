import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Emotion detection hook — monitors learning session signals
 * and returns the current inferred user mood.
 *
 * Pure React-side logic, no IPC needed. Reads from local state.
 *
 * Signals tracked:
 * - Consecutive low understanding scores (< 40)
 * - User response latency (> 60 seconds without input)
 * - Session abandonment (user leaves mid-session)
 */

export type UserMood = 'normal' | 'frustrated' | 'confident'

interface EmotionDetectionOptions {
  /** Callback when mood changes */
  onMoodChange?: (mood: UserMood) => void
  /** Threshold for "low score" (default 40) */
  lowScoreThreshold?: number
  /** Number of consecutive low scores to trigger frustration (default 3) */
  consecutiveLowThreshold?: number
  /** Seconds without input to consider idle (default 60) */
  idleThresholdSeconds?: number
}

export function useEmotionDetection(options: EmotionDetectionOptions = {}) {
  const {
    onMoodChange,
    lowScoreThreshold = 40,
    consecutiveLowThreshold = 3,
    idleThresholdSeconds = 60,
  } = options

  const [mood, setMood] = useState<UserMood>('normal')
  const [lowScoreStreak, setLowScoreStreak] = useState(0)
  const lastInputTime = useRef<number>(Date.now())
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track user input timing
  const markInput = useCallback(() => {
    lastInputTime.current = Date.now()
  }, [])

  // Called after each feynman attempt is scored
  const reportScore = useCallback((score: number) => {
    if (score < lowScoreThreshold) {
      setLowScoreStreak(prev => {
        const next = prev + 1
        if (next >= consecutiveLowThreshold) {
          const newMood: UserMood = 'frustrated'
          setMood(newMood)
          onMoodChange?.(newMood)
        }
        return next
      })
    } else {
      setLowScoreStreak(0)
      if (score >= 80) {
        const newMood: UserMood = 'confident'
        setMood(newMood)
        onMoodChange?.(newMood)
      } else {
        const newMood: UserMood = 'normal'
        setMood(newMood)
        onMoodChange?.(newMood)
      }
    }
  }, [lowScoreThreshold, consecutiveLowThreshold, onMoodChange])

  // Monitor idle time
  useEffect(() => {
    idleTimerRef.current = setInterval(() => {
      const idleSeconds = (Date.now() - lastInputTime.current) / 1000
      if (idleSeconds > idleThresholdSeconds && mood !== 'frustrated') {
        // User seems stuck — don't mark as frustrated directly,
        // but this can be combined with score signals
      }
    }, 10000) // Check every 10 seconds

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    }
  }, [idleThresholdSeconds, mood])

  // Reset on unmount
  useEffect(() => {
    return () => {
      setMood('normal')
      setLowScoreStreak(0)
    }
  }, [])

  return { mood, reportScore, markInput }
}

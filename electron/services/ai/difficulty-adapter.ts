/**
 * Difficulty adapter — adjusts AI persona prompt difficulty
 * based on historical understanding scores.
 *
 * Pure TypeScript, no DB access — receives session data from the caller.
 */

export interface DifficultyContext {
  currentLevel: number        // 1-5, default 3
  recentScores: number[]      // last N feynman attempt scores
  topicId?: string
}

export function calculateDifficulty(ctx: DifficultyContext): number {
  let level = ctx.currentLevel

  if (ctx.recentScores.length < 3) {
    return level  // not enough data to adjust
  }

  const recentThree = ctx.recentScores.slice(-3)
  const avg = recentThree.reduce((a, b) => a + b, 0) / recentThree.length

  if (avg >= 80) {
    // Consistently high scores → increase difficulty
    level = Math.min(level + 1, 5)
  } else if (avg <= 40) {
    // Consistently low scores → decrease difficulty
    level = Math.max(level - 1, 1)
  }
  // Otherwise maintain current level

  return level
}

/**
 * Returns a human-readable label for the difficulty level.
 */
export function difficultyLabel(level: number): string {
  switch (level) {
    case 1: return '入门'
    case 2: return '初级'
    case 3: return '中级'
    case 4: return '进阶'
    case 5: return '高级'
    default: return '中级'
  }
}

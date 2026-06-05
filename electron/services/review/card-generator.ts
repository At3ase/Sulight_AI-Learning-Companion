import type { Flashcard } from './types'

/**
 * Card generation prompt template.
 * Called by the db:flashcards:generate IPC handler which delegates to
 * the existing AI provider factory's `complete()` (non-streaming) method.
 */
export interface CardGenerationInput {
  sessionContent: string
  topicName?: string
  materialExcerpt?: string
}

export interface GeneratedCardPair {
  front: string
  back: string
}

/**
 * Builds the system prompt for AI card generation.
 * The prompt instructs the AI to extract key concept/explanation pairs.
 */
export function buildGenerationPrompt(input: CardGenerationInput): string {
  return `你是一个学习助手，负责从学习会话中提取关键概念生成复习卡片。

## 任务
从以下学习内容中提取最重要的概念生成复习卡片。最多生成 5 张卡片。
- 如果内容较少或讨论不够深入，生成 1-2 张甚至 0 张也可以
- 只提取真正有复习价值的概念，宁缺毋滥
- 如果学习内容基本上是闲聊、问候或无效对话，返回空数组 []

## 卡片格式
每张卡片包含：
- front（正面）：核心概念或问题，简洁明了（一句话）
- back（背面）：清晰准确的解释或答案（2-3句话）

## 输出要求
以 JSON 数组格式返回，每个元素包含 front 和 back 字段：
[
  {"front": "概念/问题", "back": "解释/答案"},
  ...
]

## 内容
${input.topicName ? `主题：${input.topicName}\n` : ''}
${input.materialExcerpt ? `相关材料：${input.materialExcerpt}\n` : ''}
学习会话内容：
${input.sessionContent}

只返回 JSON 数组，不要其他内容。`
}

/**
 * Parses the AI response into card pairs.
 * Handles both valid JSON and attempts to recover from markdown-wrapped JSON.
 */
/** Maximum number of cards allowed per generation call. */
const MAX_CARDS_PER_GENERATION = 5

export function parseGeneratedCards(response: string): GeneratedCardPair[] {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(response)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item: any) => item.front && item.back)
        .map((item: any) => ({ front: item.front, back: item.back }))
        .slice(0, MAX_CARDS_PER_GENERATION)
    }
  } catch {
    // Fall through to extraction
  }

  // Try to extract JSON from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim())
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item: any) => item.front && item.back)
          .map((item: any) => ({ front: item.front, back: item.back }))
          .slice(0, MAX_CARDS_PER_GENERATION)
      }
    } catch {
      // Last resort: return empty
    }
  }

  return []
}

/**
 * Context window management — prevents context overflow and model degradation.
 *
 * Strategy: sliding window — always keep system prompt + last N chat messages.
 * Older messages are still stored in DB and visible in UI, just excluded from API calls.
 */

const MAX_CHAT_MESSAGES = 20 // Keep last 20 user/assistant messages (~10 exchanges)

export interface RawMessage {
  role: string
  content: string
}

export interface TrimResult {
  messages: RawMessage[]
  trimmed: number   // How many older messages were excluded
}

/**
 * Trim conversation history to fit within the context window.
 * - System messages (persona prompt) are always preserved
 * - The most recent MAX_CHAT_MESSAGES user/assistant messages are kept
 * - Returns the count of trimmed messages for UI feedback
 */
export function trimContextWindow(messages: RawMessage[]): TrimResult {
  const systemMessages = messages.filter((m) => m.role === 'system')
  const chatMessages = messages.filter((m) => m.role !== 'system')

  if (chatMessages.length <= MAX_CHAT_MESSAGES) {
    return { messages, trimmed: 0 }
  }

  const trimmed = chatMessages.length - MAX_CHAT_MESSAGES
  const kept = chatMessages.slice(-MAX_CHAT_MESSAGES)

  return {
    messages: [...systemMessages, ...kept],
    trimmed,
  }
}

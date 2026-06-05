export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamOptions {
  model: string
  maxTokens?: number
  temperature?: number
  apiKey: string
  baseUrl?: string
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void
  onDone: (usage?: UsageInfo, finishReason?: string) => void
  onError: (error: string) => void
}

export interface UsageInfo {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export interface CompletionResult {
  content: string
  usage: UsageInfo
}

export interface AIProvider {
  readonly name: string
  testConnection(apiKey: string, baseUrl?: string): Promise<boolean>
  listModels(apiKey: string, baseUrl?: string): Promise<string[]>
  streamChat(
    messages: ChatMessage[],
    options: StreamOptions,
    callbacks: StreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<void>
  complete(
    messages: ChatMessage[],
    options: StreamOptions
  ): Promise<CompletionResult>
}

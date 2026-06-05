import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, ChatMessage, StreamOptions, StreamCallbacks, CompletionResult } from '../types'

export function createClaudeProvider(): AIProvider {
  return {
    name: 'claude',

    async testConnection(apiKey: string, baseUrl?: string): Promise<boolean> {
      const client = new Anthropic({
        apiKey,
        baseURL: baseUrl || undefined,
      })
      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      return response.content.length > 0
    },

    async listModels(apiKey: string, baseUrl?: string): Promise<string[]> {
      const works = await this.testConnection(apiKey, baseUrl)
      if (!works) return []
      return [
        'claude-opus-4-8',
        'claude-sonnet-4-6',
        'claude-haiku-4-5',
      ]
    },

    async streamChat(
      messages: ChatMessage[],
      options: StreamOptions,
      callbacks: StreamCallbacks,
      abortSignal?: AbortSignal
    ): Promise<void> {
      const client = new Anthropic({
        apiKey: options.apiKey,
        baseURL: options.baseUrl || undefined,
      })

      try {
        const systemMsg = messages.find((m) => m.role === 'system')
        const chatMessages = messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

        const stream = client.messages.stream({
          model: options.model || 'claude-sonnet-4-6',
          max_tokens: options.maxTokens ?? 4096,
          temperature: options.temperature,
          system: systemMsg?.content,
          messages: chatMessages,
        })

        if (abortSignal) {
          abortSignal.addEventListener('abort', () => stream.abort())
        }

        stream.on('text', (text) => {
          callbacks.onChunk(text)
        })

        const finalMessage = await stream.finalMessage()
        const usage = finalMessage.usage

        callbacks.onDone(
          {
            promptTokens: usage.input_tokens,
            completionTokens: usage.output_tokens,
            totalTokens: usage.input_tokens + usage.output_tokens,
          },
          finalMessage.stop_reason ?? undefined
        )
      } catch (err: any) {
        if (abortSignal?.aborted) {
          callbacks.onDone()
        } else {
          callbacks.onError(err?.message ?? String(err))
        }
      }
    },

    async complete(
      messages: ChatMessage[],
      options: StreamOptions
    ): Promise<CompletionResult> {
      const client = new Anthropic({
        apiKey: options.apiKey,
        baseURL: options.baseUrl || undefined,
      })

      const systemMsg = messages.find((m) => m.role === 'system')
      const chatMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      const response = await client.messages.create({
        model: options.model || 'claude-sonnet-4-6',
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature,
        system: systemMsg?.content,
        messages: chatMessages,
      })

      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('')

      return {
        content: text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      }
    },
  }
}

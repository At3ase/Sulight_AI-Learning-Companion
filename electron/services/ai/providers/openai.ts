import OpenAI from 'openai'
import type { AIProvider, ChatMessage, StreamOptions, StreamCallbacks, CompletionResult } from '../types'

export function createOpenAIProvider(): AIProvider {
  return {
    name: 'openai',

    async testConnection(apiKey: string, baseUrl?: string): Promise<boolean> {
      const client = new OpenAI({
        apiKey,
        baseURL: baseUrl || undefined,
      })
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      return response.choices.length > 0
    },

    async listModels(apiKey: string, baseUrl?: string): Promise<string[]> {
      try {
        const client = new OpenAI({
          apiKey,
          baseURL: baseUrl || undefined,
        })
        const response = await client.models.list()
        return response.data
          .filter((m) => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3'))
          .map((m) => m.id)
          .sort()
      } catch {
        return ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']
      }
    },

    async streamChat(
      messages: ChatMessage[],
      options: StreamOptions,
      callbacks: StreamCallbacks,
      abortSignal?: AbortSignal
    ): Promise<void> {
      const client = new OpenAI({
        apiKey: options.apiKey,
        baseURL: options.baseUrl || undefined,
      })

      try {
        const stream = await client.chat.completions.create({
          model: options.model || 'gpt-4o',
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        })

        const signalHandler = () => stream.controller.abort()
        if (abortSignal) {
          abortSignal.addEventListener('abort', signalHandler)
        }

        let usage: any = null
        for await (const chunk of stream) {
          if (chunk.choices[0]?.delta?.content) {
            callbacks.onChunk(chunk.choices[0].delta.content)
          }
          if (chunk.usage) {
            usage = chunk.usage
          }
        }

        if (abortSignal) {
          abortSignal.removeEventListener('abort', signalHandler)
        }

        callbacks.onDone(
          usage
            ? {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
              }
            : undefined
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
      const client = new OpenAI({
        apiKey: options.apiKey,
        baseURL: options.baseUrl || undefined,
      })

      const response = await client.chat.completions.create({
        model: options.model || 'gpt-4o',
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      })

      return {
        content: response.choices[0]?.message?.content ?? '',
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
      }
    },
  }
}

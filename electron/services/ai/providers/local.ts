import type { AIProvider, ChatMessage, StreamOptions, StreamCallbacks, CompletionResult } from '../types'

export function createLocalProvider(): AIProvider {
  return {
    name: 'local',

    async testConnection(apiKey: string, baseUrl?: string): Promise<boolean> {
      const url = baseUrl || 'http://localhost:11434/v1'
      const response = await fetch(`${url.replace(/\/$/, '')}/models`)
      return response.ok
    },

    async listModels(apiKey: string, baseUrl?: string): Promise<string[]> {
      try {
        const url = baseUrl || 'http://localhost:11434/v1'
        const response = await fetch(`${url.replace(/\/$/, '')}/models`)
        if (!response.ok) return []
        const data = (await response.json()) as any
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((m: any) => m.id || m.name).filter(Boolean)
        }
        return []
      } catch {
        return []
      }
    },

    async streamChat(
      messages: ChatMessage[],
      options: StreamOptions,
      callbacks: StreamCallbacks,
      abortSignal?: AbortSignal
    ): Promise<void> {
      const baseUrl = options.baseUrl || 'http://localhost:11434/v1'
      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: options.model || 'llama3',
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            max_tokens: options.maxTokens,
            temperature: options.temperature,
            stream: true,
          }),
          signal: abortSignal,
        })

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue
            const data = trimmed.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) callbacks.onChunk(delta)
            } catch {
              // Skip unparseable chunks
            }
          }
        }

        callbacks.onDone()
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
      const baseUrl = options.baseUrl || 'http://localhost:11434/v1'

      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: options.model || 'llama3',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: options.maxTokens,
          temperature: options.temperature,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as any
      return {
        content: data.choices?.[0]?.message?.content ?? '',
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
      }
    },
  }
}

import type { AIProvider, ChatMessage, StreamOptions, StreamCallbacks, CompletionResult } from '../types'

/**
 * Generic OpenAI-compatible provider.
 *
 * Works with ANY API that speaks the OpenAI /v1/chat/completions protocol:
 * - DeepSeek (api.deepseek.com)
 * - 通义千问 Qwen (dashscope.aliyuncs.com)
 * - Kimi / Moonshot (api.moonshot.cn)
 * - 智谱 GLM (open.bigmodel.cn)
 * - 豆包 Doubao / Volcengine (ark.cn-beijing.volces.com)
 * - Ollama (localhost:11434)
 * - Any custom/proxy endpoint
 */
export function createCustomProvider(): AIProvider {
  return {
    name: 'custom',

    async testConnection(apiKey: string, baseUrl?: string): Promise<boolean> {
      const url = baseUrl || 'https://api.deepseek.com/v1'
      try {
        // Try /models first (works for most providers except Doubao)
        const modelsRes = await fetch(`${url.replace(/\/$/, '')}/models`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        })
        if (modelsRes.ok) return true

        // Fallback: try a minimal chat completion (for providers without /models endpoint)
        const chatRes = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'default',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        })
        // 401/403 = auth OK but model not found → connection works
        // 200 = everything works
        // 404 = endpoint not found → connection failed
        if (chatRes.status === 401 || chatRes.status === 403) return true
        return chatRes.ok
      } catch {
        return false
      }
    },

    async listModels(apiKey: string, baseUrl?: string): Promise<string[]> {
      const url = baseUrl || 'https://api.deepseek.com/v1'
      try {
        const response = await fetch(`${url.replace(/\/$/, '')}/models`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        })
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
      const baseUrl = options.baseUrl || 'https://api.deepseek.com/v1'
      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: options.model || 'deepseek-chat',
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            max_tokens: options.maxTokens,
            temperature: options.temperature,
            stream: true,
          }),
          signal: abortSignal,
        })

        if (!response.ok || !response.body) {
          const errBody = await response.text().catch(() => '')
          throw new Error(`HTTP ${response.status}: ${errBody.slice(0, 200) || response.statusText}`)
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
      const baseUrl = options.baseUrl || 'https://api.deepseek.com/v1'

      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: options.model || 'deepseek-chat',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: options.maxTokens,
          temperature: options.temperature,
        }),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status}: ${errBody.slice(0, 200) || response.statusText}`)
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

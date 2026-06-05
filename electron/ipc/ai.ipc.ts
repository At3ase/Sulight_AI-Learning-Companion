import { ipcMain } from 'electron'
import { testConnection, listModels, streamChat, complete, cancelStream } from '../services/ai'
import { getDatabase } from '../services/database/connection'
import { randomUUID } from 'crypto'

export function registerAIHandlers(): void {
  // ── Test Connection ───────────────────────────────────
  ipcMain.handle('ai:testConnection', async (_e, provider: string, apiKey: string, baseUrl?: string) => {
    try {
      const result = await testConnection(provider, apiKey, baseUrl)
      return { success: result }
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) }
    }
  })

  // ── List Models ───────────────────────────────────────
  ipcMain.handle('ai:listModels', async (_e, provider: string) => {
    try {
      return await listModels(provider)
    } catch {
      return []
    }
  })

  // ── Stream Chat ───────────────────────────────────────
  ipcMain.handle('ai:streamChat', async (event, params: any) => {
    const { provider, messages, options, sessionId } = params
    const db = getDatabase()
    const interactionId = randomUUID()
    const startTime = Date.now()

    try {
      const streamId = await streamChat(
        provider,
        messages,
        {
          ...options,
          onComplete: (usage) => {
            const latency = Date.now() - startTime
            db.prepare(`
              INSERT INTO ai_interactions (id, session_id, model_provider, model_name, prompt_tokens, completion_tokens, total_tokens, latency_ms, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).run(
              interactionId,
              sessionId || null,
              provider,
              options?.model || 'unknown',
              usage?.promptTokens ?? 0,
              usage?.completionTokens ?? 0,
              usage?.totalTokens ?? 0,
              latency
            )
          },
        },
        event.sender
      )

      return { streamId }
    } catch (err: any) {
      throw new Error(`Failed to start stream: ${err?.message ?? String(err)}`)
    }
  })

  // ── Complete (non-streaming) ──────────────────────────
  ipcMain.handle('ai:complete', async (_e, params: any) => {
    const { provider, messages, options, sessionId } = params
    const db = getDatabase()
    const interactionId = randomUUID()
    const startTime = Date.now()

    try {
      const result = await complete(provider, messages, options)
      const latency = Date.now() - startTime

      db.prepare(`
        INSERT INTO ai_interactions (id, session_id, model_provider, model_name, prompt_tokens, completion_tokens, total_tokens, latency_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        interactionId,
        sessionId || null,
        provider,
        options?.model || 'unknown',
        result.usage?.promptTokens ?? 0,
        result.usage?.completionTokens ?? 0,
        result.usage?.totalTokens ?? 0,
        latency
      )

      return { content: result.content, usage: result.usage }
    } catch (err: any) {
      throw new Error(`AI completion failed: ${err?.message ?? String(err)}`)
    }
  })

  // ── Cancel Stream ─────────────────────────────────────
  ipcMain.handle('ai:cancelStream', async (_e, streamId: string) => {
    return cancelStream(streamId)
  })
}

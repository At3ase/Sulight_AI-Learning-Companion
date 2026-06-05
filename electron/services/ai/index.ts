import { getProvider } from './providers'
import { getCredentials } from '../credential-store'
import type { ChatMessage, StreamOptions } from './types'

interface ActiveStream {
  id: string
  abortController: AbortController
}

const activeStreams = new Map<string, ActiveStream>()
let streamCounter = 0

function getApiKey(providerName: string): { apiKey: string; baseUrl?: string } {
  const creds = getCredentials(providerName)
  if (!creds) {
    throw new Error(
      `No API credentials found for "${providerName}". Please configure your API key in Settings.`
    )
  }
  return { apiKey: creds.apiKey, baseUrl: creds.baseUrl }
}

export async function testConnection(providerName: string, apiKey: string, baseUrl?: string): Promise<boolean> {
  const provider = getProvider(providerName)
  return provider.testConnection(apiKey, baseUrl)
}

export async function listModels(providerName: string): Promise<string[]> {
  const { apiKey, baseUrl } = getApiKey(providerName)
  const provider = getProvider(providerName)
  return provider.listModels(apiKey, baseUrl)
}

export interface StreamChatOptions {
  model: string
  maxTokens?: number
  temperature?: number
  onComplete?: (usage: any) => void
}

export async function streamChat(
  providerName: string,
  messages: ChatMessage[],
  options: StreamChatOptions,
  sender: Electron.WebContents
): Promise<string> {
  const { apiKey, baseUrl } = getApiKey(providerName)
  const provider = getProvider(providerName)

  const streamId = `stream_${++streamCounter}_${Date.now()}`
  const abortController = new AbortController()

  const { onComplete, ...modelOptions } = options

  const streamOptions: StreamOptions = {
    ...modelOptions,
    apiKey,
    baseUrl,
  }

  activeStreams.set(streamId, { id: streamId, abortController })

  // Start streaming in background (don't await — let it run)
  provider
    .streamChat(
      messages,
      streamOptions,
      {
        onChunk: (delta) => {
          sender.send('ai:chunk', { streamId, delta })
        },
        onDone: (usage, finishReason) => {
          sender.send('ai:done', { streamId, usage, finishReason })
          activeStreams.delete(streamId)
          if (onComplete) onComplete(usage)
        },
        onError: (error) => {
          sender.send('ai:error', { streamId, error })
          activeStreams.delete(streamId)
        },
      },
      abortController.signal
    )
    .catch((err) => {
      if (activeStreams.has(streamId)) {
        sender.send('ai:error', { streamId, error: err?.message ?? String(err) })
        activeStreams.delete(streamId)
      }
    })

  return streamId
}

export async function complete(
  providerName: string,
  messages: ChatMessage[],
  options: { model: string; maxTokens?: number; temperature?: number }
): Promise<{ content: string; usage: any }> {
  const { apiKey, baseUrl } = getApiKey(providerName)
  const provider = getProvider(providerName)

  return provider.complete(messages, { ...options, apiKey, baseUrl })
}

export function cancelStream(streamId: string): boolean {
  const stream = activeStreams.get(streamId)
  if (!stream) return false
  stream.abortController.abort()
  activeStreams.delete(streamId)
  return true
}

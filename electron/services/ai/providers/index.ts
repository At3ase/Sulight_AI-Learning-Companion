import type { AIProvider } from '../types'
import { createClaudeProvider } from './claude'
import { createOpenAIProvider } from './openai'
import { createCustomProvider } from './custom'
import { createLocalProvider } from './local'

const providers: Record<string, () => AIProvider> = {
  claude: createClaudeProvider,
  openai: createOpenAIProvider,
  custom: createCustomProvider,
  // 'local' kept for backward compatibility — existing Ollama users migrate automatically
  local: createLocalProvider,
}

export function getProvider(providerName: string): AIProvider {
  const factory = providers[providerName]
  if (!factory) {
    throw new Error(`Unknown AI provider: ${providerName}. Available: ${Object.keys(providers).join(', ')}`)
  }
  return factory()
}

export function getAvailableProviders(): string[] {
  return Object.keys(providers)
}

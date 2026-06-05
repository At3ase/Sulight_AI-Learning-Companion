import { create } from 'zustand'

interface AIConfig {
  provider: string
  apiKey: string
  apiSecret?: string
  baseUrl?: string
  model?: string
}

interface SettingsState {
  activeProvider: string | null
  providers: string[]
  configs: Record<string, AIConfig>
  fontSize: number

  loadSettings: () => Promise<void>
  setCredentials: (provider: string, credentials: AIConfig) => Promise<void>
  deleteCredentials: (provider: string) => Promise<void>
  setActiveProvider: (provider: string) => Promise<void>
  setFontSize: (size: number) => void
  testConnection: (provider: string, apiKey: string, baseUrl?: string) => Promise<boolean>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  activeProvider: null,
  providers: [],
  configs: {},
  fontSize: 16,

  loadSettings: async () => {
    if (!window.electronAPI) return
    try {
      const providers = await window.electronAPI.settings.listProviders()
      const activeProvider = await window.electronAPI.settings.get('activeProvider')
      const fontSizeStr = await window.electronAPI.settings.get('fontSize')
      const fontSize = fontSizeStr ? parseInt(fontSizeStr) : 16

      // Load decrypted credentials into configs so UI shows saved state
      const configs: Record<string, AIConfig> = {}
      for (const p of providers) {
        try {
          const creds = await window.electronAPI.settings.getCredentials(p)
          if (creds) {
            configs[p] = {
              provider: p,
              apiKey: creds.apiKey,
              apiSecret: creds.apiSecret,
              baseUrl: creds.baseUrl,
            }
          }
        } catch { /* skip individual failures */ }
      }

      set({ providers, activeProvider, fontSize, configs })
      if (fontSize) document.documentElement.style.fontSize = `${fontSize}px`
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  },

  setCredentials: async (provider, credentials) => {
    if (!window.electronAPI) return
    try {
      await window.electronAPI.settings.setCredentials(provider, credentials)
      const providers = await window.electronAPI.settings.listProviders()
      set((s) => ({
        providers,
        configs: { ...s.configs, [provider]: credentials },
      }))
    } catch (err) {
      console.error('Failed to save credentials:', err)
      throw err
    }
  },

  deleteCredentials: async (provider) => {
    if (!window.electronAPI) return
    await window.electronAPI.settings.deleteCredentials(provider)
    const providers = await window.electronAPI.settings.listProviders()
    set((s) => {
      const configs = { ...s.configs }
      delete configs[provider]
      return {
        providers,
        configs,
        activeProvider: s.activeProvider === provider ? null : s.activeProvider,
      }
    })
  },

  setActiveProvider: async (provider) => {
    if (!window.electronAPI) return
    await window.electronAPI.settings.set('activeProvider', provider)
    set({ activeProvider: provider })
  },

  setFontSize: (size) => {
    document.documentElement.style.fontSize = `${size}px`
    set({ fontSize: size })
    if (window.electronAPI) {
      window.electronAPI.settings.set('fontSize', String(size))
    }
  },

  testConnection: async (provider, apiKey, baseUrl?) => {
    if (!window.electronAPI) return false
    try {
      const result = await window.electronAPI.ai.testConnection(provider, apiKey, baseUrl)
      if (!result.success && result.error) {
        console.error('Connection test failed:', result.error)
      }
      return result.success
    } catch (err) {
      console.error('Connection test failed:', err)
      return false
    }
  },
}))

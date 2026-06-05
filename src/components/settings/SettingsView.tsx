import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settings.store'
import { useUIStore } from '../../stores/ui.store'
import { useNavigate } from 'react-router-dom'
import { Key, Eye, EyeOff, Trash2, Check, X, Monitor, Moon, Sun, Type, Loader2, Play, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const PROVIDER_DEFS = [
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: '擅长深度推理和深思熟虑的对话，最适合复杂概念的学习。',
    models: ['claude-sonnet-4-6', 'claude-opus-4-8', 'claude-haiku-4-5'],
    defaultModel: 'claude-sonnet-4-6',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o 提供多功能的高质量回复，适合广泛的学科。',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o',
  },
  {
    id: 'local',
    name: '本地模型 (Ollama)',
    description: '在本地运行模型，保护隐私、零 API 费用。',
    models: [],
    defaultModel: '',
    needsUrl: true,
  },
]

export function SettingsView() {
  const navigate = useNavigate()
  const { activeProvider, setActiveProvider, setCredentials, deleteCredentials, configs, fontSize, setFontSize, loadSettings } = useSettingsStore()
  const { theme, setTheme } = useUIStore()
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean | null>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!configs) return
    const keys: Record<string, string> = {}
    const urls: Record<string, string> = {}
    for (const [provider, config] of Object.entries(configs)) {
      if (config.apiKey) keys[provider] = config.apiKey
      if (config.baseUrl) urls[provider] = config.baseUrl
    }
    setApiKeys(prev => ({ ...prev, ...keys }))
    setBaseUrls(prev => ({ ...prev, ...urls }))
  }, [configs])

  useEffect(() => {
    if (Object.keys(configs).length > 0) return
    loadSettings()
  }, [])

  const handleTestConnection = async (providerId: string) => {
    const key = apiKeys[providerId]
    if (!key?.trim()) {
      toast.error('请先输入 API Key')
      return
    }
    setTesting(prev => ({ ...prev, [providerId]: true }))
    try {
      const result = await window.electronAPI!.ai.testConnection(providerId, key.trim(), baseUrls[providerId]?.trim() || undefined)
      setConnectionStatus(prev => ({ ...prev, [providerId]: result.success }))
      if (result.success) {
        toast.success(`${PROVIDER_DEFS.find(p => p.id === providerId)?.name} 连接成功！`)
      } else {
        toast.error('连接失败 — 请检查 API key 和网络')
      }
    } catch (err: any) {
      setConnectionStatus(prev => ({ ...prev, [providerId]: false }))
      toast.error(`连接测试失败: ${err?.message || '未知错误'}`)
    } finally {
      setTesting(prev => ({ ...prev, [providerId]: false }))
    }
  }

  const handleSave = async (providerId: string) => {
    const key = apiKeys[providerId]
    if (!key?.trim()) {
      toast.error('API key 不能为空')
      return
    }
    setSaving(prev => ({ ...prev, [providerId]: true }))
    try {
      await setCredentials(providerId, {
        provider: providerId,
        apiKey: key.trim(),
        baseUrl: baseUrls[providerId] || undefined,
        model: PROVIDER_DEFS.find(p => p.id === providerId)?.defaultModel,
      })
      await setActiveProvider(providerId)
      setConnectionStatus(prev => ({ ...prev, [providerId]: null }))
      toast.success(`${PROVIDER_DEFS.find(p => p.id === providerId)?.name} 配置成功！`)
    } catch (err: any) {
      toast.error(`保存失败: ${err?.message || '未知错误'}`)
    } finally {
      setSaving(prev => ({ ...prev, [providerId]: false }))
    }
  }

  const handleDelete = async (providerId: string) => {
    await deleteCredentials(providerId)
    setApiKeys(prev => ({ ...prev, [providerId]: '' }))
    setConnectionStatus(prev => ({ ...prev, [providerId]: null }))
    toast.success('凭据已删除')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-primary-500" />
          <span className="text-caption font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
            个性化
          </span>
        </div>
        <h1 className="text-h1 mb-1" style={{ color: 'var(--text-primary)' }}>设置</h1>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          配置 AI 服务商和应用偏好。
        </p>
      </div>

      {/* AI Providers */}
      <section className="space-y-4">
        <h2 className="text-h3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Key size={20} className="text-primary-500" /> AI 服务商
        </h2>
        <div className="space-y-3">
          {PROVIDER_DEFS.map(provider => {
            const isActive = activeProvider === provider.id
            const connOk = connectionStatus[provider.id]
            const isTesting = testing[provider.id]
            const isSaving = saving[provider.id]

            return (
              <div
                key={provider.id}
                className="card p-5 space-y-4"
                style={isActive ? { borderLeft: '3px solid #F97316' } : {}}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {provider.name}
                    </h3>
                    <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {provider.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {connOk === true && (
                      <span className="badge badge-success">
                        <Check size={12} className="mr-1" /> 已连接
                      </span>
                    )}
                    {connOk === false && (
                      <span className="badge badge-error">
                        <X size={12} className="mr-1" /> 连接失败
                      </span>
                    )}
                    {isActive && (
                      <span className="badge badge-primary">当前使用</span>
                    )}
                  </div>
                </div>

                {/* API Key input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showKeys[provider.id] ? 'text' : 'password'}
                      placeholder="输入 API Key..."
                      value={apiKeys[provider.id] || ''}
                      onChange={e => {
                        setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))
                        setConnectionStatus(prev => ({ ...prev, [provider.id]: null }))
                      }}
                      className="input-field pr-10"
                    />
                    <button
                      onClick={() => setShowKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {showKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleTestConnection(provider.id)}
                    disabled={isTesting || !apiKeys[provider.id]?.trim()}
                    className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
                  >
                    {isTesting ? <Loader2 size={16} className="animate-spin" /> : '测试'}
                  </button>
                  <button
                    onClick={() => handleSave(provider.id)}
                    disabled={isSaving || !apiKeys[provider.id]?.trim()}
                    className="btn-primary text-sm whitespace-nowrap disabled:opacity-50"
                  >
                    {isSaving ? '保存中...' : (apiKeys[provider.id] && isActive ? '已保存 ✓' : '保存')}
                  </button>
                </div>

                {/* Custom Base URL */}
                <div>
                  <input
                    type="text"
                    placeholder={
                      provider.id === 'local'
                        ? 'Base URL (e.g., http://localhost:11434/v1)'
                        : '自定义 Base URL（代理/中转地址，可选）'
                    }
                    value={baseUrls[provider.id] || ''}
                    onChange={e => setBaseUrls(prev => ({ ...prev, [provider.id]: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>

                {connectionStatus[provider.id] === false && (
                  <p className="text-xs text-red-500">
                    连接失败。请检查 API key、网络和提供商可用性。
                  </p>
                )}

                {isActive && (
                  <button
                    onClick={() => handleDelete(provider.id)}
                    className="flex items-center gap-1.5 text-sm transition-colors"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={14} />
                    删除凭据
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-h3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Monitor size={20} className="text-primary-500" /> 外观
        </h2>
        <div className="card p-5 space-y-5">
          {/* Theme */}
          <div>
            <label className="text-sm font-medium mb-3 block" style={{ color: 'var(--text-primary)' }}>
              主题
            </label>
            <div className="flex gap-2">
              {[
                { value: 'light' as const, icon: Sun, label: '浅色' },
                { value: 'dark' as const, icon: Moon, label: '深色' },
                { value: 'system' as const, icon: Monitor, label: '跟随系统' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-md border transition-all duration-fast"
                  style={{
                    borderColor: theme === opt.value ? '#F97316' : 'var(--border-default)',
                    backgroundColor: theme === opt.value ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
                    color: theme === opt.value ? '#C2410C' : 'var(--text-secondary)',
                  }}
                >
                  <opt.icon size={16} />
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Type size={16} /> 字体大小：{fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={e => setFontSize(parseInt(e.target.value))}
              className="w-full"
              style={{ accentColor: '#F97316' }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              <span>12px</span>
              <span>24px</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="text-h3 mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Play size={18} className="text-primary-500" /> 快速操作
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full px-4 py-2.5 rounded-md text-sm text-left transition-all duration-fast card-interactive"
            style={{ color: 'var(--text-secondary)' }}
          >
            🎓 重新运行新手引导
          </button>
          <button
            onClick={() => navigate('/focus')}
            className="w-full px-4 py-2.5 rounded-md text-sm text-left transition-all duration-fast card-interactive"
            style={{ color: 'var(--text-secondary)' }}
          >
            🍅 打开专注模式
          </button>
        </div>
      </section>
    </div>
  )
}

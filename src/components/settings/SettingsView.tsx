import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settings.store'
import { useUIStore } from '../../stores/ui.store'
import { useNavigate } from 'react-router-dom'
import { Key, Eye, EyeOff, Trash2, Check, X, Monitor, Moon, Sun, Type, Loader2, Play, Sparkles, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Provider definitions ───────────────────────────────────

interface ProviderDef {
  id: string
  name: string
  description: string
  models: string[]
  defaultModel: string
  isSDK?: boolean // Uses official SDK (Claude Anthropic, OpenAI SDK) vs fetch-based
}

const PROVIDER_DEFS: ProviderDef[] = [
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: '擅长深度推理和复杂概念学习，推荐用于学习场景。',
    models: ['claude-sonnet-4-6', 'claude-opus-4-8', 'claude-haiku-4-5'],
    defaultModel: 'claude-sonnet-4-6',
    isSDK: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o 多功能高质量回复，适合广泛的学科。',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o',
    isSDK: true,
  },
]

// ── Presets for custom (OpenAI-compatible) providers ───────

interface ProviderPreset {
  id: string
  label: string
  baseUrl: string
  models: string[]
  defaultModel: string
  apiKeyHint: string
}

const CUSTOM_PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    apiKeyHint: 'sk-... 在 platform.deepseek.com 获取',
  },
  {
    id: 'qwen',
    label: '通义千问 (阿里云)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    defaultModel: 'qwen-plus',
    apiKeyHint: 'sk-... 在 dashscope.aliyun.com 获取',
  },
  {
    id: 'kimi',
    label: 'Kimi (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    defaultModel: 'moonshot-v1-32k',
    apiKeyHint: 'sk-... 在 platform.moonshot.cn 获取',
  },
  {
    id: 'zhipu',
    label: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-flash', 'glm-4', 'glm-4-plus'],
    defaultModel: 'glm-4-flash',
    apiKeyHint: '在 open.bigmodel.cn 获取',
  },
  {
    id: 'doubao',
    label: '豆包 (火山引擎)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [],
    defaultModel: '',
    apiKeyHint: '在 volcanoengine.com 创建推理接入点 (Endpoint ID 作为模型名)',
  },
  {
    id: 'ollama',
    label: 'Ollama (本地)',
    baseUrl: 'http://localhost:11434/v1',
    models: [],
    defaultModel: '',
    apiKeyHint: '本地运行无需 API Key（可留空）',
  },
]

// ── Settings View ───────────────────────────────────────────

export function SettingsView() {
  const navigate = useNavigate()
  const { activeProvider, setActiveProvider, setCredentials, deleteCredentials, configs, fontSize, setFontSize, loadSettings } = useSettingsStore()
  const { theme, setTheme } = useUIStore()
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({})
  const [customModel, setCustomModel] = useState('')
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean | null>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [selectedPreset, setSelectedPreset] = useState('')
  const [fetchedModels, setFetchedModels] = useState<string[]>([])

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
    // Detect preset from saved base URL
    const customUrl = urls['custom'] || ''
    if (customUrl) {
      const preset = CUSTOM_PRESETS.find(p => p.baseUrl === customUrl)
      if (preset) setSelectedPreset(preset.id)
    }
    if (configs['custom']?.model) {
      setCustomModel(configs['custom'].model)
    } else {
      // Try to detect model from preset
      const preset = CUSTOM_PRESETS.find(p => p.baseUrl === customUrl)
      if (preset && configs['custom']?.model) {
        setCustomModel(configs['custom'].model)
      }
    }
  }, [configs])

  useEffect(() => {
    if (Object.keys(configs).length > 0) return
    loadSettings()
  }, [])

  const handlePresetChange = async (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = CUSTOM_PRESETS.find(p => p.id === presetId)
    if (!preset) return

    setBaseUrls(prev => ({ ...prev, custom: preset.baseUrl }))
    setConnectionStatus(prev => ({ ...prev, custom: null }))
    setFetchedModels([])

    if (preset.models.length > 0) {
      setCustomModel(preset.defaultModel)
    } else {
      setCustomModel('')
      // Try to fetch models from the endpoint
      try {
        if (window.electronAPI && apiKeys['custom']) {
          const models = await window.electronAPI.ai.listModels('custom')
          if (models.length > 0) {
            setFetchedModels(models)
            setCustomModel(models[0])
            toast.success(`获取到 ${models.length} 个模型`)
          }
        }
      } catch { /* silent */ }
    }
  }

  const handleTestConnection = async (providerId: string) => {
    const key = apiKeys[providerId]
    // Ollama doesn't require an API key
    const isOllama = providerId === 'custom' && selectedPreset === 'ollama'
    if (!key?.trim() && !isOllama) {
      toast.error('请先输入 API Key')
      return
    }
    setTesting(prev => ({ ...prev, [providerId]: true }))
    try {
      const result = await window.electronAPI!.ai.testConnection(
        providerId,
        (key || '').trim(),
        baseUrls[providerId]?.trim() || undefined
      )
      setConnectionStatus(prev => ({ ...prev, [providerId]: result.success }))
      if (result.success) {
        const label = providerId === 'custom' && selectedPreset
          ? CUSTOM_PRESETS.find(p => p.id === selectedPreset)?.label || '自定义'
          : PROVIDER_DEFS.find(p => p.id === providerId)?.name || providerId
        toast.success(`${label} 连接成功！`)
      } else {
        toast.error('连接失败 — 请检查 API Key、Base URL 和网络')
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
    const isOllama = providerId === 'custom' && selectedPreset === 'ollama'
    if (!key?.trim() && !isOllama) {
      toast.error('API Key 不能为空')
      return
    }
    setSaving(prev => ({ ...prev, [providerId]: true }))
    try {
      const model = providerId === 'custom'
        ? customModel
        : PROVIDER_DEFS.find(p => p.id === providerId)?.defaultModel
      await setCredentials(providerId, {
        provider: providerId,
        apiKey: (key || '').trim(),
        baseUrl: baseUrls[providerId] || undefined,
        model: model || undefined,
      })
      await setActiveProvider(providerId)
      setConnectionStatus(prev => ({ ...prev, [providerId]: null }))
      const label = providerId === 'custom' && selectedPreset
        ? CUSTOM_PRESETS.find(p => p.id === selectedPreset)?.label || '自定义'
        : PROVIDER_DEFS.find(p => p.id === providerId)?.name || providerId
      toast.success(`${label} 配置已保存！`)
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
    if (providerId === 'custom') {
      setSelectedPreset('')
      setCustomModel('')
      setFetchedModels([])
    }
    toast.success('凭据已删除')
  }

  const customIsActive = activeProvider === 'custom'
  const customConnOk = connectionStatus['custom']
  const customTesting = testing['custom']
  const customSaving = saving['custom']
  const currentPreset = CUSTOM_PRESETS.find(p => p.id === selectedPreset)
  const availableModels = currentPreset && currentPreset.models.length > 0
    ? currentPreset.models
    : fetchedModels

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

      {/* ── Official SDK Providers (Claude, OpenAI) ────────── */}
      <section className="space-y-4">
        <h2 className="text-h3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Key size={20} className="text-primary-500" /> AI 服务商
        </h2>

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

              {/* Custom Base URL (for proxy/relay) */}
              <div>
                <input
                  type="text"
                  placeholder="自定义 Base URL（代理/中转地址，可选）"
                  value={baseUrls[provider.id] || ''}
                  onChange={e => setBaseUrls(prev => ({ ...prev, [provider.id]: e.target.value }))}
                  className="input-field text-sm"
                />
              </div>

              {connectionStatus[provider.id] === false && (
                <p className="text-xs text-red-500">
                  连接失败。请检查 API Key、网络和提供商可用性。
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

        {/* ── Custom API (OpenAI-compatible) ────────────────── */}
        <div
          className="card p-5 space-y-4"
          style={customIsActive ? { borderLeft: '3px solid #F97316' } : {}}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                自定义 API（OpenAI 兼容）
              </h3>
              <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                兼容任何 OpenAI 格式的 API：DeepSeek、通义千问、Kimi、智谱、豆包、Ollama 等。
              </p>
            </div>
            <div className="flex items-center gap-2">
              {customConnOk === true && (
                <span className="badge badge-success">
                  <Check size={12} className="mr-1" /> 已连接
                </span>
              )}
              {customConnOk === false && (
                <span className="badge badge-error">
                  <X size={12} className="mr-1" /> 连接失败
                </span>
              )}
              {customIsActive && (
                <span className="badge badge-primary">当前使用</span>
              )}
            </div>
          </div>

          {/* Preset selector */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
              快速选择提供商
            </label>
            <div className="relative">
              <select
                value={selectedPreset}
                onChange={e => handlePresetChange(e.target.value)}
                className="input-field appearance-none pr-10"
              >
                <option value="">手动输入...</option>
                {CUSTOM_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-tertiary)' }}
              />
            </div>
          </div>

          {/* API Key */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKeys['custom'] ? 'text' : 'password'}
                placeholder={currentPreset?.apiKeyHint || '输入 API Key...'}
                value={apiKeys['custom'] || ''}
                onChange={e => {
                  setApiKeys(prev => ({ ...prev, custom: e.target.value }))
                  setConnectionStatus(prev => ({ ...prev, custom: null }))
                }}
                className="input-field pr-10"
              />
              <button
                onClick={() => setShowKeys(prev => ({ ...prev, custom: !prev['custom'] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {showKeys['custom'] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={() => handleTestConnection('custom')}
              disabled={customTesting || (!apiKeys['custom']?.trim() && selectedPreset !== 'ollama')}
              className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
            >
              {customTesting ? <Loader2 size={16} className="animate-spin" /> : '测试'}
            </button>
            <button
              onClick={() => handleSave('custom')}
              disabled={customSaving || (!apiKeys['custom']?.trim() && selectedPreset !== 'ollama')}
              className="btn-primary text-sm whitespace-nowrap disabled:opacity-50"
            >
              {customSaving ? '保存中...' : (apiKeys['custom'] && customIsActive ? '已保存 ✓' : '保存')}
            </button>
          </div>

          {/* Base URL */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
              Base URL
            </label>
            <input
              type="text"
              placeholder="https://api.deepseek.com/v1"
              value={baseUrls['custom'] || ''}
              onChange={e => {
                setBaseUrls(prev => ({ ...prev, custom: e.target.value }))
                setConnectionStatus(prev => ({ ...prev, custom: null }))
                // Clear preset if user manually changes URL
                if (e.target.value !== currentPreset?.baseUrl) {
                  setSelectedPreset('')
                }
              }}
              className="input-field text-sm"
            />
          </div>

          {/* Model selector */}
          {availableModels.length > 0 && (
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
                模型
              </label>
              <div className="relative">
                <select
                  value={customModel}
                  onChange={e => setCustomModel(e.target.value)}
                  className="input-field appearance-none pr-10"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-tertiary)' }}
                />
              </div>
            </div>
          )}

          {/* Custom model input (when no models available or user wants custom) */}
          {availableModels.length === 0 && (
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
                模型名称
              </label>
              <input
                type="text"
                placeholder="输入模型名称（如 deepseek-chat、qwen-plus...）"
                value={customModel}
                onChange={e => setCustomModel(e.target.value)}
                className="input-field text-sm"
              />
              {selectedPreset === 'ollama' && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  在终端运行 <code className="px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-inset)' }}>ollama list</code> 查看已安装的模型
                </p>
              )}
              {selectedPreset === 'doubao' && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  豆包需要在火山引擎控制台创建"推理接入点"，将接入点 ID (如 ep-xxx) 填入此处
                </p>
              )}
            </div>
          )}

          {connectionStatus['custom'] === false && (
            <p className="text-xs text-red-500">
              连接失败。请检查 API Key、Base URL 和网络。
            </p>
          )}

          {customIsActive && (
            <button
              onClick={() => handleDelete('custom')}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: '#EF4444' }}
            >
              <Trash2 size={14} />
              删除凭据
            </button>
          )}
        </div>
      </section>

      {/* ── Appearance ──────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-h3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Monitor size={20} className="text-primary-500" /> 外观
        </h2>
        <div className="card p-5 space-y-5">
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

      {/* ── Quick Actions ───────────────────────────────────── */}
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

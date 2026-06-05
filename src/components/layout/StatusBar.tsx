import { useSessionStore } from '../../stores/session.store'
import { useSettingsStore } from '../../stores/settings.store'
import { Clock, Brain, Zap } from 'lucide-react'

export function StatusBar() {
  const { activeSession, elapsedSeconds } = useSessionStore()
  const { activeProvider } = useSettingsStore()

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  return (
    <div
      className="h-7 flex items-center justify-between px-4 text-xs"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-tertiary)',
      }}
    >
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Zap size={12} className="text-primary-500" />
          学习助手 v1.0
        </span>
        <span className="hidden lg:inline" style={{ color: 'var(--border-strong)' }}>|</span>
        <span className="hidden lg:inline">Ctrl+Shift+F 专注模式</span>
        <span className="hidden lg:inline">Ctrl+, 设置</span>
      </div>
      <div className="flex items-center gap-4">
        {activeProvider && (
          <span className="flex items-center gap-1.5">
            <Brain size={12} />
            {activeProvider}
          </span>
        )}
        {activeSession && (
          <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
            <Clock size={12} />
            {formatTime(elapsedSeconds)}
          </span>
        )}
      </div>
    </div>
  )
}

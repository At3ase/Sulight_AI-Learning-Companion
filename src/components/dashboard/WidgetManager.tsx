import React, { useState, useRef, useEffect } from 'react'
import { Plus, X, Flame, BarChart3, Clock, StickyNote } from 'lucide-react'

const LS_KEY = 'dashboard_widgets'

export interface DashboardWidget {
  id: string
  label: string
  icon: React.ReactNode
  description: string
}

const AVAILABLE_WIDGETS: DashboardWidget[] = [
  {
    id: 'streak',
    label: '学习连续',
    icon: <Flame size={14} />,
    description: '显示连续学习天数',
  },
  {
    id: 'today-stats',
    label: '今日统计',
    icon: <BarChart3 size={14} />,
    description: '今日学习时长与会话数',
  },
  {
    id: 'focus-mini',
    label: '番茄钟快捷',
    icon: <Clock size={14} />,
    description: '快速启动专注模式',
  },
]

export function getStoredWidgets(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStoredWidgets(ids: string[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

export function useDashboardWidgets(): [string[], (id: string) => void, (id: string) => void] {
  const [enabled, setEnabled] = useState<string[]>(getStoredWidgets)

  const toggle = (id: string) => {
    setEnabled(prev => {
      const next = prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
      saveStoredWidgets(next)
      return next
    })
  }

  const remove = (id: string) => {
    setEnabled(prev => {
      const next = prev.filter(w => w !== id)
      saveStoredWidgets(next)
      return next
    })
  }

  return [enabled, toggle, remove]
}

interface WidgetManagerProps {
  enabled: string[]
  onToggle: (id: string) => void
}

export function WidgetManager({ enabled, onToggle }: WidgetManagerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-fast hover:scale-110 active:scale-95"
        style={{
          backgroundColor: 'var(--bg-inset)',
          color: 'var(--text-secondary)',
          border: '1px dashed var(--border-default)',
        }}
        title="添加组件"
      >
        <Plus size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 z-20 w-60 rounded-xl p-3 animate-scale-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          <p className="text-caption mb-2.5" style={{ color: 'var(--text-tertiary)' }}>
            📦 添加功能组件
          </p>
          <div className="space-y-1">
            {AVAILABLE_WIDGETS.map(w => {
              const isOn = enabled.includes(w.id)
              return (
                <button
                  key={w.id}
                  onClick={() => onToggle(w.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-fast"
                  style={{
                    backgroundColor: isOn ? 'rgba(249, 115, 22, 0.06)' : 'transparent',
                  }}
                >
                  <span style={{ color: isOn ? '#F97316' : 'var(--text-tertiary)' }}>
                    {w.icon}
                  </span>
                  <span className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>
                    {w.label}
                  </span>
                  <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                    {w.description}
                  </span>
                  {isOn && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

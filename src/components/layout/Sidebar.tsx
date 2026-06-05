import { NavigationMenu } from './NavigationMenu'
import { useUIStore } from '../../stores/ui.store'
import { PanelLeftClose, PanelLeft, Sparkles } from 'lucide-react'

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-16'
      } flex flex-col transition-all duration-300 ease-default`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* App Title */}
      <div
        className="h-16 flex items-center px-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <span
              className="font-semibold text-sm truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              学习助手
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md transition-all duration-fast"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-inset)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'
          }}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <NavigationMenu collapsed={!sidebarOpen} />

      {/* User area */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => {
            window.location.hash = '#/settings'
          }}
          className="w-full flex items-center gap-2.5 p-2.5 rounded-md transition-all duration-fast"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-inset)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
          }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-xs font-semibold text-white">U</span>
          </div>
          {sidebarOpen && (
            <span className="text-sm">设置</span>
          )}
        </button>
      </div>
    </aside>
  )
}

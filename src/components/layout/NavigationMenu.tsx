import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Pyramid,
  MessageCircleQuestion,
  Library,
  BarChart3,
  RefreshCw,
  GraduationCap,
  History,
  Timer,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘', shortcut: '⌘D' },
  { to: '/feynman', icon: BookOpen, label: '费曼技巧', shortcut: '⌘1' },
  { to: '/first-principles', icon: Pyramid, label: '第一性原理', shortcut: '⌘2' },
  { to: '/socratic', icon: MessageCircleQuestion, label: '苏格拉底', shortcut: '⌘3' },
  { to: '/review', icon: RefreshCw, label: '间隔复习', shortcut: '⌘R' },
  { to: '/knowledge', icon: Library, label: '知识库' },
  { to: '/courses', icon: GraduationCap, label: '课程' },
  { to: '/progress', icon: BarChart3, label: '学习进度' },
  { to: '/focus', icon: Timer, label: '专注模式', shortcut: '⇧⌘F' },
  { to: '/history', icon: History, label: '学习记录' },
]

interface NavigationMenuProps {
  collapsed: boolean
}

export function NavigationMenu({ collapsed }: NavigationMenuProps) {
  return (
    <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-fast ${
              isActive
                ? 'font-medium'
                : ''
            }`
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
            color: isActive ? '#C2410C' : 'var(--text-secondary)',
          })}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            if (!el.classList.contains('active')) {
              el.style.backgroundColor = 'var(--bg-inset)'
              el.style.color = 'var(--text-primary)'
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            if (!el.classList.contains('active')) {
              el.style.backgroundColor = 'transparent'
              el.style.color = 'var(--text-secondary)'
            }
          }}
          title={collapsed ? item.label : undefined}
        >
          <item.icon size={20} className="flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    backgroundColor: 'var(--bg-inset)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {item.shortcut}
                </kbd>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

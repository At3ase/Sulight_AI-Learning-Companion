import { useNavigate } from 'react-router-dom'
import { BookOpen, Pyramid, MessageCircleQuestion, TrendingUp, Clock, RefreshCw, Sparkles } from 'lucide-react'
import { useSessionStore } from '../../stores/session.store'
import { useSettingsStore } from '../../stores/settings.store'
import { StudyOverviewWidget } from './StudyOverviewWidget'
import { DailyReviewWidget } from './DailyReviewWidget'
import { WidgetManager, useDashboardWidgets } from './WidgetManager'
import { renderExtraWidget } from './ExtraWidgets'

const quickStarts = [
  {
    title: '费曼技巧',
    description: '用简单的语言解释概念，让 AI 发现你理解中的漏洞。',
    icon: BookOpen,
    path: '/feynman',
    gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accentColor: '#D97706',
  },
  {
    title: '第一性原理',
    description: '将任何主题拆解到根本真理，从零重建知识体系。',
    icon: Pyramid,
    path: '/first-principles',
    gradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20',
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
    accentColor: '#0D9488',
  },
  {
    title: '苏格拉底式对话',
    description: '通过深度提问挑战你的假设，发现更深层次的洞见。',
    icon: MessageCircleQuestion,
    path: '/socratic',
    gradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accentColor: '#059669',
  },
]

export function DashboardView() {
  const navigate = useNavigate()
  const { activeSession, elapsedSeconds } = useSessionStore()
  const { activeProvider, providers } = useSettingsStore()
  const [enabledWidgets, toggleWidget, removeWidget] = useDashboardWidgets()

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in-up">
      {/* ═══ Row 1: Welcome + Widget Manager ═══ */}
      <div className="flex items-start gap-4">
        <div className="flex-1 relative overflow-hidden rounded-xl p-5 bg-gradient-warm">
          <div className="relative z-10 flex items-center gap-3">
            <Sparkles size={22} className="text-primary-500 flex-shrink-0" />
            <div>
              <h1 className="text-h3" style={{ color: 'var(--text-primary)' }}>
                准备好掌握你的学科了吗？
              </h1>
              <p className="text-body-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                选择一种学习模式，或继续上次未完成的会话。
              </p>
            </div>
          </div>
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary-100/50 dark:bg-primary-900/20 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-secondary-100/50 dark:bg-secondary-900/20 blur-2xl" />
        </div>

        {/* "+" widget manager */}
        <div className="flex-shrink-0 pt-1">
          <WidgetManager enabled={enabledWidgets} onToggle={toggleWidget} />
        </div>
      </div>

      {/* ═══ Row 2: Quick Start Cards (3 cols) ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quickStarts.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="card p-4 text-left card-hover group relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative z-10 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg} shadow-sm`}>
                <item.icon size={20} className={item.iconColor} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </h3>
                <p className="text-body-sm mt-0.5 leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {item.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ═══ Row 3: Active Session Banner ═══ */}
      {activeSession && (
        <div
          className="card p-4 flex items-center justify-between"
          style={{
            borderLeft: '3px solid #F97316',
            backgroundColor: 'rgba(249, 115, 22, 0.04)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shadow-sm">
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {activeSession.title}
              </p>
              <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                已学习 {formatTime(elapsedSeconds)}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/${activeSession.mode === 'feynman' ? 'feynman' : activeSession.mode === 'first_principles' ? 'first-principles' : 'socratic'}`)}
            className="btn-primary text-sm"
          >
            继续学习
          </button>
        </div>
      )}

      {/* ═══ Row 4: Study Overview + Daily Review (side by side) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <StudyOverviewWidget />
        <DailyReviewWidget compact onStartReview={() => navigate('/review')} />
      </div>

      {/* ═══ Row 5: Extra Widgets (from "+" menu) ═══ */}
      {enabledWidgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {enabledWidgets.map(id => renderExtraWidget(id, () => removeWidget(id)))}
        </div>
      )}

      {/* ═══ Setup Reminder ═══ */}
      {providers.length === 0 && (
        <div
          className="card p-4"
          style={{
            borderLeft: '3px solid #F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.04)',
          }}
        >
          <div className="flex items-start gap-3">
            <TrendingUp size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-amber-800 dark:text-amber-200">
                配置 AI 服务商
              </p>
              <p className="text-body-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                前往{' '}
                <button
                  onClick={() => navigate('/settings')}
                  className="underline font-medium transition-colors hover:text-primary-600"
                  style={{ color: 'var(--text-primary)' }}
                >
                  设置
                </button>{' '}
                页面配置 API Key，启用 AI 驱动的学习功能。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Getting Started — always visible, page scrolls naturally ═══ */}
      {!activeSession && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4 text-h3" style={{ color: 'var(--text-primary)' }}>
            快速上手
          </h2>
          <div className="space-y-3">
            {[
              '在设置中配置 AI 服务商 — 支持 Claude、OpenAI、DeepSeek、通义千问、Kimi 等。',
              '在知识库中添加学习资料 — 导入 PDF、文档或粘贴笔记。',
              '选择一种学习模式，用 AI 引导的方法掌握任何学科。',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
                >
                  {i + 1}
                </span>
                <p className="text-body-sm pt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

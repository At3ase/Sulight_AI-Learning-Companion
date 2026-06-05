import { useNavigate } from 'react-router-dom'
import { BookOpen, Pyramid, MessageCircleQuestion, TrendingUp, Clock, RefreshCw, Sparkles } from 'lucide-react'
import { useSessionStore } from '../../stores/session.store'
import { useSettingsStore } from '../../stores/settings.store'
import { DailyReviewWidget } from './DailyReviewWidget'
import { ExamCountdownBanner } from './ExamCountdownBanner'
import { SubjectProgressWidget } from './SubjectProgressWidget'

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-warm">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-primary-500" />
            <span className="text-caption font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
              欢迎回来
            </span>
          </div>
          <h1 className="text-h1 mb-2" style={{ color: 'var(--text-primary)' }}>
            准备好掌握你的学科了吗？
          </h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            选择一种学习模式，或继续上次未完成的会话。
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-100/50 dark:bg-primary-900/20 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-secondary-100/50 dark:bg-secondary-900/20 blur-2xl" />
      </div>

      {/* Subject Progress */}
      <SubjectProgressWidget onStartReview={() => navigate('/review')} />

      {/* Active Session Banner */}
      {activeSession && (
        <div
          className="card p-4 flex items-center justify-between"
          style={{
            borderLeft: '3px solid #F97316',
            backgroundColor: 'rgba(249, 115, 22, 0.04)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-sm">
              <Clock size={20} className="text-white" />
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
            onClick={() => navigate(`/${activeSession.mode}`)}
            className="btn-primary text-sm"
          >
            继续学习
          </button>
        </div>
      )}

      {/* Daily Review Widget */}
      {!activeSession && (
        <DailyReviewWidget onStartReview={() => navigate('/review')} />
      )}

      {/* Exam Countdown Banner */}
      {!activeSession && (
        <ExamCountdownBanner onStartReview={() => navigate('/review')} />
      )}

      {/* Quick Start Cards */}
      <div>
        <h2 className="text-h2 mb-5" style={{ color: 'var(--text-primary)' }}>
          开始学习
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickStarts.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`card p-5 text-left card-hover group relative overflow-hidden`}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-3 ${item.iconBg} shadow-sm`}>
                  <item.icon size={22} className={item.iconColor} />
                </div>
                <h3
                  className="font-semibold mb-1.5 transition-colors duration-200"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.title}
                </h3>
                <p className="text-body-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Setup reminder */}
      {providers.length === 0 && (
        <div
          className="card p-5"
          style={{
            borderLeft: '3px solid #F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.04)',
          }}
        >
          <div className="flex items-start gap-3">
            <TrendingUp size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
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

      {/* Getting Started */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4 text-h3" style={{ color: 'var(--text-primary)' }}>
          快速上手
        </h2>
        <div className="space-y-3">
          {[
            '在设置中配置 AI 服务商 — 添加 Claude、OpenAI 或本地模型的 API Key。',
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
    </div>
  )
}

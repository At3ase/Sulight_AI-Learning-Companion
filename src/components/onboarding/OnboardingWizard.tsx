import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Pyramid, MessageCircleQuestion, Settings, ArrowRight,
  ArrowLeft, Check, Library, BarChart3, RefreshCw, Sparkles,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

interface Step {
  title: string
  description: string
  icon: LucideIcon
}

const STEPS: Step[] = [
  {
    title: '欢迎使用学习助手',
    description: '这是一个专为大学生设计的 AI 驱动学习工具。\n通过三种经典学习方法，帮助你真正理解知识、而非死记硬背。',
    icon: BookOpen,
  },
  {
    title: '配置 AI 服务商',
    description: '在开始之前，你需要配置一个 AI 服务商（如 Claude 或 OpenAI）。\n你可以在设置页面填入 API Key，也可以使用本地 Ollama 模型。',
    icon: Settings,
  },
  {
    title: '三种学习模式',
    description: '📖 费曼技巧：用简单的话向别人解释概念\n🔺 第一性原理：将概念分解到最基本真理\n❓ 苏格拉底对话：通过问答逼出深层理解\n\n每种模式都配有 AI 导师，实时引导你。',
    icon: Pyramid,
  },
  {
    title: '智能复习与追踪',
    description: '📝 自动生成间隔重复卡片\n📊 可视化进度仪表板\n🏆 成就系统激励学习\n🎯 课程管理与考试倒计时\n\n学完就复习，不再遗忘。',
    icon: RefreshCw,
  },
  {
    title: '准备开始',
    description: '你已经准备就绪！从费曼技巧开始你的第一次学习之旅吧。\n\n💡 提示：按 Ctrl+Shift+F 随时进入专注模式。',
    icon: Check,
  },
]

export function OnboardingWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]
  const Icon = current.icon

  const handleNext = () => {
    if (isLast) {
      finishOnboarding()
    } else {
      setStep(s => s + 1)
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleSkip = () => {
    finishOnboarding()
  }

  const finishOnboarding = () => {
    if (window.electronAPI) {
      window.electronAPI.settings.set('onboarding_completed', '1').catch(() => {})
    }
    localStorage.setItem('onboarding_completed', '1')
    navigate('/')
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-100/50 dark:bg-primary-900/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-secondary-100/50 dark:bg-secondary-900/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent-100/30 dark:bg-accent-900/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 32 : 10,
                backgroundColor: i === step
                  ? '#F97316'
                  : i < step
                    ? 'rgba(249, 115, 22, 0.4)'
                    : 'var(--border-default)',
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8 text-center transition-all duration-300 animate-scale-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            }}
          >
            <Icon size={32} className="text-primary-500" />
          </div>

          {/* Title */}
          <h2 className="text-h2 mb-3" style={{ color: 'var(--text-primary)' }}>
            {current.title}
          </h2>

          {/* Description */}
          <p
            className="text-body leading-relaxed whitespace-pre-line mb-8"
            style={{ color: 'var(--text-secondary)' }}
          >
            {current.description}
          </p>

          {/* Feature grid for step 2 (learning modes) */}
          {step === 2 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: BookOpen, label: '费曼', color: '#D97706', bg: '#FFF7ED' },
                { icon: Pyramid, label: '第一性', color: '#0D9488', bg: '#F0FDFA' },
                { icon: MessageCircleQuestion, label: '苏格拉底', color: '#059669', bg: '#ECFDF5' },
              ].map(m => (
                <div
                  key={m.label}
                  className="p-3 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: m.bg,
                  }}
                >
                  <m.icon size={24} style={{ color: m.color }} className="mx-auto mb-1.5" />
                  <span className="text-xs font-medium" style={{ color: m.color }}>{m.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 3 feature grid */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: RefreshCw, label: '间隔重复', color: '#D97706' },
                { icon: BarChart3, label: '进度分析', color: '#0D9488' },
                { icon: Library, label: '知识库', color: '#059669' },
                { icon: Check, label: '成就系统', color: '#F97316' },
              ].map(f => (
                <div
                  key={f.label}
                  className="p-3 rounded-lg flex items-center gap-2.5"
                  style={{ backgroundColor: 'var(--bg-inset)' }}
                >
                  <f.icon size={18} style={{ color: f.color }} className="flex-shrink-0" />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="text-sm transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              跳过
            </button>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-fast btn-secondary"
                >
                  <ArrowLeft size={16} className="inline mr-1" />
                  上一步
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-md text-sm font-medium text-white transition-all duration-fast"
                style={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
                }}
              >
                {isLast ? (
                  <><Sparkles size={16} className="inline mr-1" /> 开始学习</>
                ) : (
                  <>下一步 <ArrowRight size={16} className="inline ml-1" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step counter */}
        <p className="text-center text-caption mt-4" style={{ color: 'var(--text-tertiary)' }}>
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  )
}

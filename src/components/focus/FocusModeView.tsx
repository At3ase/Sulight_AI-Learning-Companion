import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw, Coffee, Brain, ChevronLeft, Settings, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

const LS_KEY = 'focus_mode_settings'

interface TimerSettings {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLongBreak: number
}

function loadSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 }
}

function saveSettings(s: TimerSettings): void {
  localStorage.setItem(LS_KEY, JSON.stringify(s))
}

type TimerPhase = 'focus' | 'short-break' | 'long-break'

export function FocusModeView() {
  const navigate = useNavigate()

  const [settings, setSettings] = useState<TimerSettings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [draftSettings, setDraftSettings] = useState<TimerSettings>(settings)

  const [phase, setPhase] = useState<TimerPhase>('focus')
  const [secondsLeft, setSecondsLeft] = useState(settings.focusMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0)

  const phaseMinutes =
    phase === 'focus' ? settings.focusMinutes :
    phase === 'short-break' ? settings.shortBreakMinutes :
    settings.longBreakMinutes

  const totalSeconds = phaseMinutes * 60
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0

  const phaseConfig = {
    focus: {
      label: '专注中',
      icon: Brain,
      gradient: 'from-amber-400 to-orange-500',
      ringGradient: ['#FBBF24', '#F97316'],
      bgGradient: 'from-amber-50/20 to-orange-50/10',
    },
    'short-break': {
      label: '短休息',
      icon: Coffee,
      gradient: 'from-teal-400 to-cyan-500',
      ringGradient: ['#2DD4BF', '#14B8A6'],
      bgGradient: 'from-teal-50/20 to-cyan-50/10',
    },
    'long-break': {
      label: '长休息',
      icon: Coffee,
      gradient: 'from-emerald-400 to-green-500',
      ringGradient: ['#34D399', '#10B981'],
      bgGradient: 'from-emerald-50/20 to-green-50/10',
    },
  } as const

  const config = phaseConfig[phase]

  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(phaseMinutes * 60)
    }
  }, [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  const advancePhase = useCallback(() => {
    setIsRunning(false)
    if (phase === 'focus') {
      const newCompleted = completedSessions + 1
      setCompletedSessions(newCompleted)
      setTotalFocusMinutes(prev => prev + settings.focusMinutes)
      toast.success(`🎉 完成第 ${newCompleted} 个番茄钟！`, { duration: 4000 })

      if (newCompleted % settings.sessionsBeforeLongBreak === 0) {
        setPhase('long-break')
        setSecondsLeft(settings.longBreakMinutes * 60)
      } else {
        setPhase('short-break')
        setSecondsLeft(settings.shortBreakMinutes * 60)
      }
    } else {
      setPhase('focus')
      setSecondsLeft(settings.focusMinutes * 60)
      toast('开始新的番茄钟 🍅', { icon: '⏰', duration: 3000 })
    }
  }, [phase, completedSessions, settings])

  useEffect(() => {
    if (secondsLeft > 0 || !isRunning) return

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.value = 0.3
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
      setTimeout(() => {
        const osc2 = ctx.createOscillator()
        osc2.connect(gain)
        osc2.frequency.value = 1100
        osc2.start()
        osc2.stop(ctx.currentTime + 0.3)
      }, 350)
    } catch {}

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(
        phase === 'focus' ? '🍅 专注时间结束！' : '☕ 休息时间结束！',
        { body: phase === 'focus' ? '干得好！休息一下吧。' : '准备好继续专注学习了吗？' }
      )
    }

    advancePhase()
  }, [secondsLeft])

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false)
    } else {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
      setIsRunning(true)
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    setSecondsLeft(phaseMinutes * 60)
  }

  const skipPhase = () => {
    setIsRunning(false)
    advancePhase()
  }

  const handleExit = () => {
    setIsRunning(false)
    navigate(-1)
  }

  const applySettings = () => {
    setSettings(draftSettings)
    saveSettings(draftSettings)
    setShowSettings(false)
    setIsRunning(false)
    if (phase === 'focus') {
      setSecondsLeft(draftSettings.focusMinutes * 60)
    } else if (phase === 'short-break') {
      setSecondsLeft(draftSettings.shortBreakMinutes * 60)
    } else {
      setSecondsLeft(draftSettings.longBreakMinutes * 60)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false)
        } else {
          handleExit()
        }
        return
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        toggleTimer()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isRunning, showSettings])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} pointer-events-none`} />

      {/* Header */}
      <button
        onClick={handleExit}
        className="absolute top-4 left-4 p-2 rounded-md transition-all duration-fast"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ChevronLeft size={24} />
      </button>
      <span className="absolute top-5 left-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
        按 Esc 退出
      </span>

      {completedSessions > 0 && (
        <div className="absolute top-5 right-5 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          🍅 × {completedSessions} &nbsp;|&nbsp; 共 {totalFocusMinutes} 分钟
        </div>
      )}

      <button
        onClick={() => {
          setDraftSettings(settings)
          setShowSettings(!showSettings)
        }}
        className="absolute top-4 right-4 p-2 rounded-md transition-all duration-fast"
        style={{ color: 'var(--text-tertiary)' }}
        title="设置"
      >
        <Settings size={20} />
      </button>

      {/* Settings panel */}
      {showSettings && (
        <div
          className="absolute top-14 right-4 z-10 rounded-xl p-5 w-72 animate-scale-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            ⏱ 计时设置
          </h3>
          <div className="space-y-3">
            {[
              { label: '专注时长（分钟）', key: 'focusMinutes', min: 1, max: 120 },
              { label: '短休息（分钟）', key: 'shortBreakMinutes', min: 1, max: 60 },
              { label: '长休息（分钟）', key: 'longBreakMinutes', min: 1, max: 120 },
              { label: '长休息间隔（几个番茄后）', key: 'sessionsBeforeLongBreak', min: 1, max: 10 },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  {field.label}
                </label>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={draftSettings[field.key as keyof TimerSettings]}
                  onChange={e => setDraftSettings(s => ({
                    ...s,
                    [field.key]: Math.max(field.min, parseInt(e.target.value) || field.min),
                  }))}
                  className="input-field"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 py-2 px-3 rounded-md text-sm btn-secondary"
            >
              取消
            </button>
            <button
              onClick={applySettings}
              className="flex-1 py-2 px-3 rounded-md text-sm btn-primary"
            >
              应用
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Phase label */}
        <div className="flex items-center gap-2 text-lg font-medium">
          <config.icon size={24} className={`text-gradient-${phase === 'focus' ? 'primary' : 'secondary'}`} />
          <span
            className={phase === 'focus' ? 'text-gradient-primary' : 'text-gradient-secondary'}
          >
            {config.label}
          </span>
        </div>

        {/* Timer ring */}
        <div className="relative w-64 h-64">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="timerRing" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={config.ringGradient[0]} />
                <stop offset="100%" stopColor={config.ringGradient[1]} />
              </linearGradient>
            </defs>
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              style={{ color: 'var(--border-subtle)' }}
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="url(#timerRing)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-6xl font-mono font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {formatTime(secondsLeft)}
            </span>
            <span className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
              {phase === 'focus' ? `${settings.focusMinutes} 分钟专注` : '休息'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={resetTimer}
            className="p-3 rounded-full transition-all duration-fast"
            style={{ color: 'var(--text-tertiary)' }}
            title="重置"
          >
            <RotateCcw size={20} />
          </button>

          <button
            onClick={toggleTimer}
            className="px-8 py-4 rounded-full font-semibold text-lg transition-all duration-normal"
            style={
              isRunning
                ? {
                    backgroundColor: 'var(--bg-inset)',
                    color: 'var(--text-secondary)',
                  }
                : {
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25), 0 0 20px rgba(249, 115, 22, 0.15)',
                  }
            }
          >
            {isRunning ? (
              <span className="flex items-center gap-2"><Pause size={20} /> 暂停</span>
            ) : (
              <span className="flex items-center gap-2"><Play size={20} /> 开始</span>
            )}
          </button>

          <button
            onClick={skipPhase}
            className="p-3 rounded-full transition-all duration-fast"
            style={{ color: 'var(--text-tertiary)' }}
            title="跳过"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 19 22 12 13 5 13 19" />
              <polygon points="2 19 11 12 2 5 2 19" />
            </svg>
          </button>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          按 <kbd
            className="px-1.5 py-0.5 text-xs rounded"
            style={{
              backgroundColor: 'var(--bg-inset)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >空格键</kbd> 开始 / 暂停 &nbsp;|&nbsp;
          <button
            onClick={() => setShowSettings(true)}
            className="underline transition-colors hover:text-primary-600"
            style={{ color: 'var(--text-tertiary)' }}
          >
            自定义时长
          </button>
        </p>
      </div>
    </div>
  )
}

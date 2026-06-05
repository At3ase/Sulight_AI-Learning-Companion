import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MessageSquare, ArrowLeft, BookOpen, Pyramid, MessageCircleQuestion, Play, Sparkles } from 'lucide-react'
import { AvatarBubble } from '@/components/learning-modes/shared/AvatarBubble'
import { useSessionStore } from '@/stores/session.store'
import toast from 'react-hot-toast'
import type { StudySession } from '@/types/database'

const MODE_META: Record<string, { icon: typeof BookOpen; label: string; persona: 'feynman' | 'first_principles' | 'socratic' }> = {
  feynman: { icon: BookOpen, label: '费曼技巧', persona: 'feynman' },
  first_principles: { icon: Pyramid, label: '第一性原理', persona: 'first_principles' },
  socratic: { icon: MessageCircleQuestion, label: '苏格拉底', persona: 'socratic' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'Z')
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m} 分钟`
  const h = Math.floor(m / 60)
  return `${h} 小时 ${m % 60} 分钟`
}

export function SessionHistoryView() {
  const navigate = useNavigate()
  const { resumeExistingSession } = useSessionStore()
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    if (!window.electronAPI) return
    setLoading(true)
    try {
      const all = await window.electronAPI.db.sessions.list()
      const completed = all
        .filter((s: StudySession) => s.status === 'completed' || (s.duration_seconds ?? 0) > 0)
        .sort((a: StudySession, b: StudySession) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )
      setSessions(completed)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const viewSession = async (session: StudySession) => {
    setSelectedSession(session)
    setLoadingMessages(true)
    try {
      const rows = await window.electronAPI!.db.chatMessages.listBySession(session.id)
      setMessages(rows.map((r: any) => ({
        role: r.role,
        content: r.content,
      })))
    } catch {
      setMessages([])
    }
    setLoadingMessages(false)
  }

  const handleResume = async (session: StudySession) => {
    const modePath = session.mode === 'first_principles' ? '/first-principles' : `/${session.mode}`
    const resumed = await resumeExistingSession(session.id)
    if (resumed) {
      toast.success('已恢复会话，可以继续对话')
      navigate(modePath)
    } else {
      toast.error('恢复会话失败')
    }
  }

  const backToList = () => {
    setSelectedSession(null)
    setMessages([])
  }

  if (selectedSession) {
    const meta = MODE_META[selectedSession.mode] || MODE_META.feynman
    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto">
        {/* Header */}
        <div
          className="flex items-center gap-3 py-3 px-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={backToList}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{selectedSession.title}</h2>
            <p className="text-caption flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
              <span className="flex items-center gap-1"><meta.icon size={12} />{meta.label}</span>
              <span>·</span>
              <span>{formatDate(selectedSession.started_at)}</span>
              <span>·</span>
              <span>{formatDuration(selectedSession.duration_seconds || 0)}</span>
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loadingMessages ? (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-tertiary)' }}>加载中...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-tertiary)' }}>该会话没有聊天记录</p>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <AvatarBubble persona={meta.persona} size="sm" />}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'rounded-br-md text-white' : 'rounded-bl-md'
                  }`}
                  style={
                    msg.role === 'user'
                      ? {
                          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
                        }
                      : {
                          backgroundColor: 'var(--bg-inset)',
                          color: 'var(--text-primary)',
                        }
                  }
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                {msg.role === 'user' && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                    }}
                  >
                    🧑‍🎓
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fade-in-up">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-primary-500" />
          <span className="text-caption font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
            历史回顾
          </span>
        </div>
        <h1 className="text-h1 mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <MessageSquare size={24} className="text-primary-500" /> 学习记录
        </h1>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          浏览和回顾过往的学习会话。
        </p>
      </div>

      {loading ? (
        <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>加载中...</p>
      ) : sessions.length === 0 ? (
        <div className="card p-8 text-center">
          <MessageSquare size={40} className="mx-auto mb-3" style={{ color: 'var(--border-strong)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>还没有学习记录</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>完成一次学习会话后，记录会出现在这里。</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => {
            const meta = MODE_META[session.mode] || MODE_META.feynman
            return (
              <div
                key={session.id}
                className="card p-4 card-interactive"
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => viewSession(session)}
                    className="flex items-start gap-3 text-left flex-1 min-w-0"
                  >
                    <div className="mt-0.5 text-lg shrink-0">
                      {session.mode === 'feynman' ? '🎓' : session.mode === 'first_principles' ? '🔺' : '💬'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{session.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-caption" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="flex items-center gap-1"><meta.icon size={12} />{meta.label}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(session.duration_seconds || 0)}</span>
                        <span>·</span>
                        <span>{formatDate(session.started_at)}</span>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      onClick={() => handleResume(session)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-all duration-fast"
                      style={{
                        backgroundColor: 'rgba(249, 115, 22, 0.08)',
                        color: '#C2410C',
                      }}
                      title="继续此对话"
                    >
                      <Play size={12} /> 继续
                    </button>
                    <span style={{ color: 'var(--border-subtle)' }} className="text-lg">→</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

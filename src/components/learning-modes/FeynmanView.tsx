import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Clock, StopCircle, Send, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { useSessionStore } from '@/stores/session.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { useReviewStore } from '@/stores/review.store'
import { useChatStore } from '@/stores/chat.store'
import { useEmotionDetection } from '@/hooks/useEmotionDetection'
import { AvatarBubble } from '@/components/learning-modes/shared/AvatarBubble'
import { TypingIndicator } from '@/components/learning-modes/shared/TypingIndicator'
import { ScoreGauge } from '@/components/learning-modes/shared/ScoreGauge'
import { SessionSummary } from '@/components/learning-modes/shared/SessionSummary'
import type { SessionMode, SessionSummaryData } from '@/types/database'
import { trimContextWindow } from '@/utils/context-window'

export function FeynmanView() {
  const navigate = useNavigate()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamCleanupRef = useRef<Array<() => void>>([])

  const { activeSession, elapsedSeconds, startSession, endSession, loadActiveSession } = useSessionStore()
  const { activeProvider, configs } = useSettingsStore()
  const { subjects, topics, materials, loadSubjects, selectSubject, selectTopic, loadMaterials } = useKnowledgeStore()
  const { generateCardsFromSession } = useReviewStore()
  const chatStore = useChatStore()
  const { mood, reportScore, markInput } = useEmotionDetection({
    onMoodChange: (m) => { if (m === 'frustrated') toast('慢慢来，放轻松一点 😊', { icon: '💪', duration: 3000 }) },
  })

  const sessionId = activeSession?.id || ''
  const messages = chatStore.messagesBySession[sessionId] || []

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null)
  const [showMaterial, setShowMaterial] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [pendingScore, setPendingScore] = useState<number | null>(null)
  const [streamId, setStreamId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  const sessionMode: SessionMode = 'feynman'

  useEffect(() => {
    loadSubjects()
    loadActiveSession()
    return () => {
      const cleanup = streamCleanupRef.current
      if (cleanup) {
        cleanup.forEach(fn => { try { fn() } catch {} })
      }
    }
  }, [])

  useEffect(() => {
    if (!activeSession || activeSession.mode !== sessionMode) return
    if (!activeProvider || !configs[activeProvider]?.apiKey) return

    const initializeChat = async () => {
      await chatStore.loadMessages(activeSession.id)
      const existing = chatStore.getMessages(activeSession.id)
      if (existing.length > 0) return

      setIsInitializing(true)
      const topicName = selectedTopicId
        ? topics.find(t => t.id === selectedTopicId)?.name
        : (activeSession?.title || '新知识')

      const openingPrompt = `你正在扮演一位名叫"小费"的学习伙伴，使用费曼技巧帮助学生学习。现在学习主题是「${topicName}」。

请主动发起一段简短的开场对话（50-100字），内容包括：
1. 热情地打招呼并介绍自己是"小费"
2. 简要说明费曼技巧的工作方式（让学生向你解释概念，你帮忙找盲区）
3. 邀请学生开始解释他们对「${topicName}」目前的理解

风格：友好、鼓励、像一个耐心的学伴。不要用 markdown 格式。`

      try {
        const result = await window.electronAPI!.ai.complete({
          provider: activeProvider,
          messages: [{ role: 'user', content: openingPrompt }],
          options: {
            model: configs[activeProvider]?.model || 'claude-sonnet-4-6',
          },
        })
        if (result?.content) {
          await chatStore.addMessage(activeSession.id, { role: 'assistant', content: result.content })
        }
      } catch {
        await chatStore.addMessage(activeSession.id, {
          role: 'assistant',
          content: `你好！我是小费 🎓，你的费曼学习伙伴。请试着向我解释「${topicName}」这个概念，我会帮你发现理解中的盲区和不够清晰的地方。准备好了就开始吧！`,
        })
      } finally {
        setIsInitializing(false)
      }
    }

    initializeChat()
  }, [activeSession, activeProvider, configs])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const getCurrentMaterial = () => {
    if (!selectedTopicId || materials.length === 0) return null
    return materials[0]
  }

  const handleStartSession = async () => {
    const topic = selectedTopicId ? topics.find(t => t.id === selectedTopicId) : null
    const title = topic?.name || '自由学习'
    await startSession(title, sessionMode, selectedSubjectId || undefined, selectedTopicId || undefined)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !window.electronAPI) return

    if (!activeProvider) {
      toast.error('请先在设置中配置 AI 服务商的 API Key')
      return
    }

    if (!configs[activeProvider]?.apiKey) {
      toast.error('API Key 未保存，请前往设置页点击"保存"按钮')
      return
    }

    markInput()
    const userMsg = { role: 'user' as const, content: text }
    await chatStore.addMessage(activeSession!.id, userMsg)
    setInput('')
    setIsStreaming(true)

    try {
      const material = getCurrentMaterial()
      const personaCtx = {
        topic: topics.find(t => t.id === selectedTopicId)?.name || activeSession?.title || '通用学习',
        materialExcerpt: material?.content_text?.slice(0, 500),
        difficultyLevel: 3,
        mood: mood,
      }

      const { buildFeynmanPrompt } = await import('@/prompts/feynman-persona')
      const systemPrompt = buildFeynmanPrompt(personaCtx)

      let historyMessages = messages.map(m => ({ role: m.role, content: m.content }))
      if (historyMessages.length > 0 && historyMessages[0].role === 'assistant') {
        historyMessages = historyMessages.slice(1)
      }

      const { messages: trimmedMessages, trimmed } = trimContextWindow([
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: text },
      ])

      // Context window trimming is logged only in dev mode
      if (import.meta.env.DEV && trimmed > 0) {
        console.debug(`[Feynman] Context window: trimmed ${trimmed} older messages`)
      }

      const result = await window.electronAPI.ai.streamChat({
        provider: activeProvider,
        messages: trimmedMessages,
        options: {
          model: configs[activeProvider]?.model || 'claude-sonnet-4-6',
        },
      })

      setStreamId(result.streamId)

      const prevCleanup = streamCleanupRef.current
      if (prevCleanup) {
        prevCleanup.forEach(fn => { try { fn() } catch {} })
      }
      const cleanups: Array<() => void> = []

      let currentContent = ''
      let assistantAdded = false
      cleanups.push(window.electronAPI.ai.onStreamChunk((data) => {
        if (data.streamId === result.streamId) {
          currentContent += data.delta
          if (!assistantAdded) {
            assistantAdded = true
            chatStore.addMessage(activeSession!.id, { role: 'assistant', content: currentContent })
          } else {
            chatStore.updateLastMessage(activeSession!.id, currentContent)
          }
        }
      }))

      cleanups.push(window.electronAPI.ai.onStreamDone((data) => {
        if (data.streamId === result.streamId) {
          setIsStreaming(false)
          cleanups.forEach(fn => { try { fn() } catch {} })
          streamCleanupRef.current = []
          const scoreMatch = currentContent.match(/理解分数[：:]\s*(\d+)/)
          if (scoreMatch) {
            const score = parseInt(scoreMatch[1])
            setPendingScore(score)
            reportScore(score)
          }
        }
      }))

      cleanups.push(window.electronAPI.ai.onStreamError((data) => {
        if (data.streamId === result.streamId) {
          setIsStreaming(false)
          cleanups.forEach(fn => { try { fn() } catch {} })
          streamCleanupRef.current = []
          const errMsg = data.error || 'AI 连接出现问题，请检查网络或 API 设置'
          toast.error(`AI 错误：${errMsg}`)
        }
      }))

      streamCleanupRef.current = cleanups

    } catch (err: any) {
      setIsStreaming(false)
      const errMsg = err?.message || String(err) || '未知错误'
      console.error('[FeynmanView] streamChat error:', errMsg)
      toast.error(`AI 请求失败：${errMsg}`)
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    const recentScores = messages
      .filter(m => m.score != null)
      .map(m => m.score!)
    const lastScore = recentScores.length > 0 ? recentScores[recentScores.length - 1] : null
    const gapsCount = messages.reduce((sum, m) => sum + (m.gaps?.length || 0), 0)
    const jargonCount = messages.reduce((sum, m) => sum + (m.jargon?.length || 0), 0)

    await endSession()

    const initialSummary = {
      durationMinutes: Math.round(elapsedSeconds / 60),
      understandingScore: lastScore,
      gapsCount,
      jargonIssues: jargonCount,
      streakDays: 1,
      cardsGenerated: 0,
    }
    setSessionSummary(initialSummary)
    setSessionEnded(true)

    const sessionContent = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => m.content)
      .join('\n')
    generateCardsFromSession(
      sessionContent,
      selectedTopicId || undefined,
      activeSession.title,
    ).then(cards => {
      if (cards.length > 0) {
        setSessionSummary(prev => prev ? { ...prev, cardsGenerated: cards.length } : null)
        toast.success(`已生成 ${cards.length} 张复习卡片 ✨`)
      }
    }).catch((err: any) => {
      console.error('[FeynmanView] Card generation error:', err)
      toast.error(`复习卡片生成失败：${err?.message || '请检查 AI 服务商配置'}`)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (sessionEnded && sessionSummary) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <SessionSummary
          {...sessionSummary}
          onContinueLearning={() => {
            setSessionEnded(false)
            setSessionSummary(null)
            setPendingScore(null)
          }}
          onViewProgress={() => navigate('/progress')}
        />
      </div>
    )
  }

  if (!activeSession || activeSession.mode !== sessionMode) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-amber-500" />
            <span className="text-caption font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              费曼技巧
            </span>
          </div>
          <h1 className="text-h1 mb-2" style={{ color: 'var(--text-primary)' }}>
            用简单的话解释复杂概念
          </h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            通过向AI"学生"解释概念来检验你的理解深度。解释得越简单清晰，说明理解越透彻。
          </p>
        </div>

        {!activeProvider && (
          <div
            className="card p-4"
            style={{
              borderLeft: '3px solid #F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.04)',
            }}
          >
            <p className="text-body-sm text-amber-700 dark:text-amber-300">
              ⚠️ 未配置 AI 服务商，请先前往{' '}
              <button onClick={() => navigate('/settings')} className="underline font-medium">
                设置页面
              </button>{' '}
              添加 API Key。
            </p>
          </div>
        )}

        <div className="card p-5 space-y-4">
          <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            选择学习科目（可选）
          </label>
          <select
            value={selectedSubjectId || ''}
            onChange={(e) => {
              const id = e.target.value || null
              setSelectedSubjectId(id)
              if (id) selectSubject(id)
              setSelectedTopicId(null)
            }}
            className="input-field"
          >
            <option value="">跳过选择，自由学习</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>

          {selectedSubjectId && topics.length > 0 && (
            <select
              value={selectedTopicId || ''}
              onChange={(e) => {
                const id = e.target.value || null
                setSelectedTopicId(id)
                if (id) selectTopic(id)
              }}
              className="input-field"
            >
              <option value="">选择具体主题</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        {selectedTopicId && materials.length > 0 && (
          <div className="card p-4">
            <button
              onClick={() => setShowMaterial(!showMaterial)}
              className="flex items-center gap-1 text-sm transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {showMaterial ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              预览学习材料：{materials[0].title}
            </button>
            {showMaterial && (
              <div
                className="mt-3 p-3 rounded-md text-sm max-h-48 overflow-y-auto"
                style={{
                  backgroundColor: 'var(--bg-inset)',
                  color: 'var(--text-secondary)',
                }}
              >
                {materials[0].content_text.slice(0, 500)}
                {materials[0].content_text.length > 500 && '...'}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleStartSession}
          className="w-full py-3.5 px-4 btn-primary text-lg font-semibold"
        >
          开始学习
        </button>

        <div className="card p-5 space-y-3">
          <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            如何更好地使用费曼学习法：
          </h3>
          <ol className="space-y-2 list-decimal list-inside text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>选择一个你想掌握的概念，用最简单的语言向"小费"解释它</li>
            <li>假装你在教一个完全不懂的人——避免使用专业术语和复杂词汇</li>
            <li>AI 会指出你解释中的模糊点和知识盲区</li>
            <li>回到学习材料中补充理解，然后重新组织语言再解释一遍</li>
            <li>反复迭代，直到你能用大白话讲清楚——这时你才是真正理解了</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div
        className="flex items-center justify-between py-3 px-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <AvatarBubble persona="feynman" size="sm" />
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {activeSession.title}
            </h2>
            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              费曼技巧 · 小费陪伴中
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <Clock size={14} /> {formatTime(elapsedSeconds)}
          </span>
          <button
            onClick={handleEndSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-fast btn-danger"
          >
            <StopCircle size={14} /> 结束
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && <AvatarBubble persona="feynman" size="sm" />}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-br-md text-white'
                  : 'rounded-bl-md'
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
              {msg.content || (isStreaming && '...')}
              {msg.score != null && (
                <div className="mt-2 flex items-center gap-2">
                  <ScoreGauge score={msg.score} size={60} strokeWidth={6} />
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                }}
              >
                🧑‍🎓
              </div>
            )}
          </div>
        ))}
        {(isStreaming || isInitializing) && messages.length === 0 && (
          <div className="flex gap-3">
            <AvatarBubble persona="feynman" size="sm" />
            <TypingIndicator personaName="小费" />
          </div>
        )}
        {isStreaming && messages.length > 0 && (
          <div className="flex gap-3">
            <AvatarBubble persona="feynman" size="sm" />
            <TypingIndicator personaName="小费" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div
        className="p-4 shrink-0"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="向小费解释你的理解..."
            rows={2}
            disabled={isStreaming || isInitializing}
            className="input-field flex-1 resize-none rounded-xl px-4 py-3"
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || isInitializing || !input.trim()}
            className="p-3 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-normal"
            style={{
              background: input.trim()
                ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                : 'var(--bg-inset)',
              boxShadow: input.trim() ? '0 4px 12px rgba(249, 115, 22, 0.25)' : 'none',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

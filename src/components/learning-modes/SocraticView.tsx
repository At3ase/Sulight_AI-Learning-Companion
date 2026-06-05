import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Clock, StopCircle, Send, ChevronDown, ChevronRight, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { useSessionStore } from '@/stores/session.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { useReviewStore } from '@/stores/review.store'
import { useChatStore } from '@/stores/chat.store'
import { useEmotionDetection } from '@/hooks/useEmotionDetection'
import { AvatarBubble } from '@/components/learning-modes/shared/AvatarBubble'
import { TypingIndicator } from '@/components/learning-modes/shared/TypingIndicator'
import { SessionSummary } from '@/components/learning-modes/shared/SessionSummary'
import type { SessionMode, QuestionType, SessionSummaryData } from '@/types/database'
import { trimContextWindow } from '@/utils/context-window'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  clarification: '澄清',
  assumption: '假设检验',
  evidence: '证据评估',
  implication: '含义探索',
  viewpoint: '视角转换',
  consequence: '结果推演',
  origin: '溯源追问',
}

const QUESTION_TYPE_COLORS: Record<QuestionType, { bg: string; text: string; darkBg: string; darkText: string }> = {
  clarification: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563EB', darkBg: 'rgba(59, 130, 246, 0.2)', darkText: '#60A5FA' },
  assumption: { bg: 'rgba(139, 92, 246, 0.1)', text: '#7C3AED', darkBg: 'rgba(139, 92, 246, 0.2)', darkText: '#A78BFA' },
  evidence: { bg: 'rgba(245, 158, 11, 0.1)', text: '#B45309', darkBg: 'rgba(245, 158, 11, 0.2)', darkText: '#FBBF24' },
  implication: { bg: 'rgba(20, 184, 166, 0.1)', text: '#0F766E', darkBg: 'rgba(20, 184, 166, 0.2)', darkText: '#6DD5C5' },
  viewpoint: { bg: 'rgba(236, 72, 153, 0.1)', text: '#BE185D', darkBg: 'rgba(236, 72, 153, 0.2)', darkText: '#F472B6' },
  consequence: { bg: 'rgba(249, 115, 22, 0.1)', text: '#C2410C', darkBg: 'rgba(249, 115, 22, 0.2)', darkText: '#E8A882' },
  origin: { bg: 'rgba(99, 102, 241, 0.1)', text: '#4F46E5', darkBg: 'rgba(99, 102, 241, 0.2)', darkText: '#818CF8' },
}

export function SocraticView() {
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
    onMoodChange: (m) => {
      if (m === 'frustrated')
        toast('深呼吸，没有标准答案，跟随你的思考就好 🧘', { icon: '💭', duration: 3000 })
    },
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
  const [streamId, setStreamId] = useState<string | null>(null)
  const [turnNumber, setTurnNumber] = useState(0)
  const [questionTypeCounts, setQuestionTypeCounts] = useState<Record<string, number>>({})
  const [isInitializing, setIsInitializing] = useState(false)

  const sessionMode: SessionMode = 'socratic'

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

      await chatStore.addMessage(activeSession.id, {
        role: 'assistant',
        content: `你好！我是苏格 ❓，你的苏格拉底式对话伙伴。\n\n我不会直接给你答案——我的方式是像苏格拉底那样，通过一连串精心设计的问题，引导你自己发现答案。你可能会觉得我的问题有点"刁钻"，但每一个问题都是为了让你想得更深。\n\n那么，关于「${topicName}」，你目前的理解是什么？或者你有哪些疑惑想和我探讨？`,
      })
      setIsInitializing(false)
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
    const title = topic?.name || '自由思辨'
    await startSession(title, sessionMode, selectedSubjectId || undefined, selectedTopicId || undefined)
  }

  const detectQuestionType = (content: string): QuestionType => {
    const lower = content.toLowerCase()
    if (lower.includes('定义') || lower.includes('具体') || lower.includes('是什么')) return 'clarification'
    if (lower.includes('假设') || lower.includes('前提') || lower.includes('如果')) return 'assumption'
    if (lower.includes('证据') || lower.includes('证明') || lower.includes('怎么知道')) return 'evidence'
    if (lower.includes('后果') || lower.includes('导致') || lower.includes('影响')) return 'consequence'
    if (lower.includes('角度') || lower.includes('视角') || lower.includes('换一种')) return 'viewpoint'
    if (lower.includes('含义') || lower.includes('意味') || lower.includes('启示')) return 'implication'
    if (lower.includes('起源') || lower.includes('来源') || lower.includes('从何')) return 'origin'
    return 'clarification'
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
        topic: topics.find(t => t.id === selectedTopicId)?.name || activeSession?.title || '哲学思辨',
        materialExcerpt: material?.content_text?.slice(0, 500),
        difficultyLevel: 3,
        mood: mood,
      }

      const { buildSocraticPrompt } = await import('@/prompts/socratic-persona')
      const systemPrompt = buildSocraticPrompt(personaCtx)

      let historyMessages = messages.map(m => ({ role: m.role, content: m.content }))
      if (historyMessages.length > 0 && historyMessages[0].role === 'assistant') {
        historyMessages = historyMessages.slice(1)
      }

      const { messages: trimmedMessages, trimmed } = trimContextWindow([
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: text },
      ])

      if (trimmed > 0) {
        console.log(`[Socratic] Context window: trimmed ${trimmed} older messages`)
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
      let detectedQType: QuestionType = 'clarification'
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

      cleanups.push(window.electronAPI.ai.onStreamDone(async (data) => {
        if (data.streamId === result.streamId) {
          setIsStreaming(false)
          cleanups.forEach(fn => { try { fn() } catch {} })
          streamCleanupRef.current = []
          detectedQType = detectQuestionType(currentContent)

          const msgs = chatStore.getMessages(activeSession!.id)
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg?.role === 'assistant') {
            lastMsg.questionType = detectedQType
          }

          setTurnNumber(prev => prev + 1)
          setQuestionTypeCounts(prev => ({
            ...prev,
            [detectedQType]: (prev[detectedQType] || 0) + 1,
          }))

          reportScore(Math.min(turnNumber * 5 + 20, 100))

          try {
            await window.electronAPI!.db.socratic.create({
              session_id: activeSession!.id,
              turn_number: turnNumber + 1,
              ai_question: currentContent.slice(0, 1000),
              student_answer: text,
              question_type: detectedQType,
            })
          } catch { /* non-blocking */ }
        }
      }))

      cleanups.push(window.electronAPI.ai.onStreamError((data) => {
        if (data.streamId === result.streamId) {
          setIsStreaming(false)
          cleanups.forEach(fn => { try { fn() } catch {} })
          streamCleanupRef.current = []
          const errMsg = data.error || 'AI 连接出现问题'
          toast.error(`AI 错误：${errMsg}`)
        }
      }))

      streamCleanupRef.current = cleanups

    } catch (err: any) {
      setIsStreaming(false)
      const errMsg = err?.message || String(err) || '未知错误'
      toast.error(`连接失败：${errMsg}`)
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    await endSession()

    setSessionSummary({
      durationMinutes: Math.round(elapsedSeconds / 60),
      understandingScore: Math.min(turnNumber * 10 + 20, 100),
      gapsCount: turnNumber,
      jargonIssues: Object.keys(questionTypeCounts).length,
      streakDays: 1,
      cardsGenerated: 0,
    })

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
      console.error('[SocraticView] Card generation error:', err)
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
            setTurnNumber(0)
            setQuestionTypeCounts({})
          }}
          onViewProgress={() => navigate('/progress')}
        />
        {Object.keys(questionTypeCounts).length > 0 && (
          <div className="mt-4 card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              提问类型分布
            </h3>
            <div className="space-y-2">
              {Object.entries(questionTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const colors = QUESTION_TYPE_COLORS[type as QuestionType]
                  return (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: colors?.bg || 'var(--bg-inset)',
                          color: colors?.text || 'var(--text-secondary)',
                        }}
                      >
                        {QUESTION_TYPE_LABELS[type as QuestionType] || type}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>{count} 轮</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!activeSession || activeSession.mode !== sessionMode) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-emerald-500" />
            <span className="text-caption font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              苏格拉底式对话
            </span>
          </div>
          <h1 className="text-h1 mb-2" style={{ color: 'var(--text-primary)' }}>
            通过提问发现深层洞见
          </h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            通过 AI 引导的深度提问，挑战你的假设、检验你的证据、切换不同视角，发现更深层次的洞见。
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
            <option value="">跳过选择，自由思辨</option>
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
          开始对话
        </button>

        <div className="card p-5 space-y-3">
          <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            苏格拉底式对话如何进行：
          </h3>
          <ol className="space-y-2 list-decimal list-inside text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>提出你想探讨的问题或观点</li>
            <li>AI 不会直接给出答案，而是通过提问引导你思考</li>
            <li>每个回答都会引出更深层次的问题</li>
            <li>问题类型会变换：澄清、假设检验、证据评估、视角转换等</li>
            <li>目标是帮助你建立自己的批判性思维框架</li>
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
          <AvatarBubble persona="socratic" size="sm" />
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {activeSession.title}
            </h2>
            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              苏格拉底式对话 · 第 {turnNumber} 轮
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
        {messages.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
            <MessageCircleQuestion size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">开始一段苏格拉底式对话。提出你的观点，让 AI 通过提问引导你的思考。</p>
            <p className="text-xs mt-1">例如：我认为知识就是力量？什么是公平？</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && <AvatarBubble persona="socratic" size="sm" />}
            <div className="max-w-[80%]">
              {msg.role === 'assistant' && msg.questionType && (
                <span
                  className="inline-block text-xs px-2 py-0.5 rounded-full mb-1 font-medium"
                  style={{
                    backgroundColor: QUESTION_TYPE_COLORS[msg.questionType as QuestionType]?.bg || 'var(--bg-inset)',
                    color: QUESTION_TYPE_COLORS[msg.questionType as QuestionType]?.text || 'var(--text-secondary)',
                  }}
                >
                  {QUESTION_TYPE_LABELS[msg.questionType as QuestionType] || msg.questionType}
                </span>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'rounded-br-md text-white' : 'rounded-bl-md'
                }`}
                style={
                  msg.role === 'user'
                    ? {
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                      }
                    : {
                        backgroundColor: 'var(--bg-inset)',
                        color: 'var(--text-primary)',
                      }
                }
              >
                <div className="whitespace-pre-wrap">{msg.content || (isStreaming && '...')}</div>
              </div>
            </div>
            {msg.role === 'user' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                }}
              >
                🧑‍🎓
              </div>
            )}
          </div>
        ))}
        {(isStreaming || isInitializing) && messages.length === 0 && (
          <div className="flex gap-3">
            <AvatarBubble persona="socratic" size="sm" />
            <TypingIndicator personaName="苏格" />
          </div>
        )}
        {isStreaming && messages.length > 0 && (
          <div className="flex gap-3">
            <AvatarBubble persona="socratic" size="sm" />
            <TypingIndicator personaName="苏格" />
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
            placeholder="回答苏格的问题..."
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
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'var(--bg-inset)',
              boxShadow: input.trim() ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

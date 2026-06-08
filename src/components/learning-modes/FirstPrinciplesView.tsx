import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Clock, StopCircle, Send, ChevronDown, ChevronRight, TreePine, Sparkles } from 'lucide-react'
import { useSessionStore } from '@/stores/session.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { useReviewStore } from '@/stores/review.store'
import { useChatStore } from '@/stores/chat.store'
import { useEmotionDetection } from '@/hooks/useEmotionDetection'
import { AvatarBubble } from '@/components/learning-modes/shared/AvatarBubble'
import { TypingIndicator } from '@/components/learning-modes/shared/TypingIndicator'
import { SessionSummary } from '@/components/learning-modes/shared/SessionSummary'
import type { SessionMode, SessionSummaryData } from '@/types/database'
import { trimContextWindow } from '@/utils/context-window'

interface DecompNode {
  id: string
  concept: string
  isLeaf: boolean
  children: DecompNode[]
}

export function FirstPrinciplesView() {
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
    onMoodChange: (m) => { if (m === 'frustrated') toast('慢慢来，拆解需要耐心 🌳', { icon: '💡', duration: 3000 }) },
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
  const [decompTree, setDecompTree] = useState<DecompNode[]>([])
  const [streamId, setStreamId] = useState<string | null>(null)
  const [leafCount, setLeafCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false)

  const sessionMode: SessionMode = 'first_principles'

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
        content: `你好！我是原理 🔺，你的第一性原理思维导师。\n\n我的方法很简单：对任何概念不断追问"为什么"，一层层往下拆解，直到找到不可再分解的基本真理。就像把一座大厦拆成一块块基石——当你站在基石上时，任何复杂问题都会变得清晰。\n\n请告诉我你想深入拆解的「${topicName}」相关概念或问题，我们开始追根溯源！`,
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
    const title = topic?.name || '自由探索'
    await startSession(title, sessionMode, selectedSubjectId || undefined, selectedTopicId || undefined)
  }

  const extractTreeFromAI = (content: string): DecompNode[] => {
    const lines = content.split('\n')
    const nodes: DecompNode[] = []
    const stack: { depth: number; node: DecompNode }[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      const depthMatch = line.match(/^(\s*)/)
      const indent = depthMatch ? depthMatch[1].length : 0
      const depth = Math.floor(indent / 2)

      let concept = trimmed
        .replace(/^[-•*→▸]\s*/, '')
        .replace(/^(子组件|子原则|基本真理|分解)[：:]\s*/i, '')
        .replace(/^[\d]+[\.\)]\s*/, '')
      if (concept.length > 60) concept = concept.slice(0, 60) + '...'

      const newNode: DecompNode = {
        id: `fp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        concept,
        isLeaf: trimmed.includes('基本真理') || trimmed.includes('不可再拆') || trimmed.includes('✓'),
        children: [],
      }

      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop()
      }

      if (stack.length === 0) {
        nodes.push(newNode)
      } else {
        stack[stack.length - 1].node.children.push(newNode)
      }

      stack.push({ depth, node: newNode })
    }

    return nodes
  }

  const countLeafNodes = (nodes: DecompNode[]): number => {
    let count = 0
    for (const n of nodes) {
      if (n.isLeaf || n.children.length === 0) count++
      else count += countLeafNodes(n.children)
    }
    return count
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
        topic: topics.find(t => t.id === selectedTopicId)?.name || activeSession?.title || '通用概念',
        materialExcerpt: material?.content_text?.slice(0, 500),
        difficultyLevel: 3,
        mood: mood,
      }

      const { buildFirstPrinciplesPrompt } = await import('@/prompts/first-principles-persona')
      const systemPrompt = buildFirstPrinciplesPrompt(personaCtx)

      let historyMessages = messages.map(m => ({ role: m.role, content: m.content }))
      if (historyMessages.length > 0 && historyMessages[0].role === 'assistant') {
        historyMessages = historyMessages.slice(1)
      }

      const { messages: trimmedMessages, trimmed } = trimContextWindow([
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: text },
      ])

      if (import.meta.env.DEV && trimmed > 0) {
        console.debug(`[FirstPrinciples] Context window: trimmed ${trimmed} older messages`)
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

      cleanups.push(window.electronAPI.ai.onStreamDone(async (data) => {
        if (data.streamId === result.streamId) {
          setIsStreaming(false)
          cleanups.forEach(fn => { try { fn() } catch {} })
          streamCleanupRef.current = []

          const tree = extractTreeFromAI(currentContent)
          if (tree.length > 0) {
            setDecompTree(prev => {
              const merged = [...prev]
              for (const node of tree) {
                const existingIndex = merged.findIndex(n => n.concept === node.concept)
                if (existingIndex >= 0) {
                  merged[existingIndex] = { ...merged[existingIndex], ...node, children: node.children.length > 0 ? node.children : merged[existingIndex].children }
                } else {
                  merged.push(node)
                }
              }
              return merged
            })
            const leaves = countLeafNodes(tree)
            setLeafCount(prev => prev + leaves)
            reportScore(Math.min(leaves * 20, 100))
          }

          try {
            await window.electronAPI!.db.firstPrinciples.create({
              session_id: activeSession!.id,
              step_order: messages.length,
              concept_name: text,
              ai_guidance: currentContent.slice(0, 500),
              student_response: text,
              is_leaf: currentContent.includes('基本真理') ? 1 : 0,
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
      understandingScore: Math.min(leafCount * 10, 100),
      gapsCount: 0,
      jargonIssues: 0,
      streakDays: 1,
      cardsGenerated: 0,
      fundamentalTruths: leafCount,
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
      console.error('[FirstPrinciplesView] Card generation error:', err)
      toast.error(`复习卡片生成失败：${err?.message || '请检查 AI 服务商配置'}`)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const TreeNode: React.FC<{ node: DecompNode; depth: number }> = ({ node, depth }) => {
    const [expanded, setExpanded] = useState(true)
    const hasChildren = node.children.length > 0

    return (
      <div className="ml-4">
        <div
          className="flex items-center gap-1.5 py-1 px-2 rounded-md"
          style={{
            backgroundColor: node.isLeaf ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
          }}
        >
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{
              backgroundColor: node.isLeaf ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-inset)',
              color: node.isLeaf ? '#059669' : 'var(--text-secondary)',
            }}
          >
            {node.isLeaf ? '基础真理' : '子组件'}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{node.concept}</span>
        </div>
        {hasChildren && expanded && (
          <div className="border-l-2 ml-2" style={{ borderColor: 'var(--border-subtle)' }}>
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (sessionEnded && sessionSummary) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <SessionSummary
          {...sessionSummary}
          onContinueLearning={() => {
            setSessionEnded(false)
            setSessionSummary(null)
            setDecompTree([])
            setLeafCount(0)
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
            <Sparkles size={20} className="text-teal-500" />
            <span className="text-caption font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              第一性原理
            </span>
          </div>
          <h1 className="text-h1 mb-2" style={{ color: 'var(--text-primary)' }}>
            追根溯源，拆解到基本真理
          </h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            将复杂概念拆解到最基本、不可再分的真理，然后从这些基础真理重建完整的理解体系。
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
          开始拆解
        </button>

        <div className="card p-5 space-y-3">
          <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            如何使用第一性原理：
          </h3>
          <ol className="space-y-2 list-decimal list-inside text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>提出你想拆解的概念（例如："什么是重力？"）</li>
            <li>AI 引导你将概念分解为子组件和基本真理</li>
            <li>识别哪些是"基本真理"——不可再分的事实</li>
            <li>从基本真理开始，逐层重建你的理解</li>
            <li>右侧会显示你的拆解树状图</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full max-w-full">
      {/* Chat panel */}
      <div className="flex flex-col flex-1 min-w-0" style={{ borderRight: '1px solid var(--border-subtle)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between py-3 px-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <AvatarBubble persona="first_principles" size="sm" />
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {activeSession.title}
              </h2>
              <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                第一性原理 · 已发现 {leafCount} 个基本真理
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
              <TreePine size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">输入你想要拆解的概念，AI 将引导你找到基本真理。</p>
              <p className="text-xs mt-1">例如：什么是熵？为什么物体会下落？</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <AvatarBubble persona="first_principles" size="sm" />}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'rounded-br-md text-white' : 'rounded-bl-md'
                }`}
                style={
                  msg.role === 'user'
                    ? {
                        background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                        boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)',
                      }
                    : {
                        backgroundColor: 'var(--bg-inset)',
                        color: 'var(--text-primary)',
                      }
                }
              >
                <div className="whitespace-pre-wrap">{msg.content || (isStreaming && '...')}</div>
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
              <AvatarBubble persona="first_principles" size="sm" />
              <TypingIndicator personaName="原理" />
            </div>
          )}
          {isStreaming && messages.length > 0 && (
            <div className="flex gap-3">
              <AvatarBubble persona="first_principles" size="sm" />
              <TypingIndicator personaName="原理" />
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
              placeholder="提出你想拆解的概念..."
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
                  ? 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
                  : 'var(--bg-inset)',
                boxShadow: input.trim() ? '0 4px 12px rgba(20, 184, 166, 0.25)' : 'none',
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Decomposition Tree panel */}
      <div
        className="w-80 shrink-0 hidden lg:flex flex-col"
        style={{
          backgroundColor: 'var(--bg-base)',
        }}
      >
        <div
          className="py-3 px-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TreePine size={16} className="text-teal-500" /> 拆解树
          </h3>
          <p className="text-caption mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            发现 {leafCount} 个基本真理
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {decompTree.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
              <p className="text-xs">拆解树将在对话过程中逐步构建</p>
            </div>
          ) : (
            decompTree.map(node => (
              <TreeNode key={node.id} node={node} depth={0} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

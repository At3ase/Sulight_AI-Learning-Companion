import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { useReviewStore } from '@/stores/review.store'
import { FlashCard } from '@/components/review/FlashCard'
import type { ReviewRating } from '@/types/database'

const RATING_BUTTONS: Array<{ rating: ReviewRating; label: string; shortcut: string; gradient: string; shadow: string }> = [
  { rating: 'again', label: '忘记了', shortcut: '1', gradient: 'from-red-400 to-red-600', shadow: 'shadow-red-200 dark:shadow-red-900/30' },
  { rating: 'hard', label: '困难', shortcut: '2', gradient: 'from-orange-400 to-amber-500', shadow: 'shadow-orange-200 dark:shadow-orange-900/30' },
  { rating: 'good', label: '正常', shortcut: '3', gradient: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-200 dark:shadow-emerald-900/30' },
  { rating: 'easy', label: '简单', shortcut: '4', gradient: 'from-teal-400 to-cyan-500', shadow: 'shadow-teal-200 dark:shadow-teal-900/30' },
]

export function ReviewQueue() {
  const navigate = useNavigate()
  const { dueCards, isLoading, currentCardIndex, isFlipped, loadDueCards, reviewCard, nextCard, flipCard, unflipCard } = useReviewStore()
  const [finished, setFinished] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  useEffect(() => {
    loadDueCards()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finished) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!isFlipped) flipCard()
      }
      if (isFlipped) {
        const btn = RATING_BUTTONS.find(b => b.shortcut === e.key)
        if (btn) handleRate(btn.rating)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFlipped, finished])

  const handleRate = async (rating: ReviewRating) => {
    const card = dueCards[currentCardIndex]
    if (!card) return

    await reviewCard(card.id, rating)
    setReviewedCount(prev => prev + 1)

    const { dueCards: remaining, currentCardIndex: freshIndex } = useReviewStore.getState()
    if (remaining.length === 0 || freshIndex >= remaining.length) {
      setFinished(true)
    }
  }

  const handleFlip = () => {
    if (isFlipped) {
      unflipCard()
    } else {
      flipCard()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: 'var(--text-tertiary)' }}>加载复习卡片...</p>
      </div>
    )
  }

  if (finished || dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
        <span className="text-4xl">🎉</span>
        <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>复习完成！</h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          {reviewedCount > 0
            ? `今天已复习 ${reviewedCount} 张卡片，继续保持！`
            : '当前没有待复习的卡片，你可以在学习会话后生成新的卡片。'}
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary text-sm"
          >
            返回首页
          </button>
          {reviewedCount === 0 && (
            <button
              onClick={() => navigate('/feynman')}
              className="btn-primary text-sm"
            >
              去学习生成卡片
            </button>
          )}
        </div>
      </div>
    )
  }

  const currentCard = dueCards[currentCardIndex]
  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p style={{ color: 'var(--text-tertiary)' }}>没有卡片可显示</p>
        <button onClick={() => navigate('/')} className="btn-primary text-sm">返回首页</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-4 py-6">
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-inset)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${dueCards.length > 0 ? ((currentCardIndex) / dueCards.length) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #F97316 0%, #10B981 100%)',
            }}
          />
        </div>
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{currentCardIndex + 1}/{dueCards.length}</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <FlashCard
          front={currentCard.front}
          back={currentCard.back}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </div>

      {/* Rating buttons (show after flip) */}
      <div className={`mt-6 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <p className="text-center text-caption mb-3" style={{ color: 'var(--text-tertiary)' }}>你的掌握程度如何？</p>
        <div className="grid grid-cols-4 gap-2">
          {RATING_BUTTONS.map(btn => (
            <button
              key={btn.rating}
              onClick={() => handleRate(btn.rating)}
              className={`py-3 rounded-xl text-sm font-medium text-white transition-all duration-fast bg-gradient-to-br ${btn.gradient} ${btn.shadow} shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
            >
              <div className="text-xs opacity-80 mb-0.5">{btn.shortcut}</div>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

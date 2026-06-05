import React from 'react'

interface FlashCardProps {
  front: string
  back: string
  isFlipped: boolean
  onFlip: () => void
}

export const FlashCard: React.FC<FlashCardProps> = ({ front, back, isFlipped, onFlip }) => {
  return (
    <div
      className="w-full max-w-lg mx-auto cursor-pointer perspective-1000"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFlip() }}
      aria-label={isFlipped ? '点击翻转查看问题' : '点击翻转查看答案'}
    >
      <div
        className={`relative w-full min-h-[260px] transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 backface-hidden rounded-xl p-6 flex flex-col items-center justify-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            className="text-overline uppercase tracking-wider mb-4"
            style={{ color: 'var(--text-tertiary)' }}
          >
            问题
          </div>
          <p className="text-lg text-center leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {front}
          </p>
          <div
            className="mt-6 text-sm flex items-center gap-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            点击翻转查看答案 →
          </div>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 backface-hidden rounded-xl p-6 flex flex-col items-center justify-center rotate-y-180"
          style={{
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)',
          }}
        >
          <div
            className="text-overline uppercase tracking-wider mb-4"
            style={{ color: '#C2410C' }}
          >
            答案
          </div>
          <p className="text-lg text-center leading-relaxed" style={{ color: '#7C2D12' }}>
            {back}
          </p>
          <div
            className="mt-6 text-sm flex items-center gap-1.5"
            style={{ color: '#C2410C' }}
          >
            ← 点击翻转回到问题
          </div>
        </div>
      </div>
    </div>
  )
}

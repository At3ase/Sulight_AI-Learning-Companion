import React from 'react'

interface TypingIndicatorProps {
  personaName: string
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ personaName }) => {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
      style={{
        backgroundColor: 'var(--bg-inset)',
        color: 'var(--text-tertiary)',
      }}
    >
      <div className="flex gap-1">
        <span
          className="w-2 h-2 rounded-full animate-typing-bounce"
          style={{
            backgroundColor: 'var(--text-tertiary)',
            animationDelay: '0ms',
          }}
        />
        <span
          className="w-2 h-2 rounded-full animate-typing-bounce"
          style={{
            backgroundColor: 'var(--text-tertiary)',
            animationDelay: '160ms',
          }}
        />
        <span
          className="w-2 h-2 rounded-full animate-typing-bounce"
          style={{
            backgroundColor: 'var(--text-tertiary)',
            animationDelay: '320ms',
          }}
        />
      </div>
      <span className="text-caption">{personaName}正在思考...</span>
    </div>
  )
}

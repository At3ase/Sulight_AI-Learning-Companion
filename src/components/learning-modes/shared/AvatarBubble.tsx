import React from 'react'

export type PersonaType = 'feynman' | 'socratic' | 'first_principles'

interface AvatarBubbleProps {
  persona: PersonaType
  size?: 'sm' | 'md' | 'lg'
}

const personaConfig: Record<PersonaType, { icon: string; label: string; gradient: string; shadow: string }> = {
  feynman: {
    icon: '🎓',
    label: '小费',
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-200 dark:shadow-amber-900/50',
  },
  socratic: {
    icon: '💬',
    label: '苏格',
    gradient: 'from-teal-400 to-cyan-500',
    shadow: 'shadow-teal-200 dark:shadow-teal-900/50',
  },
  first_principles: {
    icon: '🔺',
    label: '原理',
    gradient: 'from-emerald-400 to-green-500',
    shadow: 'shadow-emerald-200 dark:shadow-emerald-900/50',
  },
}

const sizeClasses: Record<string, string> = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}

export const AvatarBubble: React.FC<AvatarBubbleProps> = ({ persona, size = 'md' }) => {
  const config = personaConfig[persona]
  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${config.gradient} ${config.shadow} rounded-full flex items-center justify-center shrink-0 shadow-md`}
      title={config.label}
      aria-label={config.label}
    >
      <span className="leading-none">{config.icon}</span>
    </div>
  )
}

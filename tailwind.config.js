/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── 主色：珊瑚琥珀 ──
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
        // ── 辅色：青绿薄荷 ──
        secondary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        // ── 强调色：暖金 ──
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        // ── 背景色 ──
        bg: {
          base: '#FAFAF8',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          inset: '#F5F5F0',
        },
        // ── 深色背景色（通过 dark: 前缀使用） ──
        // 在代码中使用 dark:bg-surface 等
        // ── 文字色 ──
        text: {
          primary: '#1C1917',
          secondary: '#57534E',
          tertiary: '#A8A29E',
          inverse: '#FFFFFF',
        },
        // ── 边框色 ──
        border: {
          subtle: '#E8E8E0',
          DEFAULT: '#D4D4CC',
          strong: '#B8B8B0',
        },
        // ── 功能色 ──
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#34D399',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#FBBF24',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#F87171',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#60A5FA',
        },
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Noto Sans SC"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"SF Pro Mono"',
          '"Fira Code"',
          '"JetBrains Mono"',
          'monospace',
        ],
      },
      fontSize: {
        'display': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h2': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['16px', { lineHeight: '24px', letterSpacing: '0', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '22px', letterSpacing: '0.01em', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
        'overline': ['11px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      spacing: {
        '18': '72px',
        '22': '88px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.04)',
        'md': '0 4px 12px rgba(0,0,0,0.06)',
        'lg': '0 8px 24px rgba(0,0,0,0.08)',
        'xl': '0 16px 48px rgba(0,0,0,0.10)',
        'glow': '0 0 20px rgba(249,115,22,0.15)',
        'glow-strong': '0 0 30px rgba(249,115,22,0.25)',
        'dark-sm': '0 1px 2px rgba(0,0,0,0.20)',
        'dark-md': '0 4px 12px rgba(0,0,0,0.30)',
        'dark-lg': '0 8px 24px rgba(0,0,0,0.40)',
        'dark-xl': '0 16px 48px rgba(0,0,0,0.50)',
        'dark-glow': '0 0 20px rgba(249,115,22,0.25)',
      },
      transitionTimingFunction: {
        'ease-default': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-in-custom': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-out-custom': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        'instant': '100ms',
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'page': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out forwards',
        'fade-in-up': 'fadeInUp 300ms ease-out forwards',
        'scale-in': 'scaleIn 200ms ease-out forwards',
        'slide-in-right': 'slideInRight 300ms ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'typing-bounce': 'typingBounce 1.4s infinite ease-in-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typingBounce: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // 自定义插件：添加深色模式的背景色和文字色工具类
    function({ addBase, theme }) {
      addBase({
        ':root': {
          '--bg-base': '#FAFAF8',
          '--bg-surface': '#FFFFFF',
          '--bg-elevated': '#FFFFFF',
          '--bg-inset': '#F5F5F0',
          '--text-primary': '#1C1917',
          '--text-secondary': '#57534E',
          '--text-tertiary': '#A8A29E',
          '--border-subtle': '#E8E8E0',
          '--border-default': '#D4D4CC',
          '--border-strong': '#B8B8B0',
        },
        '.dark': {
          '--bg-base': '#0F172A',
          '--bg-surface': '#1E293B',
          '--bg-elevated': '#27354F',
          '--bg-inset': '#131C2E',
          '--text-primary': '#F5F5F4',
          '--text-secondary': '#D6D3D1',
          '--text-tertiary': '#78716C',
          '--border-subtle': '#334155',
          '--border-default': '#475569',
          '--border-strong': '#64748B',
        },
      })
    },
  ],
}

import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardView } from './components/dashboard/DashboardView'
import { SettingsView } from './components/settings/SettingsView'
import { FeynmanView } from './components/learning-modes/FeynmanView'
import { FirstPrinciplesView } from './components/learning-modes/FirstPrinciplesView'
import { SocraticView } from './components/learning-modes/SocraticView'
import { KnowledgeBaseView } from './components/knowledge/KnowledgeBaseView'
import { ReviewQueue } from './components/review/ReviewQueue'
import { ProgressView } from './components/progress/ProgressView'
import { CourseListView } from './components/courses/CourseListView'
import { SessionHistoryView } from './components/progress/SessionHistoryView'
import { FocusModeView } from './components/focus/FocusModeView'
import { OnboardingWizard } from './components/onboarding/OnboardingWizard'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { useUIStore } from './stores/ui.store'
import { useSettingsStore } from './stores/settings.store'
import { useSessionStore } from './stores/session.store'

// ── Global keyboard shortcuts ─────────────────────────────────
function KeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) return

      const isCtrlOrCmd = e.ctrlKey || e.metaKey

      // Ctrl+Shift+F → Focus mode
      if (isCtrlOrCmd && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        navigate('/focus')
      }

      // Ctrl+, → Settings
      if (isCtrlOrCmd && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      }

      // Ctrl+1-3 → Learning modes
      if (isCtrlOrCmd && e.key === '1') {
        e.preventDefault()
        navigate('/feynman')
      }
      if (isCtrlOrCmd && e.key === '2') {
        e.preventDefault()
        navigate('/first-principles')
      }
      if (isCtrlOrCmd && e.key === '3') {
        e.preventDefault()
        navigate('/socratic')
      }

      // Ctrl+R → Review queue
      if (isCtrlOrCmd && e.key === 'r' && !e.shiftKey) {
        e.preventDefault()
        navigate('/review')
      }

      // Ctrl+D → Dashboard
      if (isCtrlOrCmd && e.key === 'd' && !e.shiftKey) {
        e.preventDefault()
        navigate('/')
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return null
}

// ── Onboarding redirect on first launch ─────────────────────
function OnboardingGuard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Don't redirect if already on onboarding page
    if (location.pathname === '/onboarding') {
      setChecked(true)
      return
    }

    // Check if onboarding has been completed
    const completed = localStorage.getItem('onboarding_completed')
    if (!completed && window.electronAPI) {
      window.electronAPI.settings.get('onboarding_completed').then((val: string | null) => {
        if (!val || val === '0') {
          navigate('/onboarding')
        }
        setChecked(true)
      }).catch(() => {
        // Settings not available yet, just check localStorage
        setChecked(true)
      })
    } else {
      setChecked(true)
    }
  }, [navigate, location.pathname])

  return null
}

export default function App() {
  const { theme, setTheme } = useUIStore()
  const { loadSettings } = useSettingsStore()
  const { loadActiveSession, loadAutoGeneratePref } = useSessionStore()

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (saved) setTheme(saved)

    loadSettings()
    loadActiveSession()
    loadAutoGeneratePref()
  }, [])

  return (
    <HashRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            fontSize: '14px',
            fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'var(--bg-surface)',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'var(--bg-surface)',
            },
          },
        }}
      />
      <KeyboardShortcuts />
      <OnboardingGuard />
      <ErrorBoundary>
        <Routes>
          {/* Full-screen routes (no AppLayout) */}
          <Route path="/focus" element={<FocusModeView />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />

          {/* Normal routes with AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/feynman" element={<FeynmanView />} />
            <Route path="/first-principles" element={<FirstPrinciplesView />} />
            <Route path="/socratic" element={<SocraticView />} />
            <Route path="/knowledge" element={<KnowledgeBaseView />} />
            <Route path="/review" element={<ReviewQueue />} />
            <Route path="/progress" element={<ProgressView />} />
            <Route path="/courses" element={<CourseListView />} />
            <Route path="/history" element={<SessionHistoryView />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  )
}

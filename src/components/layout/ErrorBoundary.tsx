import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.hash = '#/'
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>
              页面出现错误
            </h1>
            <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
              应用遇到了意外错误，请尝试刷新页面。
            </p>
            <details className="text-left mb-4">
              <summary
                className="text-caption cursor-pointer transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                查看错误详情
              </summary>
              <pre
                className="mt-2 p-3 rounded-lg text-xs overflow-auto max-h-32 text-left whitespace-pre-wrap"
                style={{
                  backgroundColor: 'var(--bg-inset)',
                  color: '#EF4444',
                }}
              >
                {this.state.error?.message}
                {'\n\n'}
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={this.handleReset}
              className="btn-primary"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

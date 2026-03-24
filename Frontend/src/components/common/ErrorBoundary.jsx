import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error Boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#94a3b8',
          background: '#0f172a',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <h2 style={{ color: '#f1f5f9', margin: 0 }}>Boardroom Experienced an Issue</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
            Live agent connection failed. This is usually the Python API service.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="exec-btn" 
              style={{ padding: '12px 24px' }}
              onClick={() => window.location.reload()}
            >
              🔄 Restart Boardroom
            </button>
            <button 
              className="control-btn"
              style={{ padding: '12px 24px' }}
              onClick={() => {
                if (window.confirm('Open Backend logs?')) {
                  window.open('http://localhost:5000/api/health', '_blank')
                }
              }}
            >
              🛠 Check Services
            </button>
          </div>
          <details style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
            <summary style={{ cursor: 'pointer', color: '#60a5fa' }}>Technical Details</summary>
            <pre style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', fontSize: '12px', overflow: 'auto' }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

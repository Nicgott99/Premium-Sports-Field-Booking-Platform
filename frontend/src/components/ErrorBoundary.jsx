import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#051424',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: '500px',
            background: 'rgba(13,28,45,0.72)',
            border: '1px solid rgba(255,94,7,0.3)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(14px)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>⚠️</span>
            <h1 style={{ color: '#f0f6ff', marginBottom: '0.5rem', fontFamily: "'Anybody', sans-serif", fontWeight: 800 }}>
              Oops! Something went wrong
            </h1>
            <p style={{ color: '#506070', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              We encountered an error while loading this page. Please try refreshing or go back.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ textAlign: 'left', marginBottom: '1.5rem', color: '#8ba3be', fontSize: '0.85rem' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Error details</summary>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              style={{
                background: '#FBBF24',
                color: '#111111',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Anybody', sans-serif",
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-content" style={{
                    padding: '2rem',
                    background: 'rgba(255, 59, 48, 0.1)',
                    border: '1px solid rgba(255, 59, 48, 0.2)',
                    borderRadius: '1rem',
                    color: '#ff3b30',
                    textAlign: 'center'
                }}>
                    <h2>Something went wrong.</h2>
                    <p>The neural link encountered an interference.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            background: '#ff3b30',
                            border: 'none',
                            borderRadius: '999px',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Reconnect
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

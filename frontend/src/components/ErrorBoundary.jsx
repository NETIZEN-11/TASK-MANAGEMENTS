import { Component } from 'react';

/**
 * Error Boundary to catch React errors and prevent white screen
 * Addresses general error handling improvements
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    
    // In production, send to error tracking service (e.g., Sentry)
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-xl">
            <div className="mb-4 text-center text-6xl">😵</div>
            <h1 className="mb-2 text-center text-2xl font-bold text-red-900">
              Oops! Something went wrong
            </h1>
            <p className="mb-6 text-center text-sm text-red-700">
              The app encountered an unexpected error. Don't worry, your data is safe.
            </p>
            
            {!import.meta.env.PROD && this.state.error && (
              <details className="mb-6 rounded-lg bg-red-50 p-4 text-xs">
                <summary className="cursor-pointer font-semibold text-red-900">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 overflow-auto text-red-800">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <button
              onClick={this.handleReset}
              className="w-full rounded-xl bg-gradient-to-r from-red-500 to-pink-500 py-3 font-semibold text-white shadow-lg transition-all hover:from-red-600 hover:to-pink-600 hover:shadow-xl"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

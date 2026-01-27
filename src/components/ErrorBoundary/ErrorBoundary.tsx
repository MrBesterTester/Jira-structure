/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * 
 * Displays a friendly error message instead of crashing the whole app.
 * Must be a class component per React's error boundary requirements.
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border border-red-200 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg 
                    className="w-8 h-8 text-red-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-800">
                    Something went wrong
                  </h2>
                  <p className="text-sm text-red-600">
                    An error occurred in this section of the app
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            <div className="px-6 py-4">
              {this.state.error && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Error Message:
                  </h3>
                  <code className="block text-sm bg-gray-100 text-red-700 p-3 rounded overflow-x-auto">
                    {this.state.error.message}
                  </code>
                </div>
              )}

              {this.state.errorInfo && (
                <details className="mb-4">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Stack trace (click to expand)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 text-gray-600 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>

            {/* Help Text */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If this problem persists, try refreshing the page or check the browser console for more details.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

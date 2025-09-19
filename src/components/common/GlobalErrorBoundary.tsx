import React, { Component, ErrorInfo, ReactNode } from 'react';
import { themeClasses, buttonVariants } from '../../utils/lightThemeHelper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // You could also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={`min-h-screen flex items-center justify-center ${themeClasses.background.primary}`}>
          <div className={`max-w-md w-full mx-4 p-8 rounded-xl ${themeClasses.background.elevated} ${themeClasses.border.default} border ${themeClasses.shadow.xl}`}>
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className={`text-2xl font-bold ${themeClasses.text.primary} mb-4`}>
                Something went wrong
              </h1>
              <p className={`${themeClasses.text.secondary} mb-6`}>
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className={`mb-6 p-4 rounded-lg ${themeClasses.background.secondary} text-left`}>
                  <h3 className={`text-sm font-semibold ${themeClasses.text.primary} mb-2`}>
                    Error Details (Development Mode):
                  </h3>
                  <pre className={`text-xs ${themeClasses.text.secondary} overflow-auto max-h-32`}>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={this.handleReload}
                  className={`w-full px-4 py-2 rounded-lg ${buttonVariants.primary} transition-colors`}
                >
                  Reload Page
                </button>
                <button
                  onClick={this.handleReset}
                  className={`w-full px-4 py-2 rounded-lg ${buttonVariants.secondary} transition-colors`}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
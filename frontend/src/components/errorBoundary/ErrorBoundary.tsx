// src/components/ErrorBoundary.tsx
import React, { Component } from 'react';
import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo :  errorInfo.componentStack || '',
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleGoBack = () => {
    window.history.back();
  };

  private handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-[#611DD0] to-[#A084E8] flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-[#611DD0] mb-4">Oops!</h1>
              <img 
                src="/error-illustration.svg" 
                alt="Error" 
                className="mx-auto w-64 h-64 mb-6"
              />
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-6">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              {/* Error Details (Collapsed by default) */}
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-[#611DD0] hover:text-[#A084E8] font-medium">
                  Technical Details
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                  {this.state.errorInfo}
                </pre>
              </details>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleGoBack}
                className="px-6 py-2 bg-white border-2 border-[#611DD0] text-[#611DD0] rounded-full font-semibold hover:bg-[#611DD0] hover:text-white transition-colors duration-300"
              >
                Go Back
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-2 bg-[#611DD0] text-white rounded-full font-semibold hover:bg-[#A084E8] transition-colors duration-300"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
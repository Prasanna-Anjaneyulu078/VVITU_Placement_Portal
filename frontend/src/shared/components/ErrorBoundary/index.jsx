import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary]', error, errorInfo);
  }

  handleReset = () => {
    const errMsg = this.state.error?.message || '';
    if (
      errMsg.includes('dynamically imported module') ||
      errMsg.includes('Loading chunk') ||
      errMsg.includes('Importing a module script failed') ||
      this.state.error?.name === 'ChunkLoadError'
    ) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50/50 border border-red-200 rounded-2xl my-4 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            {this.props.title || 'Section Unavailable'}
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {this.state.error?.message || 'Something went wrong while rendering this component.'}
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

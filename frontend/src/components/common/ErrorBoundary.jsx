import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-500 shadow-sm">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Something went wrong</h2>
              <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                An unexpected user interface error occurred. You can reload the page to continue.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FFF4EB] border border-[#F47C20] text-[#F47C20] text-xs font-bold rounded-xl shadow-2xs min-h-[44px] focus:ring-2 focus:ring-[#F47C20]/20 focus:outline-none"
            >
              <RefreshCw size={14} className="text-[#F47C20]" /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

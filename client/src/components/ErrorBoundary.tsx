import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bgmi-dark text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-bgmi-surface border border-red-500/40 rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-tactical">
            <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-2xl uppercase tracking-wider text-white">
                Arena Runtime Error
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                An unexpected exception occurred during page render.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-left text-xs font-mono text-red-300 break-words max-h-32 overflow-y-auto">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-bgmi-card hover:bg-slate-800 border border-bgmi-border text-xs font-bold font-mono text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow-gold-sm"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("======== Error Boundary ======== Error caught:", error);
    console.error("======== Error Boundary ======== Component stack:", errorInfo.componentStack);
    console.error("======== Error Boundary ======== Error stack:", error.stack);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0F1021] via-[#191A36] to-[#2A185A] flex items-center justify-center p-4">
          <div className="bg-red-500/20 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 max-w-2xl">
            <h2 className="text-2xl font-bold text-red-200 mb-4">Something went wrong</h2>
            <div className="bg-black/30 rounded-xl p-4 mb-4 overflow-auto max-h-96">
              <p className="text-red-300 font-mono text-sm mb-2">Error: {this.state.error?.message}</p>
              <pre className="text-red-200/80 font-mono text-xs whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
              <pre className="text-red-200/80 font-mono text-xs whitespace-pre-wrap mt-4">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-500/30 hover:bg-red-500/40 text-white rounded-xl transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

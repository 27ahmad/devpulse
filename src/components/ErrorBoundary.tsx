import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center text-xs text-[var(--text-muted)]">
            Something went wrong loading this section.
          </div>
        )
      );
    }
    return this.props.children;
  }
}

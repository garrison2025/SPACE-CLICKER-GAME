import React from 'react';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  resetKey: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };
  private fallbackRef = React.createRef<HTMLElement>();

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    window.requestAnimationFrame(() => {
      this.fallbackRef.current?.focus({ preventScroll: true });
    });
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const focusTargetId = this.props.resetKey.startsWith('/game/')
      ? 'game-main-content'
      : 'main-content';

    return (
      <main
        ref={this.fallbackRef}
        id={focusTargetId}
        tabIndex={-1}
        role="alert"
        className="min-h-screen bg-space-950 px-4 py-24 text-center text-gray-200 focus:outline-none"
      >
        <div className="mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-black/50 p-6 sm:p-8 shadow-2xl">
          <div className="text-xs font-mono tracking-[0.25em] text-red-400">MODULE LOAD ERROR</div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-display font-black text-white">
            This page could not finish loading
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            A game or page module failed to load. This can happen after a deployment, during a temporary network interruption, or when an old browser cache references a replaced bundle.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-lg bg-neon-blue px-5 py-2.5 text-sm font-bold text-black hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
            >
              Reload this page
            </button>
            <a
              href="/"
              className="min-h-11 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-bold text-white hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white inline-flex items-center justify-center"
            >
              Return home
            </a>
          </div>
        </div>
      </main>
    );
  }
}

export default RouteErrorBoundary;

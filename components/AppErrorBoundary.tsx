import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

const CHUNK_RELOAD_KEY = 'scg_chunk_reload_attempted_v1';
const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };
  private recoveryTimer?: number;

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidMount() {
    this.recoveryTimer = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch {
        // Storage can be unavailable in hardened/private browsing modes.
      }
    }, 15_000);
  }

  componentWillUnmount() {
    if (this.recoveryTimer !== undefined) {
      window.clearTimeout(this.recoveryTimer);
    }
  }

  componentDidCatch(error: Error) {
    if (!CHUNK_ERROR_PATTERN.test(`${error.name} ${error.message}`)) return;

    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
    } catch {
      // Keep the visible fallback if sessionStorage or reload is blocked.
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-[100dvh] bg-space-950 text-white flex items-center justify-center p-6">
        <section
          role="alert"
          className="w-full max-w-xl rounded-2xl border border-neon-blue/30 bg-space-900 p-6 sm:p-8 shadow-2xl"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-neon-blue">
            Simulation update detected
          </p>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold">
            This page needs a fresh load
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-300">
            A required game module could not be loaded. This can happen when an older open tab meets a newer site deployment. Local game saves are stored separately in this browser.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-lg bg-neon-blue px-5 py-2.5 font-bold text-black hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Reload latest version
            </button>
            <a
              href="/"
              className="min-h-11 rounded-lg border border-white/15 px-5 py-2.5 text-center font-bold text-white hover:border-neon-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
            >
              Return to home
            </a>
          </div>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;

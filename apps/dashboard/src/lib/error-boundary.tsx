/**
 * @file error-boundary.tsx
 * @module lib/error-boundary
 *
 * @description
 * App-level React error boundary. The last line of defence between an
 * unexpected render / data-layer throw and a broken white screen for the
 * end user. Mounted around the routed tree in
 * [`main.tsx`](../main.tsx) so every route inherits it.
 *
 * ## Why this exists
 *
 * `Suspense` catches promise throws (data-loading), not synchronous render
 * throws. React's supported hook for the latter is
 * `componentDidCatch` on a class component — hence this file is a `.tsx`
 * class rather than a functional component. Function-component APIs like
 * `use()`, `useErrorBoundary()`, or the third-party `react-error-boundary`
 * package all delegate to the same underlying class-component primitive.
 *
 * Concretely we catch:
 *
 *   - Sync render throws in any descendant (`throw new Error(...)` inside a
 *     function component's body).
 *   - Effects that throw synchronously during `useLayoutEffect` /
 *     `useEffect` **cleanup** (React re-throws these).
 *   - Third-party libraries that call `throw` from inside their render
 *     path (Refine's provider guards can do this on misconfiguration).
 *
 * We do NOT catch:
 *
 *   - Async promise rejections from event handlers (`onPress` throwing).
 *     Those are the caller's responsibility — the boundary can't see them.
 *     Wrap them in `try/catch` and route to a toast.
 *   - Server-side errors (this is an SPA — no SSR surface exists).
 *
 * ## User-facing behaviour
 *
 * The fallback UI is intentionally minimal: HeroUI `Card`, an academic-cap
 * app icon, the generic "Something went wrong" heading, a short user-safe
 * message, and two actions: **Try again** (`resetErrorBoundary`) and
 * **Return home** (`window.location.href = "/"`). The raw stack is NEVER
 * surfaced to the user — leaking internal call sites is a common data
 * disclosure pattern and gives a determined attacker a map.
 *
 * ## Telemetry
 *
 * On every catch we fire an `error_boundary_caught` analytics event with:
 *
 *   - `digest`  React's `componentStack`-derived digest (empty string if
 *               React did not attach one — happens for very early throws).
 *   - `stack`   The error's `.stack` truncated to 500 characters so we can
 *               reproduce the fault without exceeding common analytics
 *               event size limits (PostHog: 4 KB, Sentry: 8 KB).
 *   - `path`    `window.location.pathname` at the time of the catch — lets
 *               a support agent open the exact page the customer was on.
 *
 * The analytics context is not wired yet in Wave 1 — the reporter falls
 * back to `console.error` in dev and a no-op in prod. The `TODO` marks the
 * follow-up once `AnalyticsProvider` is mounted in `providers.tsx`.
 *
 * ## Placement
 *
 * Mounted in `main.tsx` OUTSIDE `<BrowserRouter>` so that a broken router
 * still surfaces the fallback. Also outside `<Providers>` for the same
 * reason — if `Refine` or `LocaleProvider` throws at construction, we still
 * catch it. The trade-off is that we can't use the theme provider or the
 * i18n formatter inside the fallback; strings here are English-only and
 * the palette lives in Tailwind tokens. That's the right trade-off for a
 * last-line-of-defence surface.
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *
 * @related main.tsx — the mount point.
 */

import { AcademicCapIcon, ExclamationTriangleIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button } from "@stackra/ui/react";
import { Component } from "react";

import type { ErrorInfo, ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for {@link AppErrorBoundary}. */
export interface AppErrorBoundaryProps {
  /** The routed tree the boundary protects. */
  readonly children: ReactNode;
  /**
   * Product name used in the fallback header. Defaults to `"Academorix"`
   * so the file has no import-time dependency on `siteConfig` (which pulls
   * `envConfig`, which validates env vars — anything that can throw before
   * the boundary mounts must stay off its critical path).
   */
  readonly productName?: string;
  /**
   * Support-contact email or URL surfaced in the fallback footer. Defaults
   * to an empty string, in which case the "contact support" line renders
   * as plain text.
   */
  readonly supportContact?: string;
}

/** Payload the boundary hands to the analytics reporter. */
interface ErrorBoundaryEventPayload {
  readonly digest: string;
  readonly stack: string;
  readonly path: string;
}

/**
 * Internal boundary state. `error` is non-null after `getDerivedStateFromError`
 * fires and until `handleReset` clears it. `resetKey` bumps every time
 * `handleReset` runs so descendants that hold on to state get a fresh mount.
 */
interface AppErrorBoundaryState {
  readonly error: Error | null;
  readonly resetKey: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum stack length forwarded to analytics (PostHog / Sentry event caps). */
const STACK_TRUNCATION_LIMIT = 500;

// ---------------------------------------------------------------------------
// Telemetry bridge
// ---------------------------------------------------------------------------

/**
 * TODO(wave-1-batch-b): route through the analytics context once
 * `AnalyticsProvider` is mounted in `providers.tsx`. For now, log to
 * console in dev and no-op in prod so the boundary is observable during
 * local development but never spams the browser console in production.
 */
function reportErrorEvent(payload: ErrorBoundaryEventPayload): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error("[error-boundary] error_boundary_caught", payload);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * The app-level React error boundary. See the file docblock for the full
 * contract; short version:
 *
 *   - Wraps the routed tree.
 *   - Catches sync render throws (see the `Component.componentDidCatch`
 *     contract).
 *   - Renders a HeroUI-styled fallback with a **Try again** button that
 *     clears the error and re-mounts descendants (via the `resetKey`).
 *   - Fires an `error_boundary_caught` telemetry event on every catch.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public override state: AppErrorBoundaryState = {
    error: null,
    resetKey: 0,
  };

  /**
   * React's static hook: called during the "commit" phase of a render that
   * threw. Returns the state patch that captures the error so the next
   * render can show the fallback instead of the broken tree.
   */
  public static getDerivedStateFromError(error: Error): Pick<AppErrorBoundaryState, "error"> {
    return { error };
  }

  /**
   * React's post-commit hook: called after `getDerivedStateFromError` and
   * after the fallback has rendered. Ideal place for side effects
   * (logging, analytics) — running them here (rather than in
   * `getDerivedStateFromError`) matches React's rules for pure static
   * methods vs instance lifecycle.
   */
  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    const stack = (error.stack ?? "").slice(0, STACK_TRUNCATION_LIMIT);
    const path = typeof window === "undefined" ? "" : window.location.pathname;

    /*
     * React's ErrorInfo (Vite/CSR) exposes `componentStack` only.
     * `digest` is a Next.js Server-Components-specific field, so we read
     * it defensively (some frameworks add it) but fall back to the
     * component stack when absent — this is what Sentry/PostHog will
     * fingerprint on.
     */
    const digest =
      (info as unknown as { digest?: string }).digest ??
      info.componentStack?.split("\n")[1]?.trim() ??
      "";

    reportErrorEvent({ digest, stack, path });
  }

  /**
   * Clears the error and increments `resetKey`. The key change forces
   * React to remount every descendant, which is the right move after a
   * throw — the previous render was broken, so any hook state it left
   * behind is untrustworthy.
   */
  private readonly handleReset = (): void => {
    this.setState((previous) => ({ error: null, resetKey: previous.resetKey + 1 }));
  };

  /**
   * "Return home" — a full page reload plus a navigate to `/`. We
   * deliberately do NOT use React Router's `useNavigate()` here because
   * the boundary lives OUTSIDE `<BrowserRouter>` (see file docblock), so
   * hooks are unavailable. `window.location.href` gives us the same
   * outcome without a router dependency.
   */
  private readonly handleGoHome = (): void => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  public override render(): ReactNode {
    if (this.state.error === null) {
      // Nothing to catch — pass through. The `resetKey` on the fragment key
      // ensures that a `Try again` press remounts descendants cleanly.
      return <div key={this.state.resetKey}>{this.props.children}</div>;
    }

    const productName = this.props.productName ?? "Academorix";
    const supportContact = this.props.supportContact ?? "";

    return (
      <main
        aria-labelledby="app-error-boundary-heading"
        className="flex min-h-dvh items-center justify-center bg-background px-6 py-16"
        role="alert"
      >
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-md">
          <div className="mb-4 flex items-center gap-2 text-accent">
            <AcademicCapIcon aria-hidden="true" className="size-7" />
            <span className="text-lg font-semibold text-foreground">{productName}</span>
          </div>

          <div className="mb-6 flex items-start gap-3">
            <ExclamationTriangleIcon
              aria-hidden="true"
              className="mt-0.5 size-6 shrink-0 text-danger"
            />
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold text-foreground" id="app-error-boundary-heading">
                Something went wrong
              </h1>
              <p className="text-sm text-muted">
                An unexpected error interrupted this page. Your data is safe. Try again, or head
                back to the home screen.
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" variant="primary" onPress={this.handleReset}>
              Try again
            </Button>
            <Button className="flex-1" variant="secondary" onPress={this.handleGoHome}>
              Return home
            </Button>
          </div>

          <p className="text-center text-xs text-muted">
            If this keeps happening,{" "}
            {supportContact ? (
              <a className="text-accent hover:underline" href={`mailto:${supportContact}`}>
                contact support
              </a>
            ) : (
              <span>contact support</span>
            )}
            .
          </p>
        </div>
      </main>
    );
  }
}

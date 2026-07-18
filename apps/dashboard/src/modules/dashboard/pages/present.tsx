/**
 * @file present.tsx
 * @module modules/dashboard/pages/present
 *
 * @description
 * Presenter mode — a full-viewport, black-background slideshow that
 * cycles through the user's pinned dashboards one at a time. Kept
 * under the `chromeless` tier so no shell chrome (sidebar, navbar,
 * aside) renders around the slide. Handy for kiosks, TVs, all-hands
 * screens, and any moment where the operator wants the dashboard
 * front-and-centre without the app UI competing for attention.
 *
 * ## Route contract
 *
 *   * URL: `/dashboard/present`.
 *   * Registered in `dashboard.module.ts` under `tier: "chromeless"`.
 *   * Query strings:
 *     * `?interval=<seconds>` — rotation cadence, clamped to
 *       `[5, 300]`. Defaults to `30`.
 *
 * ## Data
 *
 *   * Reads dashboards from `useDashboards()`.
 *   * Filters to `isPinned === true`. Falls back to every dashboard
 *     the user can see when no dashboards are pinned so the page is
 *     never a dead end.
 *
 * ## Behaviour
 *
 *   * Renders each dashboard as a full-screen
 *     {@link DashboardCanvas} in `readonly` mode.
 *   * Auto-cycles on the configured interval when unpaused.
 *   * Bottom-of-screen progress bar showing the current slide
 *     index + the animated remaining-time indicator for the slide.
 *   * Top-right controls: pause / play / next / previous / exit.
 *     Hidden after **3 seconds** of mouse-idle time; reappear on any
 *     `mousemove`.
 *   * Keyboard: `←` / `→` navigates, `Space` toggles pause/resume,
 *     `Esc` exits (uses `useNavigate("/dashboard")`), `F` toggles
 *     browser fullscreen via `document.documentElement.requestFullscreen()`.
 *
 * ## Design notes
 *
 *   * The rotation clock lives in a `useEffect` that re-arms itself
 *     whenever `activeIndex` or `intervalMs` changes. Pausing is a
 *     dependency on `isPaused` so we don't fight React state.
 *   * The progress bar uses a keyed React remount trick — a new
 *     `key` per (slide, playhead) forces the `<div>` CSS animation
 *     to restart cleanly rather than paper over the old animation
 *     with a mid-flight transform.
 *   * Fullscreen state is a local mirror of the browser's
 *     `fullscreenElement` — we listen to `fullscreenchange` so the
 *     UI stays in sync when the user hits Esc via the browser
 *     chrome rather than our own Exit button.
 */

import { Button, toast, Tooltip } from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "@stackra/routing/react";

import type { Dashboard } from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { DashboardCanvas } from "@/modules/dashboard/components/dashboard-canvas";
import { useDashboards } from "@/modules/dashboard/dashboards";

/** Rotation interval bounds — matches the spec (`interval` query). */
const MIN_INTERVAL_SECONDS = 5;
const MAX_INTERVAL_SECONDS = 300;
const DEFAULT_INTERVAL_SECONDS = 30;

/** Controls auto-hide after N ms of mouse-idle time. */
const CONTROLS_IDLE_MS = 3000;

/**
 * Clamp the `interval` query string to a sane rotation window.
 * Non-numeric / out-of-range values fall back to the default. Kept
 * pure so the reducer that reads the search params stays trivial.
 */
function clampInterval(raw: string | null): number {
  if (!raw) {
    return DEFAULT_INTERVAL_SECONDS;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_INTERVAL_SECONDS;
  }

  return Math.min(MAX_INTERVAL_SECONDS, Math.max(MIN_INTERVAL_SECONDS, parsed));
}

/**
 * True when the current keystroke should be treated as a
 * text-input action rather than a global shortcut. Presenter runs
 * outside the shell but a dashboard viewer might still land here
 * inside a hostile embed context; the belt-and-braces check keeps
 * the shortcuts polite regardless.
 */
function isTypingInInput(event: KeyboardEvent): boolean {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) return true;

  const tag = target.tagName;

  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export default function DashboardPresenterRoute(): ReactNode {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registry = useDashboards();

  // ---------------------------------------------------------------------
  // Slide list — pinned dashboards first; falls back to every
  // dashboard so the page never renders an empty slideshow.
  // ---------------------------------------------------------------------

  const slides = useMemo<readonly Dashboard[]>(() => {
    const pinned = registry.dashboards.filter((entry) => entry.isPinned);

    if (pinned.length > 0) {
      return pinned;
    }

    // Fallback branch — no dashboards are pinned so the operator
    // still gets a sensible cycle over every dashboard they can see.
    // Kept as a fallback rather than the default so pinning stays
    // the primary "curate the slideshow" affordance.
    return registry.dashboards;
  }, [registry.dashboards]);

  // ---------------------------------------------------------------------
  // Rotation state — active slide index, pause flag, and the
  // parsed interval from the query string.
  // ---------------------------------------------------------------------

  const intervalSeconds = clampInterval(searchParams.get("interval"));
  const intervalMs = intervalSeconds * 1000;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);

  // Bump on every manual navigate — used to force the progress bar
  // CSS animation to restart via React `key` when the user hits
  // Prev / Next while the auto-rotate would otherwise be mid-cycle.
  const [playhead, setPlayhead] = useState(0);

  // Clamp the active index when the slide list shrinks (e.g. the
  // user unpins the current slide from another tab). Also handles
  // the edge case of an empty slide list gracefully.
  useEffect(() => {
    if (slides.length === 0) {
      if (activeIndex !== 0) setActiveIndex(0);

      return;
    }

    if (activeIndex >= slides.length) {
      setActiveIndex(slides.length - 1);
    }
  }, [slides.length, activeIndex]);

  // ---------------------------------------------------------------------
  // Rotation clock — a single `setTimeout` per active slide. Kept
  // as a timeout (not an interval) so cancellation semantics are
  // trivial when the user pauses, navigates, or the interval
  // changes.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (isPaused) return;
    if (slides.length <= 1) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
      // Re-key the progress bar so the CSS animation restarts.
      setPlayhead((n) => n + 1);
    }, intervalMs);

    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused, intervalMs, slides.length]);

  // ---------------------------------------------------------------------
  // Manual navigation — Prev / Next / Exit / Play-Pause. Every path
  // bumps the `playhead` so the progress bar restarts from zero.
  // ---------------------------------------------------------------------

  const goPrev = useCallback((): void => {
    if (slides.length === 0) return;

    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
    setPlayhead((n) => n + 1);
  }, [slides.length]);

  const goNext = useCallback((): void => {
    if (slides.length === 0) return;

    setActiveIndex((current) => (current + 1) % slides.length);
    setPlayhead((n) => n + 1);
  }, [slides.length]);

  const togglePause = useCallback((): void => {
    setPaused((current) => !current);
  }, []);

  const exit = useCallback((): void => {
    navigate("/dashboard");
  }, [navigate]);

  // ---------------------------------------------------------------------
  // Fullscreen toggle — mirrors the browser state so pressing Esc
  // in the browser chrome (which we can't intercept) leaves the
  // local UI in sync.
  // ---------------------------------------------------------------------

  const [isFullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = useCallback((): void => {
    if (typeof document === "undefined") return;

    // `document.fullscreenElement` is the source of truth. Any
    // failure to enter / exit is surfaced as a toast rather than
    // silently swallowed so the operator knows to try again.
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        toast.warning("Couldn't exit fullscreen.");
      });

      return;
    }

    if (typeof document.documentElement.requestFullscreen !== "function") {
      toast.warning("Fullscreen unsupported in this browser.");

      return;
    }

    document.documentElement.requestFullscreen().catch(() => {
      toast.warning("Couldn't enter fullscreen.");
    });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handler = (): void => {
      setFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handler);

    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ---------------------------------------------------------------------
  // Keyboard shortcuts — the block runs at document scope so the
  // full-viewport slide surface stays focus-independent. Guarded
  // by the input-typing check so nested inputs (should any ship in
  // a widget) keep behaving normally.
  // ---------------------------------------------------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (isTypingInInput(event)) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goPrev();

          return;

        case "ArrowRight":
          event.preventDefault();
          goNext();

          return;

        case " ":
        case "Spacebar":
          event.preventDefault();
          togglePause();

          return;

        case "Escape":
          event.preventDefault();
          exit();

          return;

        case "f":
        case "F":
          // Bare `F` toggles fullscreen. Modifier chords (⌘F etc.)
          // pass through to the browser as-is.
          if (event.metaKey || event.ctrlKey || event.altKey) return;

          event.preventDefault();
          toggleFullscreen();

          return;
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [exit, goNext, goPrev, toggleFullscreen, togglePause]);

  // ---------------------------------------------------------------------
  // Mouse-idle control affordance — shows the top-right controls
  // when the pointer moves and hides them after 3 seconds of
  // stillness. Ref-driven timer avoids re-arming on every render.
  // ---------------------------------------------------------------------

  const [showControls, setShowControls] = useState(true);
  const idleTimerRef = useRef<number | null>(null);

  const bumpControls = useCallback((): void => {
    setShowControls(true);

    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_IDLE_MS);
  }, []);

  useEffect(() => {
    // Arm the initial timer on mount so the controls fade even
    // without an initial mouse-move.
    bumpControls();

    return () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [bumpControls]);

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------

  const activeSlide = slides[activeIndex];
  const hasSlides = slides.length > 0;

  // Progress-bar CSS animation duration is the current interval.
  // When the user pauses, we drop `animation-play-state: paused`
  // so the bar freezes at its current fill instead of resetting.
  const progressAnimationDuration = `${intervalSeconds}s`;
  const progressAnimationPlayState = isPaused ? "paused" : "running";

  return (
    <div
      className="dark fixed inset-0 flex flex-col overflow-hidden bg-black text-foreground"
      data-theme="dark"
      onMouseMove={bumpControls}
    >
      {/* Slide surface — canvas rendered readonly against the
          active dashboard. Padded generously so widgets don't
          hug the viewport edges. */}
      <main
        aria-live="polite"
        className="min-h-0 flex-1 overflow-auto px-6 py-10 sm:px-10 lg:px-14"
      >
        {hasSlides && activeSlide ? (
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
            <header className="flex items-center gap-3">
              {activeSlide.icon ? (
                <Iconify className="size-6 text-foreground opacity-80" icon={activeSlide.icon} />
              ) : null}
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {activeSlide.name}
              </h1>
              <span className="ms-auto text-sm text-muted tabular-nums">
                {activeIndex + 1} / {slides.length}
              </span>
            </header>
            <DashboardCanvas dashboard={activeSlide} mode="readonly" />
          </div>
        ) : (
          <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-3 text-center">
            <Iconify className="size-10 text-muted" icon="chart-column" />
            <p className="text-lg font-semibold text-foreground">Nothing to present yet.</p>
            <p className="text-sm text-muted">
              Pin a dashboard from the tabs bar to feature it in presenter mode.
            </p>
            <Button className="mt-2" onPress={exit} size="sm" variant="primary">
              <Iconify className="size-4" icon="arrow-left" />
              Back to dashboard
            </Button>
          </div>
        )}
      </main>

      {/* Top-right controls — hidden after 3s of mouse idle. */}
      <div
        aria-hidden={!showControls}
        className={[
          "pointer-events-none absolute top-4 right-4 z-20 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 p-1 shadow-xl backdrop-blur">
          <Tooltip>
            <Button
              aria-label="Previous slide"
              isDisabled={!hasSlides}
              onPress={goPrev}
              size="sm"
              variant="ghost"
            >
              <Iconify className="size-4" icon="chevron-left" />
            </Button>
            <Tooltip.Content>Previous slide (←)</Tooltip.Content>
          </Tooltip>
          <Tooltip>
            <Button
              aria-label={isPaused ? "Resume" : "Pause"}
              isDisabled={!hasSlides || slides.length <= 1}
              onPress={togglePause}
              size="sm"
              variant="ghost"
            >
              <Iconify className="size-4" icon={isPaused ? "play" : "pause"} />
            </Button>
            <Tooltip.Content>
              {isPaused ? "Resume rotation (Space)" : "Pause rotation (Space)"}
            </Tooltip.Content>
          </Tooltip>
          <Tooltip>
            <Button
              aria-label="Next slide"
              isDisabled={!hasSlides}
              onPress={goNext}
              size="sm"
              variant="ghost"
            >
              <Iconify className="size-4" icon="chevron-right" />
            </Button>
            <Tooltip.Content>Next slide (→)</Tooltip.Content>
          </Tooltip>
          <div aria-hidden className="mx-0.5 h-4 w-px bg-white/20" />
          <Tooltip>
            <Button
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onPress={toggleFullscreen}
              size="sm"
              variant="ghost"
            >
              <Iconify className="size-4" icon="eye" />
            </Button>
            <Tooltip.Content>
              {isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
            </Tooltip.Content>
          </Tooltip>
          <Tooltip>
            <Button aria-label="Exit presenter" onPress={exit} size="sm" variant="ghost">
              <Iconify className="size-4" icon="xmark" />
            </Button>
            <Tooltip.Content>Exit presenter (Esc)</Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* Bottom progress bar — one wide track with a filling
          overlay whose CSS animation runs for the interval
          duration. Re-mounted via `key` so manual navigation
          restarts the fill from zero. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 border-t border-white/10 bg-black/60 px-6 py-2.5 backdrop-blur"
      >
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="tabular-nums">
            {hasSlides ? `${activeIndex + 1} / ${slides.length}` : "0 / 0"}
          </span>
          <span aria-hidden>·</span>
          <span>{isPaused ? "Paused" : `Every ${intervalSeconds}s`}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            key={`${activeIndex}-${playhead}`}
            className="h-full origin-left bg-white/80"
            style={{
              // Inline CSS keyframes-free progress: transform is
              // animated via the shared @keyframes below. Each
              // slide gets a fresh element via `key` so React
              // remounts the div and the animation runs from 0%.
              animationName: "presenter-progress",
              animationDuration: progressAnimationDuration,
              animationTimingFunction: "linear",
              animationFillMode: "forwards",
              animationPlayState: progressAnimationPlayState,
              transform: "scaleX(0)",
            }}
          />
        </div>
      </div>

      {/* Keyframes injected via a `<style>` tag so the page has
          zero global-CSS dependencies. The animation is trivial
          and duplication here keeps the presenter free of shared
          stylesheet coupling. */}
      <style>{`
        @keyframes presenter-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

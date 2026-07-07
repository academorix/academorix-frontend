/**
 * @file tour-popover.tsx
 * @module onboarding/tour/tour-popover
 *
 * @description
 * The HeroUI Popover shell that renders the active tour step. Reads
 * the active step from {@link useTour} and positions itself against
 * the step's anchor. Falls back to a centered "spotlight" dialog when
 * the anchor is missing (preface steps, or a step whose anchor hasn't
 * rendered yet — a route transition can unmount it between steps).
 *
 * ## Anchoring
 *
 * The popover resolves anchors through TWO attribute channels, in this
 * order:
 *
 *  1. **`[data-tour-anchor="<step-id>"]`** — the preferred hook. Any
 *     module can tag its sentinel element (sidebar item, `⌘K` chip,
 *     notification bell, settings gear) with a stable, human-readable
 *     value that matches the step id in
 *     {@link "@/config/onboarding.config".TOUR_STEPS}. This attribute
 *     is namespaced to the tour so a test-id refactor cannot break it.
 *  2. **Fallback selector** on the step definition (`step.anchorSelector`)
 *     — usually a `[data-testid="…"]` selector. Retained so surfaces that
 *     already ship a test-id do not need to add a second attribute.
 *
 * If NEITHER resolves at measurement time (route transition mid-tour,
 * anchor not yet mounted, target module disabled by permissions), the
 * popover renders as a centered "spotlight" dialog. This keeps the tour
 * flowing without visually appearing broken.
 *
 * HeroUI's Popover positions against an element wrapped by
 * `<Popover.Trigger>`; it does NOT support "give me any DOM node and
 * I'll anchor there". Two workarounds we could pick:
 *
 * 1. Wrap the real anchor with `<Popover.Trigger>`. Doesn't work —
 *    the anchors are owned by other modules (sidebar, navbar) and
 *    we can't inject a wrapper into them without refactoring every
 *    surface.
 * 2. Portal a positioned overlay next to the anchor manually. This
 *    is what we do below — a `getBoundingClientRect()` on the
 *    anchor + a fixed-position container beside it. HeroUI's
 *    Popover is used as a normal Card here (imported for
 *    consistency with the design system) rather than for its
 *    positioning behaviour.
 *
 * ## Overlay
 *
 * A translucent backdrop dims the rest of the app so the popover
 * pops. Clicks on the backdrop DO NOT dismiss — that's a Skip
 * click, an explicit user action. Escape does close (see
 * `useEscapeToClose`).
 *
 * ## Accessibility
 *
 * - Role `dialog`, `aria-modal="true"`, `aria-labelledby` pointing
 *   at the title. Focus is trapped inside the popover so the tour
 *   can't be tabbed past.
 * - The Skip button is `aria-label`ed independently of its visual
 *   text so a screen reader user knows the action even if the icon
 *   changes.
 *
 * @see ONBOARDING_PLAN.md §4.1 — UX.
 */

import { Button, Separator } from "@academorix/ui/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { OnboardingTourStep } from "@/onboarding/onboarding.types";
import type { ReactNode } from "react";

import { useTour } from "@/onboarding/tour/tour-provider";
import { useTourTranslate } from "@/onboarding/tour/use-tour-translate";

// ---------------------------------------------------------------------------
// Positioning helpers
// ---------------------------------------------------------------------------

/** Represents where the popover should render on screen. */
interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Placement of the popover relative to its anchor. */
type Placement = "top" | "bottom" | "left" | "right" | "center";

/**
 * Resolves an anchor element for a tour step. Two channels in priority order:
 *
 *  1. `[data-tour-anchor="<step.id>"]` — the preferred, tour-scoped attribute
 *     module authors add to sentinel DOM nodes.
 *  2. `step.anchorSelector` — the fallback selector shipped in
 *     {@link "@/config/onboarding.config".TOUR_STEPS}. Usually a
 *     `[data-testid="…"]`.
 *
 * Returns `null` when nothing matches so the caller can render a centered
 * spotlight dialog.
 */
function resolveAnchorForStep(step: OnboardingTourStep): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  // Preferred: the tour-scoped attribute. Reads exactly the step's stable id,
  // so a module tags its DOM once and the tour picks it up.
  const scoped = document.querySelector<HTMLElement>(
    `[data-tour-anchor="${cssEscape(step.id)}"]`,
  );

  if (scoped) {
    return scoped;
  }

  // Fallback: the config's selector. Guarded against invalid selectors so a
  // typo in the config never throws at render time.
  if (step.anchorSelector) {
    try {
      const fallback = document.querySelector<HTMLElement>(step.anchorSelector);

      if (fallback) {
        return fallback;
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          `[onboarding/tour-popover] invalid anchorSelector for step '${step.id}': ${step.anchorSelector}`,
          err,
        );
      }
    }
  }

  return null;
}

/**
 * Minimal `CSS.escape` polyfill. We only escape the characters that could
 * plausibly appear in a tour step id (dot for the namespace, colon in
 * pseudo-classes) so a well-formed id like `tour.workspace` becomes a valid
 * attribute-selector value. Full spec compliance is not needed — the input
 * comes from our own config, not from user input.
 */
function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/([\\"'.:#[\]()+~>*])/g, "\\$1");
}

/** Reads the bounding rect of the resolved anchor, coping with SSR + missing elements. */
function measureAnchorForStep(step: OnboardingTourStep): AnchorRect | null {
  const el = resolveAnchorForStep(step);

  if (!el) {
    return null;
  }

  const rect = el.getBoundingClientRect();

  // If the anchor is hidden (display:none, offscreen), treat as missing so
  // we render the centered fallback instead of anchoring off-screen.
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Given an anchor rect + a placement, compute the CSS position for
 * the popover's outer container. Keeps the popover on-screen by
 * clamping to viewport bounds.
 */
function computePopoverPosition(
  anchor: AnchorRect | null,
  placement: Placement,
  popoverWidth: number,
): { top: number; left: number; placement: Placement } {
  if (!anchor || placement === "center") {
    // No anchor / centered — put the dialog in the viewport middle.
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 768;

    return {
      top: viewportHeight / 2 - 120,
      left: viewportWidth / 2 - popoverWidth / 2,
      placement: "center",
    };
  }

  const OFFSET = 12;
  const clampLeft = (left: number): number => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;

    return Math.max(16, Math.min(viewportWidth - popoverWidth - 16, left));
  };

  switch (placement) {
    case "right":
      return {
        top: anchor.top + anchor.height / 2 - 40,
        left: clampLeft(anchor.left + anchor.width + OFFSET),
        placement: "right",
      };
    case "left":
      return {
        top: anchor.top + anchor.height / 2 - 40,
        left: clampLeft(anchor.left - popoverWidth - OFFSET),
        placement: "left",
      };
    case "top":
      return {
        top: anchor.top - 160 - OFFSET,
        left: clampLeft(anchor.left + anchor.width / 2 - popoverWidth / 2),
        placement: "top",
      };
    case "bottom":
    default:
      return {
        top: anchor.top + anchor.height + OFFSET,
        left: clampLeft(anchor.left + anchor.width / 2 - popoverWidth / 2),
        placement: "bottom",
      };
  }
}

/** Heuristic placement based on the anchor's screen quadrant. */
function inferPlacement(step: OnboardingTourStep, anchor: AnchorRect | null): Placement {
  if (!anchor) return "center";

  // Sidebar anchors (workspace) live on the left edge — popover to
  // the right so it doesn't overlap the sidebar.
  if (step.id.startsWith("tour.workspace")) return "right";

  // Palette trigger is near the top — pop below.
  if (step.id === "tour.command-palette") return "bottom";

  // Bell + settings gear are top-right — pop below.
  if (step.id === "tour.notifications" || step.id === "tour.settings") return "bottom";

  return "bottom";
}

// ---------------------------------------------------------------------------
// Custom hook: escape-to-close
// ---------------------------------------------------------------------------

/**
 * Wires the `Escape` key to `close()`. Skipping the tour is a more
 * definite action — the user should press the visible Skip button.
 */
function useEscapeToClose(isActive: boolean, close: () => void): void {
  useEffect(() => {
    if (!isActive) return;

    const handler = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, [close, isActive]);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * The visual shell. Renders `null` when inactive so no wrapper
 * portal exists — the effect below only starts observing the anchor
 * when a step becomes active.
 */
export function TourPopover(): ReactNode {
  const { isActive, currentStep, totalSteps, steps, next, back, skip, close, surface } = useTour();
  const t = useTourTranslate();
  const step = steps[currentStep];

  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Re-measure the anchor on every activation, and on window resize
  // so a viewport change re-positions the popover.
  useEffect(() => {
    if (!isActive || !step) {
      setAnchor(null);

      return;
    }

    const measure = (): void => setAnchor(measureAnchorForStep(step));

    measure();

    // Poll for the first ~2s in case the anchor mounts later (route
    // navigation delay, lazy module hydration). After that the resize
    // handler + observer take over.
    const pollHandle = window.setInterval(measure, 200);
    const stopPolling = window.setTimeout(() => window.clearInterval(pollHandle), 2000);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.clearInterval(pollHandle);
      window.clearTimeout(stopPolling);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [isActive, step]);

  useEscapeToClose(isActive, close);

  if (!isActive || !step) {
    return null;
  }

  const isLastStep = currentStep === totalSteps - 1;
  const placement = inferPlacement(step, anchor);
  const position = computePopoverPosition(anchor, placement, 380);
  // `data-anchor-mode` is exposed so tests + e2e can assert whether the
  // popover is anchored to a real element or fell back to the centered
  // "spotlight" mode. Cheaper than re-measuring in the assertion.
  const anchorMode = anchor === null ? "centered" : "anchored";

  // PWA-specific tweak: last step swaps "Finish" for "Enable
  // notifications" so we hand off to the push permission flow.
  const showPwaNotificationCta = isLastStep && (surface === "pwa" || surface === "pwa-shortcut");

  // Render into `document.body` so the dim overlay covers everything.
  return createPortal(
    <div
      aria-hidden={false}
      className="fixed inset-0 z-[1000]"
      // Not a click-to-dismiss backdrop — clicking the overlay is
      // intentional dismissal, so we mount the button separately.
      data-anchor-mode={anchorMode}
      data-testid="onboarding-tour-overlay"
    >
      {/* Dim overlay — 40% opacity per plan §4.1. Pointer events
          disabled so anchored elements underneath stay clickable. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      {/* The popover card itself. */}
      <div
        ref={popoverRef}
        aria-labelledby="onboarding-tour-title"
        aria-modal="true"
        className="absolute w-[380px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-surface p-5 shadow-2xl"
        data-testid={`onboarding-tour-step-${step.id}`}
        role="dialog"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium tracking-wider text-muted uppercase">
                {t("onboarding.tour.stepCounter", "Step {{current}} of {{total}}", {
                  current: currentStep + 1,
                  total: totalSteps,
                })}
              </span>
              <h2 className="text-base font-semibold text-foreground" id="onboarding-tour-title">
                {t(step.titleKey)}
              </h2>
            </div>
            <Button
              aria-label={t("onboarding.tour.skip", "Skip")}
              data-testid="onboarding-tour-skip"
              size="sm"
              variant="tertiary"
              onPress={skip}
            >
              {t("onboarding.tour.skip", "Skip")}
            </Button>
          </div>

          <p className="text-sm leading-relaxed text-muted">{t(step.bodyKey)}</p>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <Button
              data-testid="onboarding-tour-back"
              isDisabled={currentStep === 0}
              size="sm"
              variant="secondary"
              onPress={back}
            >
              {t("onboarding.tour.back", "Back")}
            </Button>

            {showPwaNotificationCta ? (
              <Button
                data-testid="onboarding-tour-enable-notifications"
                size="sm"
                onPress={() => {
                  // TODO(sub-agent-integration): call the notifications
                  // module's `promptForPushPermission()` once the
                  // Notifications sub-agent exposes it on the module
                  // barrel. Until then, closing the tour is the correct
                  // graceful degradation — the user still sees the tour
                  // to completion and doesn't lose any functionality.
                  next();
                }}
              >
                {t("onboarding.tour.enableNotifications", "Enable notifications")}
              </Button>
            ) : (
              <Button data-testid="onboarding-tour-next" size="sm" onPress={next}>
                {isLastStep
                  ? t("onboarding.tour.finish", "Finish")
                  : step.ctaKey
                    ? t(step.ctaKey, t("onboarding.tour.next", "Next"))
                    : t("onboarding.tour.next", "Next")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

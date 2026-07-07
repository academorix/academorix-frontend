/**
 * @file product-showcase.tsx
 * @module components/marketing/product-showcase
 *
 * @description
 * Intercom-style tabbed showcase for the home page. A single card
 * sized to full width with a horizontal tab list at the top and, in
 * each panel, a two-column story: on the reading-order-start side a
 * headline, description, bulleted highlights and CTA; on the
 * reading-order-end side a stylized "product preview" card that
 * evokes the surface the tab represents.
 *
 * ## Auto-advance (buttery smooth)
 *
 * Each tab exposes a thin progress bar under its label. The **active
 * tab's** bar fills via a CSS `@keyframes` animation (`showcase-
 * progress-fill`, declared in `globals.css`). That runs on the
 * browser's compositor thread rather than React's render loop, so
 * there are zero per-frame `setState` calls — the bar animates at a
 * true 60fps regardless of what else the page is doing.
 *
 * When the active bar's animation completes, `onAnimationEnd`
 * advances to the next tab (wrapping back to the first at the end).
 * Manually clicking a tab restarts the timer for that tab (React
 * key change → animation restart from `0%`).
 *
 * Pause on hover is done by toggling `animation-play-state` — a
 * pure CSS change, no state churn. `prefers-reduced-motion: reduce`
 * disables the auto-advance entirely so no motion plays for users
 * who've opted out.
 *
 * ## Manual navigation
 *
 * The component is a **controlled** `<Tabs>`. `selectedKey` follows
 * `activeIndex`; `onSelectionChange` updates the index and bumps a
 * `cycleId` counter that participates in the animated bar's React
 * key, forcing a clean animation restart on manual switch.
 *
 * ## Accent palette
 *
 * Each tab carries an `accent` key ("indigo" | "amber" | "mint" |
 * "purple" | "rose") that picks a soft translucent gradient for the
 * preview card backdrop. Opacity is intentionally low so both light
 * and dark modes read cleanly on top of the Glass theme's
 * background gradient.
 */

"use client";

import { Tabs } from "@heroui/react";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import type { HomeShowcase, Localized, ShowcaseAccent } from "@/lib/types";
import type { CSSProperties, Key } from "react";

import { CtaButton } from "@/components/marketing/cta-button";
import { resolveIcon } from "@/lib/icon-registry";

/** Auto-advance duration per tab, in milliseconds. */
const AUTO_ADVANCE_MS = 7000;

/** Props for {@link ProductShowcase}. */
export interface ProductShowcaseProps {
  showcase: Localized<HomeShowcase>;
  className?: string;
}

/**
 * Soft translucent gradients per accent. Applied on the preview
 * card backdrop and its accent stripe. Values are Tailwind arbitrary
 * classes so the palette lives with the component rather than
 * leaking into `home.json` (which stays a pure content file).
 */
const ACCENT_STYLES: Record<ShowcaseAccent, { backdrop: string; stripe: string; chip: string }> = {
  indigo: {
    backdrop: "from-indigo-400/25 via-blue-400/10 to-transparent",
    stripe: "from-indigo-400 to-blue-500",
    chip: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  },
  amber: {
    backdrop: "from-amber-400/25 via-orange-400/10 to-transparent",
    stripe: "from-amber-400 to-orange-500",
    chip: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  },
  mint: {
    backdrop: "from-emerald-400/25 via-teal-400/10 to-transparent",
    stripe: "from-emerald-400 to-teal-500",
    chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  purple: {
    backdrop: "from-fuchsia-400/25 via-purple-400/10 to-transparent",
    stripe: "from-fuchsia-400 to-purple-500",
    chip: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
  },
  rose: {
    backdrop: "from-rose-400/25 via-pink-400/10 to-transparent",
    stripe: "from-rose-400 to-pink-500",
    chip: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  },
};

/**
 * Intercom-style tabbed product showcase with auto-advance progress
 * bars. Section spacing and heading are the caller's responsibility
 * so the page can compose the showcase consistently with the rest
 * of the marketing sections.
 */
export function ProductShowcase({ showcase, className }: ProductShowcaseProps) {
  const tabs = showcase.tabs;
  const firstTab = tabs[0];

  // `activeIndex` — which tab is currently showing.
  // `cycleId` — bumped on every activation so the active-bar
  //   `<span>` remounts and restarts its CSS animation from 0%.
  // `isPaused` — pointer hover state; toggles the CSS
  //   `animation-play-state` on the active bar without dirtying
  //   the rest of the render tree.
  // `reducedMotion` — mirrors the user's OS-level preference so we
  //   never auto-advance for a visitor who's asked us not to.
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [cycleId, setCycleId] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Mirror `prefers-reduced-motion` into state so downstream JSX
  // can conditionally opt out of the animation.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setReducedMotion(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  /**
   * User picked a tab manually. Update the index and bump `cycleId`
   * so the animated fill on the new active tab remounts, restarting
   * from 0% instead of picking up where a previous animation was.
   */
  const handleSelectionChange = useCallback(
    (key: Key) => {
      const nextIndex = tabs.findIndex((t) => t.id === String(key));

      if (nextIndex < 0 || nextIndex === activeIndex) return;
      setActiveIndex(nextIndex);
      setCycleId((n) => n + 1);
    },
    [tabs, activeIndex],
  );

  /**
   * Fired by the browser when the active bar's CSS animation
   * completes. Advances to the next tab (wrapping) and bumps
   * `cycleId` so the next tab's fresh bar restarts from 0%.
   */
  const handleAdvance = useCallback(() => {
    setActiveIndex((current) => (current + 1) % tabs.length);
    setCycleId((n) => n + 1);
  }, [tabs.length]);

  const handlePointerEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  if (!firstTab) return null;

  const activeTab = tabs[activeIndex] ?? firstTab;

  return (
    <div
      className={clsx("w-full", className)}
      onBlur={handlePointerLeave}
      onFocus={handlePointerEnter}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
    >
      <Tabs
        className="w-full"
        selectedKey={activeTab.id}
        variant="secondary"
        onSelectionChange={handleSelectionChange}
      >
        <Tabs.ListContainer className="border-b border-default/40">
          <Tabs.List
            aria-label="Product showcase tabs"
            className="mx-auto flex w-fit gap-2 px-2 *:relative *:gap-2 *:px-4 *:py-3 *:text-sm *:font-medium"
          >
            {tabs.map((tab, index) => {
              const Icon = resolveIcon(tab.icon);
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;

              return (
                <Tabs.Tab key={tab.id} id={tab.id}>
                  <Icon aria-hidden className="size-4" />
                  <span>{tab.label}</span>
                  <TabProgressBar
                    cycleId={cycleId}
                    isActive={isActive}
                    isPast={isPast}
                    isPaused={isPaused}
                    isReducedMotion={reducedMotion}
                    onComplete={handleAdvance}
                  />
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>

        {tabs.map((tab) => (
          <Tabs.Panel key={tab.id} className="pt-12" id={tab.id}>
            <ShowcasePanelBody tab={tab} />
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Progress bar under each tab
// ═══════════════════════════════════════════════════════════════════

interface TabProgressBarProps {
  /** Whether this bar belongs to the currently active tab. */
  isActive: boolean;
  /** Whether this tab has already been visited during the current cycle. */
  isPast: boolean;
  /** Whether the pointer is over the showcase (freezes animation). */
  isPaused: boolean;
  /** Whether the user has opted into reduced motion. */
  isReducedMotion: boolean;
  /** Cycle counter — used as part of the animated span's React key. */
  cycleId: number;
  /** Called when the active bar's CSS animation completes. */
  onComplete: () => void;
}

/**
 * The thin horizontal fill under a single tab. Three visual states:
 *
 *   - **active**: CSS `@keyframes` animation fills the bar 0 → 100%
 *     over `AUTO_ADVANCE_MS`. React re-keys the element on every
 *     new cycle so the animation always starts fresh from 0%.
 *   - **past**: static 100% fill (looks "already watched").
 *   - **future**: static 0% fill (looks "not visited yet").
 *
 * The active variant is inside its own memoized-key `<span>` so the
 * DOM node is recycled by React on manual tab clicks — the
 * animation restarts naturally without a JS-driven `.reset()`.
 */
function TabProgressBar({
  isActive,
  isPast,
  isPaused,
  isReducedMotion,
  cycleId,
  onComplete,
}: TabProgressBarProps) {
  // Base track that sits under the label on every tab.
  const track = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-2 -bottom-px h-[3px] overflow-hidden rounded-full bg-default/40"
    >
      {isActive && !isReducedMotion ? (
        // Re-keyed by cycleId so React remounts the span on each
        // activation, restarting the CSS animation from 0%.
        <span
          key={cycleId}
          className="absolute inset-y-0 start-0 rounded-full bg-accent"
          style={ACTIVE_FILL_STYLE(isPaused)}
          onAnimationEnd={onComplete}
        />
      ) : (
        // Non-animated fill: full-width for "past" tabs, zero-width
        // for "future" tabs. Reduced-motion visitors get the same
        // treatment (active tab shows a static 100% bar).
        <span
          className="absolute inset-y-0 start-0 rounded-full bg-accent"
          style={{ width: isPast || (isActive && isReducedMotion) ? "100%" : "0%" }}
        />
      )}
    </span>
  );

  return track;
}

/**
 * The style object applied to the active-tab animated fill. Kept as
 * a factory (rather than a static const) so React sees a fresh
 * reference when `isPaused` flips, which forces the browser to
 * pick up the `animation-play-state` change.
 */
function ACTIVE_FILL_STYLE(isPaused: boolean): CSSProperties {
  return {
    width: "0%",
    animation: `showcase-progress-fill ${AUTO_ADVANCE_MS}ms linear forwards`,
    animationPlayState: isPaused ? "paused" : "running",
  };
}

// ═══════════════════════════════════════════════════════════════════
// Panel body
// ═══════════════════════════════════════════════════════════════════

/** The two-column body inside each `<Tabs.Panel>`. */
function ShowcasePanelBody({ tab }: { tab: Localized<HomeShowcase>["tabs"][number] }) {
  const accent = ACCENT_STYLES[tab.accent] ?? ACCENT_STYLES.indigo;
  const CheckIcon = resolveIcon("CheckCircleIcon");

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col gap-6 text-start">
        <h3 className="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
          {tab.headline}
        </h3>
        <p className="text-base text-muted sm:text-lg">{tab.description}</p>

        <ul className="flex flex-col gap-3">
          {tab.highlights.map((highlight, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-foreground">
              <CheckIcon
                aria-hidden
                className={clsx("mt-0.5 size-5 shrink-0", accent.chip.split(" ")[1])}
              />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="pt-2">
          <CtaButton
            cta={{ label: tab.cta_label, type: "link", href: tab.cta_href }}
            variant="primary"
          />
        </div>
      </div>

      <ShowcasePreviewCard accent={tab.accent} tab={tab} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Mock preview card
// ═══════════════════════════════════════════════════════════════════

/**
 * Stylized mock of a product surface — window chrome + sidebar +
 * stat cards. Everything is rendered from data so the mock stays
 * consistent with the marketing copy and bilingual by construction.
 */
function ShowcasePreviewCard({
  accent,
  tab,
}: {
  accent: ShowcaseAccent;
  tab: Localized<HomeShowcase>["tabs"][number];
}) {
  const style = ACCENT_STYLES[accent] ?? ACCENT_STYLES.indigo;

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br p-4 sm:p-8",
        "shadow-lg ring-1 ring-default/40",
        style.backdrop,
      )}
    >
      <div className="rounded-2xl border border-default/40 bg-surface/95 shadow-xl backdrop-blur-xl">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-default/40 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full bg-rose-400/70" />
            <span aria-hidden className="size-2.5 rounded-full bg-amber-400/70" />
            <span aria-hidden className="size-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="mx-auto rounded-full border border-default/40 bg-default/30 px-4 py-1 text-xs font-medium text-muted">
            {tab.window_title}
          </span>
        </div>

        {/* Body: sidebar + main area */}
        <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-0">
          {/* Sidebar */}
          <aside className="flex flex-col gap-1 border-e border-default/40 bg-default/20 p-3">
            {tab.sidebar_items.map((item, index) => (
              <div
                key={index}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                  item.is_active ? clsx("text-foreground shadow-sm", style.chip) : "text-muted",
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "size-1.5 rounded-full",
                    item.is_active ? "bg-current" : "bg-default",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </aside>

          {/* Main area */}
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            {/* Accent stripe hint */}
            <div
              aria-hidden
              className={clsx("h-1 w-16 rounded-full bg-gradient-to-r", style.stripe)}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {tab.stat_cards.map((card, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-1 rounded-xl border border-default/40 bg-surface/70 p-3 backdrop-blur-sm"
                >
                  <span className="text-[11px] font-medium tracking-wide text-muted uppercase">
                    {card.label}
                  </span>
                  <span className="text-xl font-semibold text-foreground">{card.value}</span>
                  {card.trend ? <span className="text-[11px] text-muted">{card.trend}</span> : null}
                </div>
              ))}
            </div>

            {/* Trailing skeleton rows so the mock reads as a full UI */}
            <div className="mt-2 flex flex-col gap-2">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-3 rounded-lg border border-default/30 bg-surface/50 px-3 py-2"
                >
                  <span aria-hidden className="size-6 shrink-0 rounded-full bg-default/60" />
                  <div className="flex flex-1 flex-col gap-1">
                    <span aria-hidden className="h-2 w-2/3 rounded-full bg-default/60" />
                    <span aria-hidden className="h-2 w-1/3 rounded-full bg-default/40" />
                  </div>
                  <span
                    aria-hidden
                    className={clsx(
                      "size-6 shrink-0 rounded-full",
                      row === 0
                        ? style.stripe.replace("from-", "bg-").split(" ")[0]
                        : "bg-default/50",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

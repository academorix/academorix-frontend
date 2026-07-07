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
 * ## HeroUI compound API
 *
 * ```tsx
 * <Tabs variant="secondary" defaultSelectedKey="athletes">
 *   <Tabs.ListContainer>
 *     <Tabs.List aria-label="...">
 *       <Tabs.Tab id="athletes">
 *         <Icon /> <span>Label</span>
 *         <Tabs.Indicator />
 *       </Tabs.Tab>
 *       // …
 *     </Tabs.List>
 *   </Tabs.ListContainer>
 *   <Tabs.Panel id="athletes"> … </Tabs.Panel>
 *   // …
 * </Tabs>
 * ```
 *
 * The `secondary` variant renders an underline indicator that reads
 * as a design-system-level tab bar (matches the Intercom style
 * reference in `screencapture-intercom-2026-07-07-16_11_06.png`).
 * `ListContainer` auto-manages overflow scrolling on narrow
 * viewports so we don't need custom breakpoint logic.
 *
 * ## Content contract
 *
 * The component consumes the locale-collapsed `Localized<HomeShowcase>`
 * shape from `home.json`, sliced by the bilingual reader before it
 * hits this Client Component. See `src/lib/types.ts` for the shape.
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

import type { Localized, HomeShowcase, ShowcaseAccent } from "@/lib/types";

import { CtaButton } from "@/components/marketing/cta-button";
import { resolveIcon } from "@/lib/icon-registry";

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
 * Intercom-style tabbed product showcase. Rendered as a Client
 * Component so the underlying HeroUI Tabs primitive can wire up
 * keyboard navigation, aria attributes, and the animated indicator.
 *
 * Section spacing and heading are the caller's responsibility so
 * the page can compose it consistently with the rest of the
 * marketing sections.
 */
export function ProductShowcase({ showcase, className }: ProductShowcaseProps) {
  const firstTab = showcase.tabs[0];

  if (!firstTab) return null;

  return (
    <div className={clsx("w-full", className)}>
      <Tabs className="w-full" defaultSelectedKey={firstTab.id} variant="secondary">
        <Tabs.ListContainer className="border-b border-default/40">
          <Tabs.List
            aria-label="Product showcase tabs"
            className="mx-auto flex w-fit gap-2 px-2 *:gap-2 *:px-4 *:py-3 *:text-sm *:font-medium"
          >
            {showcase.tabs.map((tab) => {
              const Icon = resolveIcon(tab.icon);

              return (
                <Tabs.Tab key={tab.id} id={tab.id}>
                  <Icon aria-hidden className="size-4" />
                  <span>{tab.label}</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>

        {showcase.tabs.map((tab) => (
          <Tabs.Panel key={tab.id} className="pt-12" id={tab.id}>
            <ShowcasePanelBody tab={tab} />
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
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

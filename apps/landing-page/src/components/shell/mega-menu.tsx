/**
 * @file mega-menu.tsx
 * @module components/shell/mega-menu
 *
 * @description
 * Interactive mega-menu popover used in the desktop landing header.
 *
 * ## Behaviour
 *
 * - Controlled `open` state via `useState`. Opening one menu closes
 *   all other mega-menus on the page by broadcasting a custom event
 *   (`academorix:mega-menu-open`) that every other instance listens
 *   for. This keeps the header's hover surface clean and prevents
 *   two 720px-wide panels from overlapping (which the previous
 *   `<details>`-only implementation could not prevent).
 * - Click-outside and `Escape` both close the panel.
 * - Panel paints its own opaque background using the HeroUI Pro
 *   Glass theme's `--glass-pinned-surface` token, which is designed
 *   for surfaces that must occlude content beneath them. Without
 *   this override the Glass `--surface` (deliberately semi-
 *   transparent) let hero copy bleed through the popover.
 *
 * ## Layouts
 *
 * Three panel layouts are driven by `nav.json` — the render logic
 * doesn't need to know which top-level entry it belongs to.
 *
 *  - `columns-only`  — 2-3 columns of small link groups
 *  - `cards`         — a grid of icon-title-description tiles
 *  - `cards-plus-banner` — same as `cards`, plus a right-column
 *    eyebrow banner CTA
 */

"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import type { Localized, MegaMenuPanel } from "@/lib/types";

import { resolveIcon } from "@/lib/icon-registry";

/**
 * Custom-event name broadcast when any `MegaMenu` opens so its
 * siblings can close themselves. Kept as a module constant so the
 * two ends (dispatch + listen) can never drift.
 */
const MENU_OPEN_EVENT = "academorix:mega-menu-open";

/** Payload carried by {@link MENU_OPEN_EVENT}. */
interface MegaMenuOpenDetail {
  /** Stable identifier of the menu that just opened. */
  id: string;
}

/** Props for {@link MegaMenu}. */
export interface MegaMenuProps {
  label: string;
  panel: Localized<MegaMenuPanel>;
  className?: string;
}

/**
 * Renders one top-level nav dropdown. Self-closes on outside click,
 * on Escape, and when any other `MegaMenu` opens.
 */
export function MegaMenu({ label, panel, className }: MegaMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Stable id used to distinguish "I opened" from "someone else did"
  // in the shared open-event listener below.
  const menuId = useId();

  // Coordinate open state across every MegaMenu on the page:
  // opening this menu broadcasts an event; every other instance's
  // listener sees the broadcast and closes itself.
  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<MegaMenuOpenDetail>).detail;

      if (detail?.id !== menuId) {
        setOpen(false);
      }
    }

    document.addEventListener(MENU_OPEN_EVENT, onOpen);

    return () => {
      document.removeEventListener(MENU_OPEN_EVENT, onOpen);
    };
  }, [menuId]);

  // Close on outside click and Escape while open.
  useEffect(() => {
    if (!open) {
      return;
    }

    function onDocClick(event: MouseEvent) {
      const root = rootRef.current;

      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /** Flip open state and announce open so siblings can close. */
  function toggle() {
    setOpen((wasOpen) => {
      const next = !wasOpen;

      if (next) {
        document.dispatchEvent(
          new CustomEvent<MegaMenuOpenDetail>(MENU_OPEN_EVENT, {
            detail: { id: menuId },
          }),
        );
      }

      return next;
    });
  }

  /** Close after any navigation inside the panel. */
  function close() {
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-default/40"
        type="button"
        onClick={toggle}
      >
        <span>{label}</span>
        <span
          aria-hidden
          className={clsx("text-xs transition-transform duration-150", open && "rotate-180")}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          aria-label={label}
          role="menu"
          className={clsx(
            // Base panel: solid opaque surface, floated below the trigger.
            "absolute start-0 top-full z-40 mt-2 min-w-[720px] rounded-2xl border border-default/60 p-6 shadow-2xl",
            // Layout-specific grid.
            panel.layout === "cards-plus-banner" && "grid grid-cols-3 gap-6",
            panel.layout === "cards" && "grid grid-cols-2 gap-4",
            panel.layout === "columns-only" && "grid grid-cols-3 gap-6",
          )}
          // Solid background from the Glass theme's pinned-surface
          // token so hero copy behind the panel does not bleed
          // through. The `--background` fallback covers the default
          // (non-Glass) theme.
          style={{
            backgroundColor: "var(--glass-pinned-surface, var(--background))",
          }}
        >
          {panel.columns
            ? panel.columns.map((col, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-3">
                  <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                    {col.title}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {col.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-default/40"
                          href={link.href}
                          onClick={close}
                        >
                          <span>{link.label}</span>
                          {link.badge ? (
                            <span className="inline-flex items-center rounded-full border border-default/50 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-muted uppercase">
                              {link.badge}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            : null}

          {panel.feature_cards ? (
            <div
              className={clsx(
                "grid gap-3",
                panel.layout === "cards-plus-banner" ? "col-span-2 grid-cols-2" : "grid-cols-2",
              )}
            >
              {panel.feature_cards.map((card, cardIndex) => {
                const Icon = resolveIcon(card.icon);

                return (
                  <Link
                    key={cardIndex}
                    className="group/card flex flex-col gap-2 rounded-xl border border-default/40 bg-default/20 p-4 transition-colors hover:border-default hover:bg-default/40"
                    href={card.href}
                    onClick={close}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-default/60 text-foreground">
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{card.title}</span>
                      {card.badge ? (
                        <span className="ms-auto inline-flex items-center rounded-full border border-default/50 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-muted uppercase">
                          {card.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted">{card.description}</p>
                  </Link>
                );
              })}
            </div>
          ) : null}

          {panel.banner ? (
            <Link
              className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 transition-colors hover:bg-accent/20"
              href={panel.banner.cta_href}
              onClick={close}
            >
              {(() => {
                const Icon = resolveIcon(panel.banner.icon);

                return (
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-accent/30 text-accent">
                    <Icon aria-hidden className="size-4" />
                  </span>
                );
              })()}
              <span className="text-xs font-semibold tracking-wider text-accent uppercase">
                {panel.banner.eyebrow}
              </span>
              <h4 className="text-base font-semibold text-foreground">{panel.banner.title}</h4>
              <p className="text-xs text-muted">{panel.banner.description}</p>
              <span className="mt-auto text-xs font-medium text-accent">
                {panel.banner.cta_label} →
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

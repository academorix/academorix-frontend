/**
 * @file mega-menu.tsx
 * @module components/shell/mega-menu
 *
 * @description
 * Interactive mega-menu popover used in the desktop landing header.
 * Every visual mega-menu (Products, Sports, Solutions, Enterprise…)
 * shares a single module-level store so **only one panel can be open
 * at a time**. Hovering onto a sibling trigger closes the current
 * panel instantly, hovering off both trigger and panel closes after a
 * short grace period, and pressing Escape / clicking outside closes
 * everything. This is the exact same UX pattern used on Vercel,
 * Linear, and Intercom's marketing sites.
 *
 * ## Coordination
 *
 * The open state lives on a `useSyncExternalStore` singleton at
 * module scope (not React Context). That means we don't need a
 * `<MegaMenuProvider>` wrapper — any `<MegaMenu>` on the page joins
 * the same store automatically. `React.useId()` gives each instance
 * a stable identifier so the store can name exactly one open menu.
 *
 * ## Panel opacity under the Glass theme
 *
 * The panel picks up `background-color: var(--overlay)` (a fully
 * opaque token defined in `globals.css` for both light + dark modes)
 * so the marketing page content behind never bleeds through. This
 * fixes the "transparent panel" bug reported against the previous
 * `bg-surface/95` implementation, which multiplied against the Glass
 * theme's already-alpha-blended `--surface`.
 *
 * ## Layouts
 *
 * Three layouts are supported so `nav.json` can drive presentation
 * without any client edits:
 *   - `columns-only`: 2-3 columns of small link groups
 *   - `cards`: a grid of icon-title-description tiles
 *   - `cards-plus-banner`: same as cards, plus a right-column
 *     eyebrow banner CTA
 */

"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useSyncExternalStore } from "react";

import type { Localized, MegaMenuPanel } from "@/lib/types";

import { resolveIcon } from "@/lib/icon-registry";

// ═══════════════════════════════════════════════════════════════════
// Shared open-state store (module-level singleton).
//
// Every `MegaMenu` on the page reads/writes the same value. Setting
// it flips React state for every subscriber, so opening one menu
// automatically re-renders the others as closed.
// ═══════════════════════════════════════════════════════════════════

let currentOpenId: string | null = null;
const listeners = new Set<() => void>();

/** Subscribe to open-state changes. Returns an unsubscribe callback. */
function subscribeOpenId(cb: () => void): () => void {
  listeners.add(cb);

  return () => {
    listeners.delete(cb);
  };
}

/** Current open id (or `null` when every menu is closed). */
function getOpenId(): string | null {
  return currentOpenId;
}

/** Server snapshot — every menu boots closed under SSR. */
function getServerOpenId(): null {
  return null;
}

/**
 * Set (or clear) the currently open menu. If the caller passes the
 * id that's already open, this is a no-op — avoids spurious
 * re-renders when the mouse re-enters an already-open trigger.
 */
function setOpenId(id: string | null): void {
  if (currentOpenId === id) return;
  currentOpenId = id;
  listeners.forEach((cb) => {
    cb();
  });
}

// ═══════════════════════════════════════════════════════════════════
// MegaMenu component
// ═══════════════════════════════════════════════════════════════════

/** Grace period (ms) before closing after the mouse leaves the wrapper. */
const CLOSE_DELAY_MS = 150;

/** Props for {@link MegaMenu}. */
export interface MegaMenuProps {
  label: string;
  panel: Localized<MegaMenuPanel>;
  className?: string;
}

/** Renders the mega-menu popover for one top-level nav item. */
export function MegaMenu({ label, panel, className }: MegaMenuProps) {
  const instanceId = useId();
  const openId = useSyncExternalStore(subscribeOpenId, getOpenId, getServerOpenId);
  const isOpen = openId === instanceId;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Cancel any pending close so re-entering the wrapper keeps us open. */
  const cancelPendingClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  /**
   * Schedule a delayed close. The timeout guards against pointer
   * gaps between trigger and panel; the id check inside prevents a
   * stale timer from clobbering a sibling menu that opened in the
   * meantime.
   */
  const scheduleClose = useCallback(() => {
    cancelPendingClose();
    closeTimeoutRef.current = setTimeout(() => {
      if (getOpenId() === instanceId) {
        setOpenId(null);
      }
    }, CLOSE_DELAY_MS);
  }, [cancelPendingClose, instanceId]);

  /** Open this menu (implicitly closes every other menu via the store). */
  const open = useCallback(() => {
    cancelPendingClose();
    setOpenId(instanceId);
  }, [cancelPendingClose, instanceId]);

  /** Toggle when the trigger is clicked. */
  const toggle = useCallback(() => {
    cancelPendingClose();
    setOpenId(getOpenId() === instanceId ? null : instanceId);
  }, [cancelPendingClose, instanceId]);

  // Global listeners: Escape + click-outside close every menu.
  // Only the currently-open menu needs to subscribe.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenId(null);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const wrapper = wrapperRef.current;

      if (!wrapper) return;
      if (event.target instanceof Node && wrapper.contains(event.target)) return;
      setOpenId(null);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  // Cancel any pending timer when the component unmounts.
  useEffect(
    () => () => {
      cancelPendingClose();
    },
    [cancelPendingClose],
  );

  const panelId = `mega-menu-panel-${instanceId}`;

  return (
    <div
      ref={wrapperRef}
      className={clsx("relative", className)}
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
    >
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={clsx(
          "inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full",
          "px-3 py-1.5 text-sm font-medium text-foreground transition-colors",
          "hover:bg-default/40 focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-accent",
          isOpen && "bg-default/40",
        )}
        type="button"
        onClick={toggle}
        onFocus={open}
      >
        <span>{label}</span>
        <span
          aria-hidden
          className={clsx("text-xs transition-transform duration-200", isOpen && "rotate-180")}
        >
          ▾
        </span>
      </button>

      <div
        aria-hidden={!isOpen}
        className={clsx(
          "absolute start-0 top-full z-40 mt-2 min-w-[720px] overflow-hidden rounded-2xl",
          "border border-default/60 shadow-2xl ring-1 ring-default/50",
          "transition-[opacity,transform] duration-200 ease-out",
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
        id={panelId}
        role="menu"
        // A concrete, fully opaque background token defined in
        // `globals.css`. Using `bg-surface/95` here bleeds through
        // under Glass because `--surface` is already alpha-blended
        // when the panel sits on top of a blurred backdrop.
        style={{ backgroundColor: "var(--overlay)" }}
      >
        <div
          className={clsx(
            "p-6",
            panel.layout === "cards-plus-banner" && "grid grid-cols-3 gap-6",
            panel.layout === "cards" && "grid grid-cols-2 gap-4",
            panel.layout === "columns-only" && "grid grid-cols-3 gap-6",
          )}
        >
          {panel.columns
            ? panel.columns.map((col, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                    {col.title}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {col.links.map((link, li) => (
                      <li key={li}>
                        <Link
                          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-default/40"
                          href={link.href}
                          role="menuitem"
                          onClick={() => setOpenId(null)}
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
              {panel.feature_cards.map((card, i) => {
                const Icon = resolveIcon(card.icon);

                return (
                  <Link
                    key={i}
                    className="group/card flex flex-col gap-2 rounded-xl border border-default/40 bg-surface-secondary/60 p-4 transition-colors hover:border-default hover:bg-default/40"
                    href={card.href}
                    role="menuitem"
                    onClick={() => setOpenId(null)}
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
              role="menuitem"
              onClick={() => setOpenId(null)}
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
      </div>
    </div>
  );
}

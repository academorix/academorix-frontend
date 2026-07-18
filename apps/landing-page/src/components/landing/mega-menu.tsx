import type { ReactNode } from "react";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link as RouterLink } from "react-router";

import { Iconify } from "../../icons/iconify";

/** One column of link items inside the mega menu panel. */
export type MegaMenuColumn = {
  label: string;
  items: { icon: string; label: string; description?: string; href: string }[];
};

/** Optional promotional card rendered on the left of the panel. */
export type MegaMenuBanner = {
  icon: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  /** Tailwind color utility class(es) for the banner background tint, e.g. `bg-violet-500/10`. */
  accent?: string;
};

type MegaMenuProps = {
  trigger: string;
  columns: MegaMenuColumn[];
  banner?: MegaMenuBanner;
};

/** Delays keep the dropdown steady when the pointer briefly crosses gaps. */
const OPEN_DELAY_MS = 200;
const CLOSE_DELAY_MS = 150;

/**
 * Hover-and-click dropdown used for the "Products" and "Sports" desktop
 * navigation triggers. The panel is portalled inline into the navbar
 * (no React portal — just absolute positioning), so it inherits the
 * navbar's stacking context and theme tokens.
 */
export function MegaMenu({ trigger, columns, banner }: MegaMenuProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const clearTimers = useCallback(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(() => {
    clearTimers();
    openTimer.current = window.setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
  }, [clearTimers]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
  }, [clearTimers]);

  const closeNow = useCallback(() => {
    clearTimers();
    setIsOpen(false);
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNow();
    };
    const onDocPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) closeNow();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onDocPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDocPointerDown);
    };
  }, [isOpen, closeNow]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onFocus={scheduleOpen}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={
          "inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-accent-foreground focus-visible:outline-none " +
          (isOpen ? "text-accent-foreground" : "")
        }
        onBlur={(event) => {
          // Only close on blur if focus is leaving the whole root.
          if (rootRef.current && rootRef.current.contains(event.relatedTarget as Node)) return;
          scheduleClose();
        }}
        onClick={() => (isOpen ? closeNow() : setIsOpen(true))}
        type="button"
      >
        {trigger}
        <Iconify
          className={"size-3.5 transition-transform " + (isOpen ? "rotate-180" : "")}
          icon="chevron-down"
        />
      </button>

      {isOpen ? (
        <div
          className="absolute top-full left-1/2 z-50 mt-3 -translate-x-1/2"
          id={menuId}
          onMouseEnter={scheduleOpen}
          onMouseLeave={scheduleClose}
          role="menu"
        >
          <div className="min-w-[720px] rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl">
            <div
              className={
                "grid gap-6 " +
                (banner ? "grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]" : "grid-cols-1")
              }
            >
              {banner ? (
                <div
                  className={
                    "flex flex-col justify-between rounded-2xl p-5 " +
                    (banner.accent ?? "bg-accent/10")
                  }
                >
                  <div>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-surface text-foreground shadow-sm">
                      <Iconify className="size-5" icon={banner.icon} />
                    </div>
                    <p className="font-display mt-4 text-base font-semibold text-foreground">
                      {banner.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{banner.description}</p>
                  </div>
                  <RouterLink
                    className="link mt-6 inline-flex items-center gap-1 text-sm font-semibold text-foreground"
                    onClick={closeNow}
                    to={banner.ctaHref}
                  >
                    {banner.ctaLabel}
                    <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
                  </RouterLink>
                </div>
              ) : null}

              <div
                className={
                  "grid gap-6 " +
                  (columns.length >= 3
                    ? "grid-cols-3"
                    : columns.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-1")
                }
              >
                {columns.map((column) => (
                  <div key={column.label}>
                    <p className="text-xs font-medium tracking-wide text-muted uppercase">
                      {column.label}
                    </p>
                    <ul className="mt-3 space-y-1" role="none">
                      {column.items.map((item) => (
                        <li key={item.href + "|" + item.label} role="none">
                          <RouterLink
                            className="group flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-secondary"
                            onClick={closeNow}
                            role="menuitem"
                            to={item.href}
                          >
                            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                              <Iconify className="size-4" icon={item.icon} />
                            </span>
                            <span className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">
                                {item.label}
                              </span>
                              {item.description ? (
                                <span className="mt-0.5 text-xs leading-relaxed text-muted">
                                  {item.description}
                                </span>
                              ) : null}
                            </span>
                          </RouterLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type MegaMenuMobileGroupProps = {
  trigger: string;
  items: { label: string; href: string }[];
};

/**
 * Simple, non-interactive list rendering of a mega-menu group. Meant to
 * be used inside the mobile `Navbar.Menu` where hover interactions do
 * not apply and screen space is at a premium.
 */
export function MegaMenuMobileGroup({ trigger, items }: MegaMenuMobileGroupProps): ReactNode {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{trigger}</p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.href + "|" + item.label}>
            <RouterLink
              className="link block py-1 text-sm font-medium text-foreground"
              to={item.href}
            >
              {item.label}
            </RouterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

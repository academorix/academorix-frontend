/**
 * @file mega-menu.tsx
 * @module components/nav/mega-menu
 *
 * @description
 * Enterprise-grade mega-menu built as a self-contained hover dropdown — the
 * trigger and the panel share one DOM subtree so `mouseenter`/`mouseleave`
 * events never traverse a portal boundary. This eliminates the "flash" bug
 * caused by React Aria's default portalled overlay: without a portal, the
 * pointer transition between trigger and panel is continuous, so the close
 * timer never fires spuriously.
 *
 * ## Interaction model
 *
 * - Hover over the trigger → 80 ms delay → panel opens (avoids opening on
 *   pass-through hover).
 * - Move pointer out of trigger + panel subtree → 160 ms delay → panel
 *   closes (bridges the tiny gap between trigger button and panel top).
 * - Click the trigger → toggles the panel open/closed (parity with mobile
 *   + keyboard flows).
 * - Escape → closes the panel and returns focus to the trigger.
 * - Focus in / focus out of the subtree → opens / closes with the same
 *   delay so keyboard users get the same behaviour.
 *
 * ## Positioning
 *
 * The panel is positioned via plain Tailwind classes (`absolute`,
 * `top-full`, `left-1/2 -translate-x-1/2`). No Popper, no runtime layout
 * math — which means no positioning "flash" on the first render.
 */

"use client";

import { ChevronDownIcon } from "@academorix/ui/icons/outline";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { MegaMenuPanel } from "@/lib/types";
import type { KeyboardEvent, ReactNode } from "react";

import { MegaMenuBannerItem } from "@/components/nav/mega-menu-banner";
import { MegaMenuColumns } from "@/components/nav/mega-menu-columns";
import { MegaMenuFeatureCardItem } from "@/components/nav/mega-menu-feature-card";

/** Props for {@link MegaMenu}. */
interface MegaMenuProps {
  label: string;
  panel: MegaMenuPanel;
}

/** Chooses the panel width based on the layout hint. */
function panelWidthClass(layout: MegaMenuPanel["layout"]): string {
  switch (layout) {
    case "cards-plus-banner":
      return "w-[860px] max-w-[calc(100vw-32px)]";
    case "cards":
      return "w-[640px] max-w-[calc(100vw-32px)]";
    case "columns-only":
    default:
      return "w-[560px] max-w-[calc(100vw-32px)]";
  }
}

/** Renders the panel body based on the panel's layout hint. */
function PanelBody({ panel }: { panel: MegaMenuPanel }): ReactNode {
  if (panel.layout === "cards-plus-banner" && panel.banner) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {panel.columns ? <MegaMenuColumns columns={panel.columns} /> : null}
          {panel.feature_cards ? (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {panel.feature_cards.map((card) => (
                <MegaMenuFeatureCardItem key={card.href} card={card} />
              ))}
            </div>
          ) : null}
        </div>
        <MegaMenuBannerItem banner={panel.banner} />
      </div>
    );
  }

  if (panel.layout === "cards" && panel.feature_cards) {
    return (
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {panel.feature_cards.map((card) => (
          <MegaMenuFeatureCardItem key={card.href} card={card} />
        ))}
      </div>
    );
  }

  if (panel.columns) {
    return <MegaMenuColumns columns={panel.columns} />;
  }

  return null;
}

/** A single mega-menu trigger + panel. */
export function MegaMenu({ label, panel }: MegaMenuProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const clearTimers = useCallback((): void => {
    if (openTimer.current !== null) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleOpen = useCallback((): void => {
    clearTimers();
    openTimer.current = setTimeout(() => setIsOpen(true), 80);
  }, [clearTimers]);

  const scheduleClose = useCallback((): void => {
    clearTimers();
    closeTimer.current = setTimeout(() => setIsOpen(false), 160);
  }, [clearTimers]);

  // Clean up any pending timers on unmount.
  useEffect(
    () => () => {
      clearTimers();
    },
    [clearTimers],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === "Escape" && isOpen) {
        clearTimers();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    [clearTimers, isOpen],
  );

  return (
    // The wrapper is a passive container capturing keyboard/mouse events
    // that bubble from the interactive `<button>` trigger and the panel
    // contents. The interactive element is the button below, not the div.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="relative"
      onFocus={scheduleOpen}
      onKeyDown={onKeyDown}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={triggerRef}
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-default/40 hover:text-foreground"
        type="button"
        onBlur={(event) => {
          // Close only when focus fully leaves the wrapper.
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
            scheduleClose();
          }
        }}
        onClick={() => {
          clearTimers();
          setIsOpen((open) => !open);
        }}
      >
        {label}
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/*
        Panel container. Always mounted (so screen readers can find it via
        aria-controls) but hidden with `pointer-events-none` + zero opacity
        when closed. `top-full` snaps it directly under the trigger and
        `-translate-x-1/2` horizontally centres it. The 8px "bridge"
        (`pt-2`) sits between the trigger and the visible panel body so
        the pointer never lands on empty space when moving down.
      */}
      <div
        aria-hidden={!isOpen}
        className={`absolute top-full left-1/2 z-50 -translate-x-1/2 pt-2 transition-opacity duration-150 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        id={panelId}
        role="menu"
      >
        <div
          className={`${panelWidthClass(
            panel.layout,
          )} rounded-xl border border-default bg-surface p-4 shadow-2xl`}
        >
          <PanelBody panel={panel} />
        </div>
      </div>
    </div>
  );
}

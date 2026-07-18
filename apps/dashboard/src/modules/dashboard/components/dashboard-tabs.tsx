/**
 * @file dashboard-tabs.tsx
 * @module modules/dashboard/components/dashboard-tabs
 *
 * @description
 * Horizontal scrollable tab bar rendered above the dashboard content.
 * Shows every dashboard the user can see (built-ins + custom) with:
 *
 *   * A trailing `+` button that opens the New-Dashboard dialog.
 *   * Fade masks on both edges when the row overflows.
 *   * `←` / `→` scroll buttons that appear only when overflow is
 *     actually present (measured with `ResizeObserver`).
 *   * The active tab auto-scrolls into view on route change.
 *   * A per-tab overflow menu (Pin / Duplicate / Rename / Delete /
 *     Set default / Share).
 *
 * Design taste rules applied:
 *
 *   * Tab labels are `Title Case` and cap at ~22 characters with
 *     `text-ellipsis`.
 *   * Active tab uses a solid pill shape; siblings are ghost.
 *   * Icons are 14px; keep the row compact so ~10 tabs fit on a
 *     1440px screen without scroll.
 *   * We render each tab as a `<Link>` (client-side navigation) so
 *     middle-click / cmd-click open in a new tab as the user
 *     expects.
 */

import { Button, Chip, Description, Dropdown, Label, Tooltip } from "@heroui/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "@stackra/routing/react";

import type { Dashboard } from "@/modules/dashboard/dashboards";
import type { Key, ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { dashboardHref } from "@/modules/dashboard/dashboards";

/** Fraction of the visible width scrolled by each ←/→ click. */
const SCROLL_STEP_RATIO = 0.6;

/** Tolerance in px used to detect the row is actually overflowing. */
const OVERFLOW_EPSILON = 2;

export interface DashboardTabsProps {
  /** Every dashboard to render as a tab, in tab-order. */
  dashboards: readonly Dashboard[];
  /** The active dashboard id — drives the pill styling. */
  activeId: string | undefined;
  /** Open the new-dashboard dialog. */
  onCreate: () => void;
  /** Trigger a rename on the given dashboard. */
  onRename: (dashboard: Dashboard) => void;
  /** Trigger a duplicate + navigate. */
  onDuplicate: (dashboard: Dashboard) => Promise<void>;
  /** Trigger a delete (with confirm). */
  onDelete: (dashboard: Dashboard) => Promise<void>;
  /** Toggle the pin flag. */
  onTogglePin: (dashboard: Dashboard) => Promise<void>;
  /** Promote the dashboard to the user's default. */
  onSetDefault: (dashboard: Dashboard) => Promise<void>;
  /** Open the share dialog for the dashboard. */
  onShare: (dashboard: Dashboard) => void;
}

/**
 * Compute whether the row overflows and how far each edge is from
 * being scrolled to. Called on mount + on scroll + on resize.
 */
function measureScroll(el: HTMLElement | null): {
  hasLeft: boolean;
  hasRight: boolean;
  overflows: boolean;
} {
  if (!el) {
    return { hasLeft: false, hasRight: false, overflows: false };
  }

  const overflows = el.scrollWidth - el.clientWidth > OVERFLOW_EPSILON;
  const hasLeft = el.scrollLeft > OVERFLOW_EPSILON;
  const hasRight = el.scrollWidth - el.clientWidth - el.scrollLeft > OVERFLOW_EPSILON;

  return { hasLeft, hasRight, overflows };
}

export function DashboardTabs({
  dashboards,
  activeId,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
  onTogglePin,
  onSetDefault,
  onShare,
}: DashboardTabsProps): ReactNode {
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ hasLeft: false, hasRight: false, overflows: false });
  const location = useLocation();

  const updateMeasure = useCallback(() => {
    setState(measureScroll(trackRef.current));
  }, []);

  // Observe both the container's size and the intrinsic content
  // width — either can push a stable row into overflow.
  useLayoutEffect(() => {
    updateMeasure();

    const el = trackRef.current;

    if (!el || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => updateMeasure());

    observer.observe(el);

    for (const child of Array.from(el.children)) {
      observer.observe(child as Element);
    }

    return () => observer.disconnect();
  }, [dashboards.length, updateMeasure]);

  // Auto-scroll the active tab into view whenever the route changes.
  useEffect(() => {
    const el = trackRef.current;

    if (!el) return;

    const active = el.querySelector<HTMLElement>(`[data-dashboard-active="true"]`);

    if (active) {
      // `nearest` block avoids the browser scrolling the entire
      // viewport when the tab strip is already visible.
      active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [location.pathname, dashboards.length]);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const el = trackRef.current;

    if (!el) return;

    el.scrollBy({ left: el.clientWidth * SCROLL_STEP_RATIO * direction, behavior: "smooth" });
  }, []);

  const overflowMenuFor = useCallback(
    (
      dashboard: Dashboard,
    ): Array<{
      id: string;
      label: string;
      icon: string;
      danger?: boolean;
      disabled?: boolean;
      hint?: string;
    }> => {
      const isBuiltIn = dashboard.isBuiltIn;

      return [
        {
          id: `pin-${dashboard.id}`,
          label: dashboard.isPinned ? "Unpin from sidebar" : "Pin to sidebar",
          icon: dashboard.isPinned ? "star-fill" : "star",
        },
        {
          id: `default-${dashboard.id}`,
          label: dashboard.isDefault ? "Default dashboard" : "Set as default",
          icon: "square-check",
          disabled: dashboard.isDefault,
        },
        {
          id: `rename-${dashboard.id}`,
          label: "Rename…",
          icon: "pencil",
          disabled: isBuiltIn,
          hint: isBuiltIn ? "Built-in dashboards can't be renamed." : undefined,
        },
        {
          id: `duplicate-${dashboard.id}`,
          label: "Duplicate…",
          icon: "layers",
        },
        {
          id: `share-${dashboard.id}`,
          label: "Share…",
          icon: "share",
          disabled: isBuiltIn,
          hint: isBuiltIn ? "Share the underlying custom dashboard instead." : undefined,
        },
        {
          id: `delete-${dashboard.id}`,
          label: "Delete…",
          icon: "trash-bin",
          danger: true,
          disabled: isBuiltIn,
          hint: isBuiltIn ? "Built-in dashboards can't be deleted." : undefined,
        },
      ];
    },
    [],
  );

  const handleMenuAction = useCallback(
    (dashboard: Dashboard, key: Key): void => {
      const action = String(key);

      if (action.startsWith("pin-")) {
        void onTogglePin(dashboard);
      } else if (action.startsWith("rename-")) {
        onRename(dashboard);
      } else if (action.startsWith("duplicate-")) {
        void onDuplicate(dashboard);
      } else if (action.startsWith("delete-")) {
        void onDelete(dashboard);
      } else if (action.startsWith("default-")) {
        void onSetDefault(dashboard);
      } else if (action.startsWith("share-")) {
        onShare(dashboard);
      }
    },
    [onTogglePin, onRename, onDuplicate, onDelete, onSetDefault, onShare],
  );

  const items = useMemo(() => dashboards, [dashboards]);

  return (
    <div className="relative flex items-center gap-1">
      {state.overflows ? (
        <button
          aria-label="Scroll dashboards left"
          className={[
            "border-border bg-background text-muted hover:text-foreground",
            "flex size-7 shrink-0 items-center justify-center rounded-full border transition-opacity",
            state.hasLeft ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
          onClick={() => scrollBy(-1)}
          type="button"
        >
          <Iconify className="size-4" icon="chevron-left" />
        </button>
      ) : null}

      <div className="relative min-w-0 flex-1">
        {state.overflows && state.hasLeft ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent" />
        ) : null}
        {state.overflows && state.hasRight ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent" />
        ) : null}

        <div
          ref={trackRef}
          aria-label="Dashboards"
          className="flex scrollbar-none items-center gap-1 overflow-x-auto pb-1"
          onScroll={updateMeasure}
          role="tablist"
        >
          {items.map((dashboard) => {
            const active = dashboard.id === activeId;

            return (
              <div
                key={dashboard.id}
                className="flex shrink-0 items-center"
                data-dashboard-active={active ? "true" : "false"}
                role="presentation"
              >
                <Link
                  aria-selected={active ? "true" : "false"}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm no-underline transition-colors",
                    active
                      ? "border-transparent bg-foreground text-background"
                      : "border-transparent text-muted hover:bg-surface-secondary hover:text-foreground",
                  ].join(" ")}
                  role="tab"
                  tabIndex={active ? 0 : -1}
                  to={dashboardHref(dashboard)}
                >
                  <Iconify
                    className={active ? "size-3.5 opacity-90" : "size-3.5 opacity-60"}
                    icon={dashboard.icon ?? "square-check"}
                  />
                  <span className="max-w-[14rem] truncate">{dashboard.name}</span>
                  {dashboard.isBuiltIn ? null : dashboard.visibility === "shared" ? (
                    <Tooltip>
                      {/* WHY the span with role="img": Tooltip's
                          trigger runs `useLabel` on its child.
                          A bare <Iconify> renders an SVG that has
                          no accessible name — the label resolver
                          warns. Wrapping in a labelled span
                          upgrades the trigger to a properly named
                          graphic without introducing an extra
                          interactive control. */}
                      <span aria-label="Shared dashboard" className="inline-flex" role="img">
                        <Iconify
                          className={active ? "size-3 opacity-80" : "size-3 opacity-60"}
                          icon="persons"
                        />
                      </span>
                      <Tooltip.Content>Shared with your tenant</Tooltip.Content>
                    </Tooltip>
                  ) : null}
                  {dashboard.isDefault ? (
                    <Chip
                      className={active ? "bg-background/20 text-background" : ""}
                      size="sm"
                      variant="soft"
                    >
                      <Chip.Label>Default</Chip.Label>
                    </Chip>
                  ) : null}
                </Link>
                <Dropdown>
                  {/* WHY: HeroUI's <Dropdown.Trigger> renders its own
                      native <button> element under the hood. Wrapping
                      our HeroUI <Button> inside it produced a nested
                      <button><button>…</button></button> at the DOM
                      level, tripping React's `validateDOMNesting`
                      warning at runtime. The idiomatic v3 pattern is
                      to drop the <Button> straight into <Dropdown>:
                      the <Button> component detects the wrapping
                      dropdown context and becomes the trigger element
                      itself, so ARIA + hover + press state all stay
                      wired correctly with a single button in the DOM. */}
                  <Button
                    aria-label={`Actions for ${dashboard.name}`}
                    className="-ms-1 text-muted hover:text-foreground"
                    isIconOnly
                    size="sm"
                    variant="ghost"
                  >
                    <Iconify className="size-3.5" icon="ellipsis" />
                  </Button>
                  <Dropdown.Popover placement="bottom end">
                    <Dropdown.Menu onAction={(key) => handleMenuAction(dashboard, key)}>
                      {overflowMenuFor(dashboard).map((entry) => (
                        <Dropdown.Item
                          key={entry.id}
                          id={entry.id}
                          isDisabled={entry.disabled}
                          variant={entry.danger ? "danger" : "default"}
                        >
                          <Iconify className="size-4 shrink-0 text-muted" icon={entry.icon} />
                          <div className="flex flex-col">
                            <Label>{entry.label}</Label>
                            {entry.hint ? <Description>{entry.hint}</Description> : null}
                          </div>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>
            );
          })}

          <Tooltip>
            <Button
              aria-label="New dashboard"
              className="ms-1"
              isIconOnly
              onPress={onCreate}
              size="sm"
              variant="ghost"
            >
              <Iconify className="size-4" icon="plus" />
            </Button>
            <Tooltip.Content>New dashboard</Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {state.overflows ? (
        <button
          aria-label="Scroll dashboards right"
          className={[
            "border-border bg-background text-muted hover:text-foreground",
            "flex size-7 shrink-0 items-center justify-center rounded-full border transition-opacity",
            state.hasRight ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
          onClick={() => scrollBy(1)}
          type="button"
        >
          <Iconify className="size-4" icon="chevron-right" />
        </button>
      ) : null}
    </div>
  );
}

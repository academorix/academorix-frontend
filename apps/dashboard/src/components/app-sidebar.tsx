/**
 * @file app-sidebar.tsx
 * @module components/app-sidebar
 *
 * @description
 * The primary sidebar. Auto-derives its nav from the module registry
 * — {@link navGroupsWithItems} + {@link navItems} — and layers a
 * user-controlled preference stack on top:
 *
 *   • **Pinned modules** — a promoted section at the top
 *     ({@link usePinnedModules}).
 *   • **Hidden modules** — declutter, still reachable via ⌘K / URL
 *     ({@link useHiddenModules}).
 *   • **Group order + collapse** — per-user section rearrangement
 *     ({@link useSidebarGroupPrefs}).
 *   • **Pinned custom dashboards** — rendered under the Overview
 *     group's Dashboard entry as a proper `Sidebar.Submenu` so the
 *     hierarchy is discoverable ({@link useSidebarPinnedDashboards}).
 *
 * ## Compound structure (AgentHub reference)
 * The tree follows the HeroUI Pro AgentHub reference layout so every
 * shell surface stays visually aligned. Top-to-bottom:
 *
 *   Sidebar (style="--spacing:0.3rem")
 *     Sidebar.Header — brand mark + wordmark + a settings icon button
 *     Sidebar.Content — grouped menu blocks
 *       Sidebar.Group (Pinned modules, when non-empty)
 *       Sidebar.Group (Canonical groups, per user order)
 *       Sidebar.Separator
 *       Sidebar.Group ("Apps" — palette + shortcuts + notifications)
 *     Sidebar.Separator
 *     Sidebar.Footer
 *       big "Open command palette" secondary CTA + icon-only sibling
 *       user avatar pill → dropdown with Profile / Settings / Sign out
 *   Sidebar.Rail — click/drag to toggle the collapsed state
 *   Sidebar.Mobile — same body wrapped for the mobile Sheet
 *
 * ## React 19 crash guard (kept)
 * A raw `<div>` sibling of `Sidebar.MenuItem` inside `Sidebar.Menu`
 * used to crash React 19's reconciler (`nextResource.createElementNS
 * is not a function`) whenever the tree remounted an `<svg>`. Every
 * direct child of a `Sidebar.Menu` MUST therefore be a real
 * `Sidebar.MenuItem`. Where nesting is needed, use `Sidebar.Submenu`
 * inside the parent MenuItem (per the HeroUI Pro compound docs) —
 * never break out into a bare div.
 *
 * ## Compact spacing
 * The root `<Sidebar>` sets `--spacing: 0.3rem` inline to tighten
 * row rhythm without cascading the value globally. Slightly looser
 * than the AgentHub reference (`0.2rem`) to give menu rows air
 * without ballooning the rail.
 */

import { Avatar, Button, Chip, Dropdown, Label, SearchField, Tooltip } from "@heroui/react";
import { Sidebar, useSidebar } from "@heroui-pro/react";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "@stackra/routing/react";

import type { CSSProperties, Key, ReactNode } from "react";

import type { Dashboard } from "@/modules/dashboard/dashboards";
import type { Identity } from "@/refine/auth-provider";
import type { NavGroupWithItems, NavItem } from "@/modules/registry";

import { BrandIsotipo, brand } from "@/brand";
import { Iconify } from "@/icons/iconify";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { resolveWorkspace } from "@/lib/auth/workspace-resolver";
import { useMyWorkspaces } from "@/hooks/use-my-workspaces";
import { ShortcutKbd } from "@/lib/kbd";
import { navGroups } from "@/lib/groups";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useHiddenModules } from "@/hooks/use-hidden-modules";
import { usePinnedModules } from "@/hooks/use-pinned-modules";
import { applyGroupOrder, useSidebarGroupPrefs } from "@/hooks/use-sidebar-group-prefs";
import { canAccessDashboard, dashboardHref, useDashboards } from "@/modules/dashboard/dashboards";
import { navGroupsWithItems, navItems } from "@/modules/registry";
import { useTranslate } from "@/hooks/use-translate";

/**
 * Playground viewer identity. Dashboard access rules
 * ({@link canAccessDashboard}) treat `admin` as an all-pass role,
 * so today every dashboard passes the filter. When the real auth
 * layer lands only this constant swaps out — no other sidebar
 * wiring changes.
 */
const PLAYGROUND_VIEWER = { id: "playground-user", roles: ["admin"] as const };

/**
 * The nav-item name that owns the "/dashboard" route. Used to spot
 * the Overview → Dashboards entry so the pinned-dashboards submenu
 * can attach beneath it. Kept as a named constant instead of a
 * string literal at the call site so a future rename in the
 * dashboard module surfaces here.
 */
const DASHBOARDS_NAV_NAME = "dashboards";

/** True when the current URL sits underneath the given href. */
function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Case-insensitive substring match on both the label and the resource name. */
function matchesQuery(item: NavItem, query: string): boolean {
  if (!query) return true;

  const needle = query.toLowerCase();

  return item.label.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle);
}

/**
 * Access-filtered snapshot of the viewer's pinned custom dashboards,
 * ordered by `isDefault` first (so the default dashboard sits at the
 * top of the submenu) then by `updatedAt` desc.
 *
 * Isolated in a hook so the underlying `useDashboards` subscription
 * only runs inside the sidebar tree — cheap to render, subscribes
 * exactly once per mount.
 */
function useSidebarPinnedDashboards(): Dashboard[] {
  const { dashboards, shareGrants } = useDashboards();

  return useMemo(
    () =>
      dashboards
        .filter((entry) => entry.isPinned && !entry.isBuiltIn)
        .filter((entry) => canAccessDashboard(entry, shareGrants, PLAYGROUND_VIEWER))
        .slice()
        .sort((a, b) => {
          if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;

          return b.updatedAt.localeCompare(a.updatedAt);
        }),
    [dashboards, shareGrants],
  );
}

// ---------------------------------------------------------------------------
// Header — brand row + module filter
// ---------------------------------------------------------------------------

/**
 * Brand row rendered inside `Sidebar.Header`. Isotipo + wordmark on
 * the left, a settings icon-button on the right (matches the
 * AgentHub reference's Pencil affordance). The wordmark + settings
 * button collapse to icon-only when the sidebar is icon-collapsed.
 */
function SidebarBrandRow(): ReactNode {
  const { isOpen, isMobile } = useSidebar();
  const navigate = useNavigate();
  const t = useTranslate();
  const showLabels = isOpen || isMobile;

  return (
    <div className="flex h-10 items-center justify-between gap-2 px-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <BrandIsotipo className="size-7 shrink-0" height={28} width={28} />
        {showLabels ? (
          <span
            className="truncate text-sm font-semibold tracking-tight text-foreground"
            data-sidebar="label"
          >
            {brand.name}
          </span>
        ) : null}
      </div>
      {showLabels ? (
        <Tooltip>
          <Button
            aria-label={t("sidebar.header.settings", undefined, "Workspace settings")}
            className="size-7 shrink-0 text-muted hover:text-foreground"
            isIconOnly
            onPress={() => navigate("/settings")}
            size="sm"
            variant="ghost"
          >
            <Iconify className="size-3.5" icon="pencil-to-square" />
          </Button>
          <Tooltip.Content>
            {t("sidebar.header.settingsTooltip", undefined, "Workspace settings")}
          </Tooltip.Content>
        </Tooltip>
      ) : null}
    </div>
  );
}

/**
 * Module-filter SearchField bound to the parent's `query` state. Uses
 * the canonical `SearchField.Group → SearchField.Input` compound so
 * the input inherits the field's flex-1 wiring and focus ring — a
 * raw `<Input>` here would visually truncate at collapse boundaries.
 * Hidden when the sidebar is icon-collapsed to keep the rail tidy.
 */
function SidebarFilterSearch({
  query,
  onChange,
}: {
  query: string;
  onChange: (value: string) => void;
}): ReactNode {
  const { isOpen, isMobile } = useSidebar();
  const t = useTranslate();

  // WHY the isOpen guard: at icon-only widths the SearchField spills
  // outside the rail. Mobile always renders the full sidebar so
  // isMobile bypasses the guard.
  if (!isOpen && !isMobile) return null;

  return (
    <div className="mt-2" data-sidebar="label">
      <SearchField
        aria-label={t("sidebar.search.placeholder", undefined, "Filter modules")}
        onChange={onChange}
        value={query}
        variant="secondary"
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input
            placeholder={t("sidebar.search.placeholder", undefined, "Filter modules…")}
          />
          <SearchField.ClearButton onPress={() => onChange("")} />
        </SearchField.Group>
      </SearchField>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Menu actions — per-item dropdown + hover-visible pin toggle
// ---------------------------------------------------------------------------

/**
 * Props for {@link SidebarModuleActions}. Extracted as its own type
 * so the compound stays testable — feed a mock item + callbacks and
 * assert against the emitted dropdown items without touching the
 * real preference hooks.
 */
export interface SidebarModuleActionsProps {
  item: NavItem;
  isPinned: boolean;
  onTogglePin: (name: string) => void;
  onHide: (name: string) => void;
}

/**
 * The three-dot dropdown rendered inside every module row's
 * `Sidebar.MenuActions`. Exposes the full context-menu for a module:
 * pin/unpin, open in a new tab, copy the direct URL, and hide the
 * row from the sidebar (still reachable via ⌘K + URL).
 *
 * ## Why a real Dropdown and not a bare button stack
 * A dropdown is the only way to keep the row visually compact while
 * still offering four actions per module. HeroUI's `Dropdown.Trigger`
 * accepts any pressable child, so we plug a `Sidebar.MenuAction` in
 * as the trigger — it inherits the sidebar's own hover-reveal
 * animation and matches the star button's visual weight.
 */
export function SidebarModuleActions({
  item,
  isPinned,
  onTogglePin,
  onHide,
}: SidebarModuleActionsProps): ReactNode {
  const t = useTranslate();

  const handleAction = useCallback(
    (key: Key) => {
      const raw = String(key);

      // WHY switch/case (not if-chain): each action is entirely
      // self-contained and never falls through, so a lookup-style
      // branch reads best. Copy uses `navigator.clipboard` guarded
      // by feature-detection — clipboard is unavailable inside
      // sandboxed iframes and older Safari.
      switch (raw) {
        case "pin":
          onTogglePin(item.name);

          return;
        case "open-new-tab":
          window.open(item.href, "_blank", "noopener,noreferrer");

          return;
        case "copy-link": {
          const url = new URL(item.href, window.location.origin).toString();

          if (typeof navigator !== "undefined" && navigator.clipboard) {
            void navigator.clipboard.writeText(url);
          }

          return;
        }
        case "hide":
          onHide(item.name);

          return;
        default:
          return;
      }
    },
    [item.href, item.name, onHide, onTogglePin],
  );

  return (
    <Dropdown>
      {/*
       * WHY no <Dropdown.Trigger> wrapper: HeroUI Pro's Dropdown.Trigger
       * renders its own <button> element, so wrapping our Sidebar.MenuAction
       * (also a button) inside it produced a nested-button hydration error
       * ("<button> cannot be a descendant of <button>"). Passing the
       * MenuAction directly as a child of Dropdown lets the compound wire
       * the trigger props onto it without adding another button layer.
       */}
      <Sidebar.MenuAction aria-label={t("sidebar.actions.more", undefined, "More options")}>
        <Iconify className="size-3.5" icon="dots-3-horizontal" />
      </Sidebar.MenuAction>
      <Dropdown.Popover className="min-w-52" placement="right top">
        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Item id="pin" textValue={isPinned ? "Unpin" : "Pin"}>
            <Iconify className="size-4" icon={isPinned ? "star" : "star-fill"} />
            <Label>
              {isPinned
                ? t("sidebar.pin.remove", undefined, "Unpin from sidebar")
                : t("sidebar.pin.add", undefined, "Pin to sidebar")}
            </Label>
          </Dropdown.Item>
          <Dropdown.Item id="open-new-tab" textValue="Open in new tab">
            <Iconify className="size-4" icon="arrow-up-from-square" />
            <Label>{t("sidebar.actions.openNewTab", undefined, "Open in new tab")}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="copy-link" textValue="Copy link">
            <Iconify className="size-4" icon="link" />
            <Label>{t("sidebar.actions.copyLink", undefined, "Copy link")}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="hide" textValue="Hide from sidebar" variant="danger">
            <Iconify className="size-4" icon="circle-minus" />
            <Label>{t("sidebar.actions.hide", undefined, "Hide from sidebar")}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

// ---------------------------------------------------------------------------
// Group actions dropdown
// ---------------------------------------------------------------------------

/**
 * Group-level actions rendered next to the section label. Lets the
 * operator collapse a section entirely, or nudge it up/down the
 * sidebar. The move buttons short-circuit when the group is already
 * at the boundary — no visual flicker from a no-op reorder.
 */
function SidebarGroupActions({
  groupKey,
  isCollapsed,
  onToggleCollapsed,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  groupKey: string;
  isCollapsed: boolean;
  onToggleCollapsed: (key: string) => void;
  onMoveUp: (key: string) => void;
  onMoveDown: (key: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}): ReactNode {
  const t = useTranslate();

  const handleAction = useCallback(
    (key: Key) => {
      const raw = String(key);

      switch (raw) {
        case "collapse":
          onToggleCollapsed(groupKey);

          return;
        case "move-up":
          onMoveUp(groupKey);

          return;
        case "move-down":
          onMoveDown(groupKey);

          return;
        default:
          return;
      }
    },
    [groupKey, onMoveDown, onMoveUp, onToggleCollapsed],
  );

  // WHY disable move-up/down items via `disabledKeys` instead of
  // hiding them: keeps the menu shape stable so users don't hunt
  // for a disappearing entry when a group is at a boundary.
  const disabledKeys = useMemo(() => {
    const keys: string[] = [];

    if (!canMoveUp) keys.push("move-up");
    if (!canMoveDown) keys.push("move-down");

    return keys;
  }, [canMoveUp, canMoveDown]);

  return (
    <Dropdown>
      {/*
       * WHY no <Dropdown.Trigger> wrapper: same nested-<button> guard as
       * SidebarModuleActions above. Passing <Button> directly as a child
       * of Dropdown lets the compound bind the trigger props without
       * wrapping in another native button.
       */}
      <Button
        aria-label={t("sidebar.group.actions", undefined, "Section actions")}
        className="-me-1 size-5 rounded-md p-0 text-muted opacity-0 transition-opacity group-hover/sidebar-group:opacity-100 hover:bg-default/60 focus-visible:opacity-100"
        isIconOnly
        size="sm"
        variant="ghost"
      >
        <Iconify className="size-3" icon="dots-3-horizontal" />
      </Button>
      <Dropdown.Popover className="min-w-52" placement="right top">
        <Dropdown.Menu disabledKeys={disabledKeys} onAction={handleAction}>
          <Dropdown.Item id="collapse" textValue="Collapse section">
            <Iconify className="size-4" icon={isCollapsed ? "chevron-down" : "chevron-up"} />
            <Label>
              {isCollapsed
                ? t("sidebar.group.expand", undefined, "Expand section")
                : t("sidebar.group.collapse", undefined, "Collapse section")}
            </Label>
          </Dropdown.Item>
          <Dropdown.Item id="move-up" textValue="Move section up">
            <Iconify className="size-4" icon="arrow-up" />
            <Label>{t("sidebar.group.moveUp", undefined, "Move section up")}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="move-down" textValue="Move section down">
            <Iconify className="size-4" icon="arrow-down" />
            <Label>{t("sidebar.group.moveDown", undefined, "Move section down")}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

// ---------------------------------------------------------------------------
// Menu rows
// ---------------------------------------------------------------------------

/**
 * A regular resource nav row. Used for every module in every
 * canonical group, plus the "Pinned modules" section at the top.
 * The star toggle and dropdown live in `Sidebar.MenuActions` so
 * they auto-reveal on hover without stealing the click target.
 *
 * The trailing chip is a real `<Kbd>` (via {@link ShortcutKbd}) when
 * the module registers a `shortcuts.navigate`, so the pill matches
 * every other keyboard-shortcut affordance across the app. Modules
 * flagged `comingSoon` show a plain "Soon" chip instead — the two
 * states are mutually exclusive.
 */
function ModuleMenuItem({
  item,
  pathname,
  isPinned,
  onTogglePin,
  onHide,
}: {
  item: NavItem;
  pathname: string;
  isPinned: boolean;
  onTogglePin: (name: string) => void;
  onHide: (name: string) => void;
}): ReactNode {
  const t = useTranslate();
  const shortcut = item.shortcuts?.navigate;

  return (
    <Sidebar.MenuItem
      href={item.href}
      isCurrent={isCurrent(pathname, item.href)}
      tooltip={item.label}
    >
      <Sidebar.MenuIcon>
        <Iconify icon={item.icon ?? "circle"} />
      </Sidebar.MenuIcon>
      <Sidebar.MenuItemContent>
        <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
      </Sidebar.MenuItemContent>
      {item.comingSoon ? (
        <Sidebar.MenuChip>{t("sidebar.chip.soon", undefined, "Soon")}</Sidebar.MenuChip>
      ) : shortcut ? (
        <Sidebar.MenuChip>
          <ShortcutKbd shortcut={shortcut} />
        </Sidebar.MenuChip>
      ) : null}
      <Sidebar.MenuActions>
        {/*
         * WHY a quick-access star alongside the dropdown: pinning is
         * the single most-used action on a sidebar row, so we surface
         * it as a one-click affordance and mirror it inside the
         * dropdown for discoverability. The star toggles on press;
         * the dropdown reveals the rest of the module context menu.
         */}
        <Sidebar.MenuAction
          aria-label={
            isPinned
              ? t("sidebar.pin.remove", undefined, "Unpin from sidebar")
              : t("sidebar.pin.add", undefined, "Pin to sidebar")
          }
          onPress={() => onTogglePin(item.name)}
        >
          <Iconify className="size-3.5" icon={isPinned ? "star-fill" : "star"} />
        </Sidebar.MenuAction>
        <SidebarModuleActions
          isPinned={isPinned}
          item={item}
          onHide={onHide}
          onTogglePin={onTogglePin}
        />
      </Sidebar.MenuActions>
    </Sidebar.MenuItem>
  );
}

/**
 * A pinned custom-dashboard row rendered inside the Dashboards
 * submenu. Structurally identical to {@link ModuleMenuItem} so the
 * parent `Sidebar.Menu` invariant (every child is a MenuItem) holds.
 */
function DashboardMenuItem({
  dashboard,
  pathname,
}: {
  dashboard: Dashboard;
  pathname: string;
}): ReactNode {
  return (
    <Sidebar.MenuItem
      href={dashboardHref(dashboard)}
      isCurrent={isCurrent(pathname, dashboardHref(dashboard))}
      tooltip={dashboard.name}
    >
      <Sidebar.MenuIcon>
        <Iconify icon={dashboard.icon ?? "square-check"} />
      </Sidebar.MenuIcon>
      <Sidebar.MenuItemContent>
        <Sidebar.MenuLabel>{dashboard.name}</Sidebar.MenuLabel>
      </Sidebar.MenuItemContent>
      {dashboard.visibility === "shared" ? (
        <Iconify aria-label="Shared" className="size-3 opacity-60" icon="persons" />
      ) : null}
    </Sidebar.MenuItem>
  );
}

/**
 * The Overview → Dashboards row. When the viewer has pinned custom
 * dashboards, promotes into a parent `Sidebar.MenuItem` with a
 * `Sidebar.Submenu` block containing each dashboard as a child
 * MenuItem. Otherwise falls back to a plain module row.
 *
 * ## Submenu vs sibling
 * The HeroUI Pro Sidebar compound ships `Sidebar.Submenu` for
 * exactly this case — a parent row that both navigates AND expands.
 * The earlier build rendered custom dashboards as flat siblings
 * inside the same `Sidebar.Menu` (works, but no visual hierarchy).
 * Using Submenu keeps every direct child of the outer Menu a real
 * MenuItem (preserving the React 19 crash guard) while making the
 * relationship legible: "these are dashboards under Dashboards".
 */
function DashboardsMenuItemWithSubmenu({
  item,
  pathname,
  isPinned,
  onTogglePin,
  onHide,
  pinnedDashboards,
}: {
  item: NavItem;
  pathname: string;
  isPinned: boolean;
  onTogglePin: (name: string) => void;
  onHide: (name: string) => void;
  pinnedDashboards: readonly Dashboard[];
}): ReactNode {
  const t = useTranslate();
  const shortcut = item.shortcuts?.navigate;

  // WHY the fallback: if the viewer has no pinned custom dashboards,
  // rendering a Submenu wrapper produces an empty disclosure that
  // looks broken. Drop back to a plain MenuItem so the Dashboards
  // row behaves like any other module.
  if (pinnedDashboards.length === 0) {
    return (
      <ModuleMenuItem
        isPinned={isPinned}
        item={item}
        onHide={onHide}
        onTogglePin={onTogglePin}
        pathname={pathname}
      />
    );
  }

  return (
    <Sidebar.MenuItem
      href={item.href}
      isCurrent={isCurrent(pathname, item.href)}
      tooltip={item.label}
    >
      <Sidebar.MenuIcon>
        <Iconify icon={item.icon ?? "circle"} />
      </Sidebar.MenuIcon>
      <Sidebar.MenuItemContent>
        <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
        <Sidebar.MenuTrigger
          aria-label={t("sidebar.dashboards.expand", undefined, "Toggle pinned dashboards")}
        >
          <Sidebar.MenuIndicator />
        </Sidebar.MenuTrigger>
      </Sidebar.MenuItemContent>
      {item.comingSoon ? (
        <Sidebar.MenuChip>{t("sidebar.chip.soon", undefined, "Soon")}</Sidebar.MenuChip>
      ) : shortcut ? (
        <Sidebar.MenuChip>
          <ShortcutKbd shortcut={shortcut} />
        </Sidebar.MenuChip>
      ) : null}
      <Sidebar.MenuActions>
        <Sidebar.MenuAction
          aria-label={
            isPinned
              ? t("sidebar.pin.remove", undefined, "Unpin from sidebar")
              : t("sidebar.pin.add", undefined, "Pin to sidebar")
          }
          onPress={() => onTogglePin(item.name)}
        >
          <Iconify className="size-3.5" icon={isPinned ? "star-fill" : "star"} />
        </Sidebar.MenuAction>
        <SidebarModuleActions
          isPinned={isPinned}
          item={item}
          onHide={onHide}
          onTogglePin={onTogglePin}
        />
      </Sidebar.MenuActions>
      <Sidebar.Submenu>
        {pinnedDashboards.map((dashboard) => (
          <DashboardMenuItem
            key={`pinned-dashboard-${dashboard.id}`}
            dashboard={dashboard}
            pathname={pathname}
          />
        ))}
      </Sidebar.Submenu>
    </Sidebar.MenuItem>
  );
}

// ---------------------------------------------------------------------------
// Apps group — global actions rendered below the modules
// ---------------------------------------------------------------------------

/**
 * The `Apps` group rendered at the bottom of the content region.
 * Currently exposes the command palette and the keyboard-shortcut
 * sheet as first-class menu items so an operator can reach the
 * palette even when the sidebar has scroll focus. New global
 * actions (integrations, notifications root) land here.
 *
 * Each item is a real `Sidebar.MenuItem` (not a bare button) so it
 * inherits the sidebar's own hover/press theming.
 */
function SidebarAppsGroup({
  pathname,
  onOpenPalette,
}: {
  pathname: string;
  onOpenPalette: () => void;
}): ReactNode {
  const t = useTranslate();

  return (
    <Sidebar.Group className="group/sidebar-group">
      <div
        className="mb-1 flex items-center gap-1.5 px-2 text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
        data-sidebar="label"
      >
        <Sidebar.GroupLabel className="mb-0 flex-1 p-0">
          {t("sidebar.group.apps", undefined, "Apps")}
        </Sidebar.GroupLabel>
      </div>
      <Sidebar.Menu className="gap-0.5">
        <Sidebar.MenuItem
          onAction={onOpenPalette}
          tooltip={t("sidebar.apps.palette", undefined, "Command palette")}
        >
          <Sidebar.MenuIcon>
            <Iconify icon="magnifier" />
          </Sidebar.MenuIcon>
          <Sidebar.MenuItemContent>
            <Sidebar.MenuLabel>
              {t("sidebar.apps.palette", undefined, "Command palette")}
            </Sidebar.MenuLabel>
          </Sidebar.MenuItemContent>
          <Sidebar.MenuChip>
            <ShortcutKbd shortcut="Cmd+K" />
          </Sidebar.MenuChip>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem
          href="/notifications"
          isCurrent={isCurrent(pathname, "/notifications")}
          tooltip={t("sidebar.apps.notifications", undefined, "Notifications")}
        >
          <Sidebar.MenuIcon>
            <Iconify icon="bell" />
          </Sidebar.MenuIcon>
          <Sidebar.MenuItemContent>
            <Sidebar.MenuLabel>
              {t("sidebar.apps.notifications", undefined, "Notifications")}
            </Sidebar.MenuLabel>
          </Sidebar.MenuItemContent>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem
          href="/settings"
          isCurrent={isCurrent(pathname, "/settings")}
          tooltip={t("sidebar.apps.settings", undefined, "Settings")}
        >
          <Sidebar.MenuIcon>
            <Iconify icon="gear" />
          </Sidebar.MenuIcon>
          <Sidebar.MenuItemContent>
            <Sidebar.MenuLabel>
              {t("sidebar.apps.settings", undefined, "Settings")}
            </Sidebar.MenuLabel>
          </Sidebar.MenuItemContent>
          <Sidebar.MenuChip>
            <ShortcutKbd shortcut="G ," />
          </Sidebar.MenuChip>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Group>
  );
}

// ---------------------------------------------------------------------------
// Footer — command palette CTA + user dropdown
// ---------------------------------------------------------------------------

/**
 * The two-row footer. Top row is the AgentHub-style CTA: a wide
 * secondary "Open command palette" button + a small icon-only
 * companion (new dashboard). Bottom row is the user pill.
 *
 * When the sidebar collapses to icon width the CTA row shrinks to
 * a single icon-only palette trigger so the rail stays uncluttered.
 */
function SidebarFooterCta(): ReactNode {
  const { isOpen, isMobile } = useSidebar();
  const { open: openPalette } = useCommandPalette();
  const navigate = useNavigate();
  const t = useTranslate();
  const showLabels = isOpen || isMobile;

  if (!showLabels) {
    return (
      <div className="flex items-center justify-center py-1">
        <Tooltip>
          <Button
            aria-label={t("sidebar.footer.palette", undefined, "Open command palette")}
            isIconOnly
            onPress={openPalette}
            size="sm"
            variant="secondary"
          >
            <Iconify className="size-4" icon="magnifier" />
          </Button>
          <Tooltip.Content>
            {t("sidebar.footer.palette", undefined, "Open command palette")}
          </Tooltip.Content>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      <Button
        aria-label={t("sidebar.footer.palette", undefined, "Open command palette")}
        className="flex-1 justify-start gap-2"
        onPress={openPalette}
        size="sm"
        variant="secondary"
      >
        <Iconify className="size-4" icon="magnifier" />
        <span className="flex-1 truncate text-left" data-sidebar="label">
          {t("sidebar.footer.palette", undefined, "Open command palette")}
        </span>
        <ShortcutKbd shortcut="Cmd+K" />
      </Button>
      <Tooltip>
        <Button
          aria-label={t("sidebar.footer.newDashboard", undefined, "New dashboard")}
          isIconOnly
          onPress={() => navigate("/dashboard/new")}
          size="sm"
          variant="ghost"
        >
          <Iconify className="size-4" icon="square-plus" />
        </Button>
        <Tooltip.Content>
          {t("sidebar.footer.newDashboard", undefined, "New dashboard")}
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}

/**
 * User dropdown pinned to the bottom of the sidebar. Trigger is a
 * clickable pill with avatar + name + active branch label; the
 * popover exposes Profile / Settings / Create Team / Log Out.
 * The Log Out entry fires Refine's `useLogout` mutation.
 *
 * Guarded on `identity` so the pill collapses gracefully to a
 * skeleton while `useGetIdentity()` resolves.
 */
function SidebarUserDropdown(): ReactNode {
  const { isOpen, isMobile } = useSidebar();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const t = useTranslate();

  const canCreateTeam = useMemo(
    // WHY the wildcard check: the current permissions model treats
    // "*" as a superuser grant. Any explicit "team.create" grant
    // also unlocks the CTA — falls open for the playground admin.
    () =>
      identity?.permissions?.includes("*") === true ||
      identity?.permissions?.includes("team.create") === true,
    [identity?.permissions],
  );

  const handleAction = useCallback(
    (key: Key) => {
      const raw = String(key);

      switch (raw) {
        case "profile":
          navigate("/settings/profile");

          return;
        case "settings":
          navigate("/settings/general");

          return;
        case "create-team":
          navigate("/settings/teams/new");

          return;
        case "logout":
          logout();

          return;
        default:
          return;
      }
    },
    [logout, navigate],
  );

  const isCollapsed = !isOpen && !isMobile;

  return (
    <Dropdown>
      {/* WHY: Place the <Button> directly inside <Dropdown> — not
          wrapped in <Dropdown.Trigger>. HeroUI Pro's Dropdown
          compound wires the trigger props (`onPress`, `aria-*`,
          ref) onto the first pressable child automatically. Adding
          <Dropdown.Trigger> around it renders a second native
          <button> ancestor, which React 19 rejects with
          "<button> cannot be a descendant of <button>". Same
          pattern applied to SidebarModuleActions and
          SidebarGroupActions in this file, and previously to
          dashboard-tabs / sortable-widget. */}
      <Button
        aria-label={t("app.account", undefined, "Account")}
        className={
          "flex h-auto w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-default/60 " +
          (isCollapsed ? "justify-center" : "justify-start")
        }
        variant="ghost"
      >
        <Avatar className="size-8 shrink-0" color="accent" size="sm">
          {identity?.avatarUrl ? (
            <Avatar.Image alt={identity.name} src={identity.avatarUrl} />
          ) : null}
          <Avatar.Fallback>{identity?.initials ?? "?"}</Avatar.Fallback>
        </Avatar>
        {isCollapsed ? null : (
          <div className="min-w-0 flex-1" data-sidebar="label">
            <p className="truncate text-sm leading-tight font-medium text-foreground">
              {identity?.name ?? "—"}
            </p>
            <p className="truncate text-xs leading-tight text-muted">
              {identity?.workspace?.activeBranchName ?? identity?.email ?? ""}
            </p>
          </div>
        )}
        {isCollapsed ? null : (
          <Iconify className="size-4 shrink-0 text-muted" data-sidebar="label" icon="chevron-up" />
        )}
      </Button>
      <Dropdown.Popover className="min-w-56" placement="top start">
        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Item id="profile" textValue="Profile">
            <Iconify className="size-4" icon="person" />
            <Label>{t("app.userMenu.profile", undefined, "Profile")}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="settings" textValue="Settings">
            <Iconify className="size-4" icon="gear" />
            <Label>{t("app.userMenu.settings", undefined, "Settings")}</Label>
          </Dropdown.Item>
          {canCreateTeam ? (
            <Dropdown.Item id="create-team" textValue="Create team">
              <Iconify className="size-4" icon="persons" />
              <Label>{t("app.userMenu.createTeam", undefined, "Create team")}</Label>
            </Dropdown.Item>
          ) : null}
          <Dropdown.Item id="logout" textValue="Log out" variant="danger">
            <Iconify className="size-4" icon="arrow-right-from-square" />
            <Label>{t("app.userMenu.logout", undefined, "Log out")}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/**
 * A compact workspace-switcher row rendered above the user pill in
 * the sidebar footer. Shows the current workspace name + a chevron
 * that opens the switcher dropdown listing every workspace the
 * caller belongs to. Rendered inline (rather than nested inside the
 * user dropdown) so it stays discoverable without conflicting with
 * that dropdown's own state.
 *
 * Auto-hides when the sidebar is in icon-only mode so the collapsed
 * rail stays tight; the switcher is still reachable via the popover
 * trigger on the user avatar (Cmd+K flow), so no functionality is
 * lost.
 */
function WorkspaceSwitcherRow(): ReactNode {
  const { isOpen, isMobile } = useSidebar();
  const { workspaces } = useMyWorkspaces();
  const currentContext = useMemo(() => resolveWorkspace(), []);

  // Hide in icon-only mode + when the caller has only one
  // workspace (nothing to switch to).
  if ((!isOpen && !isMobile) || workspaces.length <= 1) return null;

  const currentSlug = currentContext.mode === "tenant" ? currentContext.slug : null;
  const current = workspaces.find((entry) => entry.slug === currentSlug);

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted">
      <Iconify className="size-3.5 shrink-0" icon="rocket" />
      <span className="truncate font-medium">{current?.name ?? currentSlug ?? "Workspace"}</span>
      <div className="ms-auto">
        <WorkspaceSwitcher />
      </div>
    </div>
  );
}

/**
 * The complete sidebar body, shared between the desktop `<Sidebar>`
 * and the mobile `<Sidebar.Mobile>` sheet. Owns:
 *
 *   • filter query state
 *   • pinned + hidden module preferences
 *   • per-user group order + collapse preferences
 *   • pinned custom-dashboards submenu
 *
 * All preferences are localStorage-backed via the hooks in
 * `@/hooks/*`, so the same body renders identically in both
 * variants and picks up state on mount.
 */
function SidebarBody(): ReactNode {
  const { pathname } = useLocation();
  const t = useTranslate();
  const { open: openPalette } = useCommandPalette();
  const [query, setQuery] = useState("");
  const { pinned, isPinned, toggle: togglePin } = usePinnedModules();
  const { isHidden, hide } = useHiddenModules();
  const { order, moveGroupUp, moveGroupDown, isCollapsed, toggleCollapsed } =
    useSidebarGroupPrefs();
  const pinnedDashboards = useSidebarPinnedDashboards();

  /** Canonical group ordering derived from the module registry. */
  const canonicalGroupOrder = useMemo(() => navGroups.map((group) => group.key as string), []);

  /**
   * User-overridden group order applied on top of the canonical
   * order. `applyGroupOrder` places user picks first (preserving
   * their arrangement) and appends any group the user hasn't
   * touched — new modules land in a stable canonical position
   * even after the user has reordered.
   */
  const effectiveGroupOrder = useMemo(
    () => applyGroupOrder(canonicalGroupOrder, order),
    [canonicalGroupOrder, order],
  );

  /**
   * Hydrate pinned-module names into their nav items. `navItems`
   * is generated from the registry so a name may become stale if
   * a module is removed — filter those out with a type guard.
   */
  const pinnedItems = useMemo<NavItem[]>(
    () =>
      pinned
        .map((name) => navItems.find((entry) => entry.name === name))
        .filter((entry): entry is NavItem => Boolean(entry))
        .filter((entry) => !isHidden(entry.name)),
    [pinned, isHidden],
  );

  /**
   * Filtered canonical groups. The filter chain is:
   *
   *   1. exclude modules the user has hidden
   *   2. keep only items matching the search query
   *   3. drop groups that ended up empty
   *   4. reorder groups per the user override
   */
  const filteredGroups = useMemo<NavGroupWithItems[]>(() => {
    const filtered = navGroupsWithItems
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => !isHidden(item.name))
          .filter((item) => matchesQuery(item, query)),
      }))
      .filter((group) => group.items.length > 0);

    // WHY re-sort here: the reorder override is a permutation of
    // group keys, so we sort in a single pass using the effective
    // order as an index lookup. Groups missing from the effective
    // order (impossible today, defensive) sink to the end.
    return filtered.slice().sort((a, b) => {
      const ai = effectiveGroupOrder.indexOf(a.key as string);
      const bi = effectiveGroupOrder.indexOf(b.key as string);

      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [effectiveGroupOrder, isHidden, query]);

  const filteredPinned = pinnedItems.filter((item) => matchesQuery(item, query));

  const filteredPinnedDashboards = query
    ? pinnedDashboards.filter((entry) => entry.name.toLowerCase().includes(query.toLowerCase()))
    : pinnedDashboards;

  return (
    <>
      <Sidebar.Header>
        <SidebarBrandRow />
        <SidebarFilterSearch onChange={setQuery} query={query} />
      </Sidebar.Header>

      <Sidebar.Content className="gap-3 px-2 py-3">
        {filteredPinned.length > 0 ? (
          <Sidebar.Group className="group/sidebar-group mb-1">
            <div
              className="mb-1 flex items-center gap-1.5 px-2 text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
              data-sidebar="label"
            >
              <Iconify className="size-3.5" icon="star-fill" />
              <Sidebar.GroupLabel className="mb-0 flex-1 p-0">
                {t("sidebar.group.pinned", undefined, "Pinned")}
              </Sidebar.GroupLabel>
            </div>
            <Sidebar.Menu className="gap-0.5">
              {filteredPinned.map((item) => (
                <ModuleMenuItem
                  key={`pinned-${item.name}`}
                  isPinned
                  item={item}
                  onHide={hide}
                  onTogglePin={togglePin}
                  pathname={pathname}
                />
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
        ) : null}

        {filteredGroups.map((group, index) => {
          const groupKey = group.key as string;
          const collapsed = isCollapsed(groupKey);
          const isOverview = group.key === "overview";
          const canMoveUp = index > 0;
          const canMoveDown = index < filteredGroups.length - 1;

          return (
            <Sidebar.Group key={groupKey} className="group/sidebar-group">
              <div
                className="mb-1 flex items-center gap-1.5 px-2 text-[11px] font-medium tracking-[0.08em] text-muted uppercase"
                data-sidebar="label"
              >
                <Sidebar.GroupLabel className="mb-0 flex-1 p-0">
                  {t(group.labelKey, undefined, groupKey)}
                </Sidebar.GroupLabel>
                <SidebarGroupActions
                  canMoveDown={canMoveDown}
                  canMoveUp={canMoveUp}
                  groupKey={groupKey}
                  isCollapsed={collapsed}
                  onMoveDown={(key) => moveGroupDown(key, canonicalGroupOrder)}
                  onMoveUp={(key) => moveGroupUp(key, canonicalGroupOrder)}
                  onToggleCollapsed={toggleCollapsed}
                />
              </div>
              {collapsed ? null : (
                <Sidebar.Menu className="gap-0.5">
                  {group.items.map((item) => {
                    // WHY special-case the Dashboards row inside
                    // Overview: pinned custom dashboards nest
                    // underneath it as a proper Submenu so the
                    // hierarchy reads "Dashboards → my dashboard"
                    // instead of "Dashboards" + a flat sibling
                    // list. Falls back to a plain row when the
                    // viewer has no pinned custom dashboards.
                    if (isOverview && item.name === DASHBOARDS_NAV_NAME) {
                      return (
                        <DashboardsMenuItemWithSubmenu
                          key={item.name}
                          isPinned={isPinned(item.name)}
                          item={item}
                          onHide={hide}
                          onTogglePin={togglePin}
                          pathname={pathname}
                          pinnedDashboards={filteredPinnedDashboards}
                        />
                      );
                    }

                    return (
                      <ModuleMenuItem
                        key={item.name}
                        isPinned={isPinned(item.name)}
                        item={item}
                        onHide={hide}
                        onTogglePin={togglePin}
                        pathname={pathname}
                      />
                    );
                  })}
                </Sidebar.Menu>
              )}
            </Sidebar.Group>
          );
        })}

        {/*
         * WHY the separator lives OUTSIDE the last canonical group:
         * dropping it inside the group's children would push it up
         * with the collapse toggle and break the visual rhythm on
         * every reorder. Rendering it inline between groups (only
         * when there IS a canonical group above and an Apps group
         * below) keeps the AgentHub reference silhouette intact.
         */}
        {filteredGroups.length > 0 || filteredPinned.length > 0 ? <Sidebar.Separator /> : null}

        <SidebarAppsGroup onOpenPalette={openPalette} pathname={pathname} />

        {filteredGroups.length === 0 && filteredPinned.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted" data-sidebar="label">
            <Chip size="sm" variant="soft">
              <Chip.Label>{t("app.emptyState.title", undefined, "No records found")}</Chip.Label>
            </Chip>
          </div>
        ) : null}
      </Sidebar.Content>

      <Sidebar.Separator />

      <Sidebar.Footer className="gap-1 px-2 py-2">
        <WorkspaceSwitcherRow />
        <SidebarFooterCta />
        <SidebarUserDropdown />
      </Sidebar.Footer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

/**
 * Compact spacing + width tokens applied to the sidebar root.
 *
 * Pulled out as a constant so both the desktop and mobile variants
 * stay in sync. Two tokens are set:
 *
 * - `--spacing` — HeroUI Pro's Sidebar reads it for row rhythm.
 *   `0.3rem` gives the menu column a touch of breathing room while
 *   staying denser than the library's `1rem` default. Also feeds
 *   `--sidebar-menu-indent` (× 4) so nested rows keep a clear
 *   parent/child hierarchy.
 * - `--sidebar-width` — HeroUI Pro's expanded-sidebar width token
 *   (default `240px` per the Sidebar component docs, "CSS Variables"
 *   section). Bumped to `18.5rem` (`296px`) so multi-word module
 *   labels ("Public site", "Sports registrations", "Usage &
 *   Entitlements") and their trailing badges fit on one line at
 *   typical zoom levels without cramping the page column.
 *
 * The `as CSSProperties` cast is needed because TypeScript's
 * built-in CSSProperties type doesn't index arbitrary custom
 * properties — the token names are safe (verified against the
 * Sidebar docs) so a widened cast is the minimum-friction way.
 */
const SIDEBAR_SPACING_STYLE: CSSProperties = {
  "--spacing": "0.3rem",
  "--sidebar-width": "18.5rem",
} as CSSProperties;

/**
 * The top-level sidebar. Two `<SidebarBody>` instances: one inside
 * `<Sidebar>` for the desktop rail, one inside `<Sidebar.Mobile>` for
 * the mobile drawer. Both share their preference sources because
 * every hook underneath reads from the same localStorage keys.
 *
 * The `<Sidebar.Rail />` inside the desktop variant provides the
 * click/drag handle for toggling the collapsed state — a native
 * companion to `sidebarCollapsible="icon"` on AppLayout.
 *
 * ## No Sidebar.Provider wrapper
 * `AppLayout` (from `@heroui-pro/react`) provisions the
 * `Sidebar.Provider` implicitly when it receives `sidebar={...}`.
 * Wrapping again here would create a nested provider whose
 * `useSidebar()` hook would read the wrong scope. Keep the
 * component provider-free; the shell owns the tree.
 */
export function AppSidebar(): ReactNode {
  return (
    <>
      <Sidebar style={SIDEBAR_SPACING_STYLE}>
        <SidebarBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <SidebarBody />
      </Sidebar.Mobile>
    </>
  );
}

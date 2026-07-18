/**
 * @file context-menu.tsx
 * @module menus/context-menu
 *
 * @description
 * Visual renderer for {@link useContextMenu}'s open-state. Consumes the hook
 * output verbatim — the caller mounts one `<ContextMenu>` alongside the
 * element that carries the hook, then hides itself when `isOpen` is false.
 *
 * ## Composition contract
 *
 *   const anchor = useRef<HTMLDivElement>(null);
 *   const menu = useContextMenu(anchor, { items });
 *   return (
 *     <div ref={anchor}>…row content…</div>
 *     <ContextMenu {...menu} />
 *   );
 *
 * The renderer is intentionally a separate component: it lets a consumer
 * decorate the visual (arrow, tooltip, extra footer) without touching the
 * hook, and it lets the hook stay 100% pure/behavioural for testing.
 *
 * ## Positioning strategy
 *
 * HeroUI's `Popover.Content` primitive is a wrapper around React Aria's
 * `Popover` which accepts a `triggerRef`. We render a **zero-size, absolute-
 * positioned invisible anchor** at the pointer coordinates and hand its ref
 * to the popover. React Aria then positions the popover relative to the
 * anchor via `useOverlayPosition`, giving us edge-flipping, scroll tracking,
 * and RTL support for free — HeroUI passes `dir="rtl"` through the DOM tree
 * and the positioner honours it automatically.
 *
 * The anchor is portalled to `document.body` (via HeroUI's Popover portal
 * default) so the menu escapes any `overflow: hidden` ancestor.
 *
 * ## Grouping + overflow
 *
 * Items are grouped by category (`groupByCategory`) with a `Separator`
 * between adjacent groups. When the total item count exceeds
 * `TOP_LEVEL_LIMIT` (12 items), everything past the cap lands
 * under an inline "More…" section — kept as its own group with a divider
 * so the visible top-level items still render their category headings. We
 * deliberately do NOT use a real nested submenu here: HeroUI's submenu
 * primitive (`Dropdown.SubmenuTrigger`) is scoped to a `Dropdown` context
 * that our context-menu Popover does not provide, so we fold overflow into
 * a flat section instead. If a deployment grows past this trade-off, we
 * upgrade to a full `Dropdown` wrapper (TODO: revisit when a customer hits
 * the cap consistently).
 *
 * ## React Aria collection constraints
 *
 * `MenuSection` is a **collection wrapper** — the React Aria collection
 * walker only recognises `Header`, `MenuItem`, and `Separator` descendants.
 * A stray `<div>` inside a `MenuSection` blows the walker up silently: the
 * whole section renders empty (including sibling `MenuItem`s). We therefore
 * use HeroUI's `Header` (a thin wrapper around `react-aria-components/Header`)
 * for the category label and forward `data-testid` through it, and we keep
 * separators between sections rather than inside them.
 *
 * ## `isDisabled` memoisation
 *
 * `command.isDisabled(ctx)` is invoked ONCE per open cycle — resolved on the
 * first render and stored in a ref keyed by command id. This prevents a
 * flicker where the item briefly renders as enabled before the predicate
 * settles, which happens when the predicate reads from an async data source
 * (React Query cache warming up mid-open).
 */

import { Header, Menu, MenuItem, MenuSection, Popover, Separator } from "@stackra/ui/react";
import { Fragment, useMemo, useRef } from "react";

import type { MenuCategory, MenuCommand, MenuContext, ShortcutOs } from "@/lib/menus/command.types";
import type { ContextMenuPosition } from "@/lib/menus/use-context-menu";
import type { CSSProperties, Key, ReactNode, RefObject } from "react";

import { detectOs } from "@/config/shortcuts.config";
import { groupByCategory, resolveShortcutDisplay } from "@/lib/menus/registry-helpers";

/**
 * Maximum items rendered at the top level before overflow triggers a
 * "More…" section. Exported so tests can assert against it without
 * magic numbers.
 */
export const TOP_LEVEL_LIMIT = 12;

/** Props for {@link ContextMenu}. Mirrors `useContextMenu`'s return shape. */
export interface ContextMenuProps {
  /** Whether the menu is open. Drives Popover mount + focus behaviour. */
  isOpen: boolean;
  /** Pointer-relative position. Consumed as a fixed-position anchor. */
  position: ContextMenuPosition;
  /** The commands to render. */
  items: readonly MenuCommand[];
  /** The snapshot of context for the current open cycle. */
  context: MenuContext;
  /** Close callback fired on Escape / outside-click / item activation. */
  close: () => void;
  /**
   * OS override for shortcut glyphs. Defaults to auto-detected. Tests pass
   * `"mac"` / `"windows"` / `"linux"` to assert stable output.
   */
  os?: ShortcutOs;
  /**
   * Optional translator — invoked with each command's `labelKey` so the
   * consumer can localise. Defaults to identity (renders the key). The
   * shell wires this to Refine's `useTranslate()` at the mount site.
   */
  translate?: (key: string) => string;
}

/**
 * Fallback labels for menu categories rendered as section headings. The
 * message catalog is authoritative — a section heading only shows when
 * `useTranslate` returns the label for `menu.category.<key>`. Rendering
 * strings here directly (in English) keeps the shell functional if a
 * translation key is missing (typical during initial rollout).
 */
const CATEGORY_LABEL: Record<MenuCategory, string> = {
  application: "Application",
  file: "File",
  edit: "Edit",
  view: "View",
  workspace: "Workspace",
  navigate: "Go to",
  action: "Actions",
  help: "Help",
  developer: "Developer",
};

/**
 * Renderer for the context menu popover. Reads the hook's state and returns
 * `null` when closed so the DOM stays clean in the common case.
 */
export function ContextMenu({
  isOpen,
  position,
  items,
  context,
  close,
  os,
  translate = (key) => key,
}: ContextMenuProps): ReactNode {
  // The anchor is a zero-sized invisible div positioned at the pointer
  // coordinates. `Popover.Content` reads its `triggerRef` and positions the
  // popover relative to the anchor's bounding box.
  const anchorRef = useRef<HTMLDivElement>(null);

  // Freeze `isDisabled(ctx)` results at open time so predicates that read
  // async state don't flicker mid-render. Recomputed on every `isOpen`
  // transition or `items` change (both correlate with a fresh open cycle).
  const disabledMap = useMemo(() => {
    if (!isOpen) {
      return new Map<string, boolean>();
    }

    const map = new Map<string, boolean>();

    for (const command of items) {
      map.set(command.id, command.isDisabled ? command.isDisabled(context) : false);
    }

    return map;
  }, [isOpen, items, context]);

  const grouped = useMemo(() => groupByCategory(items), [items]);
  const resolvedOs = os ?? detectOs();

  // Split top-level items from overflow. Categories that fit stay; the
  // over-cap tail rolls into its own group.
  const { visible, overflow } = useMemo(() => splitOverflow(grouped, TOP_LEVEL_LIMIT), [grouped]);
  const visibleEntries = useMemo(() => [...visible.entries()], [visible]);

  const handleAction = (key: Key): void => {
    const command = items.find((entry) => entry.id === String(key));

    if (!command) {
      return;
    }

    // Closing BEFORE execute keeps the popover from lingering on top of a
    // subsequent navigation — feels snappier.
    close();
    // `void` — execute is fire-and-forget from the renderer's perspective;
    // the caller handles its own errors inside the callback.
    void Promise.resolve(command.execute(context));
  };

  return (
    <>
      {/* Positioned invisible anchor. `pointer-events: none` so it never
          catches clicks; the fixed position tracks the pointer so React
          Aria's positioner places the popover directly at the click site. */}
      <VirtualAnchor anchorRef={anchorRef} position={position} />

      {isOpen ? (
        <Popover.Content
          isOpen
          className="bg-content1 max-w-[320px] min-w-[220px] rounded-lg border border-border py-1 shadow-lg"
          data-testid="context-menu-popover"
          offset={2}
          placement="bottom start"
          triggerRef={anchorRef}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              close();
            }
          }}
        >
          <Popover.Dialog aria-label="Context menu" className="outline-none">
            <Menu
              aria-label="Context menu"
              // Context menus are triggered by an explicit user gesture
              // (right-click) and MUST focus their first actionable item so
              // keyboard users can drive them without an extra Tab press.
              // HeroUI's Menu uses this to wire ArrowUp/Down key handling
              // correctly.
              autoFocus="first" // eslint-disable-line jsx-a11y/no-autofocus
              className="flex flex-col gap-0.5 p-1 outline-none"
              onAction={handleAction}
              onClose={close}
            >
              {visibleEntries.map(([category, groupItems], index) => (
                <Fragment key={category}>
                  {index === 0 ? null : (
                    <Separator
                      aria-hidden="true"
                      className="my-1 h-px w-full bg-border"
                      data-testid={`context-menu-separator-${category}`}
                    />
                  )}
                  <MenuSection className="flex flex-col gap-0.5">
                    <Header
                      className="px-2 py-1 text-xs font-medium tracking-wide text-muted uppercase"
                      data-testid={`context-menu-heading-${category}`}
                    >
                      {CATEGORY_LABEL[category]}
                    </Header>
                    {groupItems.map((command) =>
                      renderMenuItem({ command, disabledMap, os: resolvedOs, translate }),
                    )}
                  </MenuSection>
                </Fragment>
              ))}

              {overflow.length > 0 ? (
                <Fragment key="__overflow">
                  {visibleEntries.length > 0 ? (
                    <Separator
                      aria-hidden="true"
                      className="my-1 h-px w-full bg-border"
                      data-testid="context-menu-separator-overflow"
                    />
                  ) : null}
                  <MenuSection className="flex flex-col gap-0.5">
                    <Header
                      className="px-2 py-1 text-xs font-medium tracking-wide text-muted uppercase"
                      data-testid="context-menu-heading-overflow"
                    >
                      More
                    </Header>
                    {overflow.map((command) =>
                      renderMenuItem({ command, disabledMap, os: resolvedOs, translate }),
                    )}
                  </MenuSection>
                </Fragment>
              ) : null}
            </Menu>
          </Popover.Dialog>
        </Popover.Content>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Internal render helpers
// ---------------------------------------------------------------------------

/** Fixed-position invisible anchor. Rendered as a portal-friendly div. */
function VirtualAnchor({
  anchorRef,
  position,
}: {
  anchorRef: RefObject<HTMLDivElement | null>;
  position: ContextMenuPosition;
}): ReactNode {
  // `fixed` so the anchor tracks the viewport (not any scrolling ancestor);
  // React Aria's positioner will pick this up and place the popover directly
  // below the pointer. Zero size + no pointer events keep the anchor
  // completely invisible.
  const style: CSSProperties = {
    position: "fixed",
    top: position.y,
    left: position.x,
    width: 0,
    height: 0,
    pointerEvents: "none",
  };

  return <div ref={anchorRef} aria-hidden="true" data-testid="context-menu-anchor" style={style} />;
}

/** Renders a single menu item — label on the left, shortcut on the right. */
function renderMenuItem({
  command,
  disabledMap,
  os,
  translate,
}: {
  command: MenuCommand;
  disabledMap: Map<string, boolean>;
  os: ShortcutOs;
  translate: (key: string) => string;
}): ReactNode {
  const shortcut = resolveShortcutDisplay(command, os);
  const isDisabled = disabledMap.get(command.id) ?? false;
  const label = translate(command.labelKey);

  return (
    <MenuItem
      key={command.id}
      className="flex cursor-default items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[focused]:bg-default/60"
      data-testid={`context-menu-item-${command.id}`}
      id={command.id}
      isDisabled={isDisabled}
      textValue={label}
    >
      <span className="flex flex-1 items-center gap-2 text-left">
        {command.icon ? <command.icon className="size-4 text-muted" /> : null}
        <span className="truncate">{label}</span>
      </span>
      {shortcut ? (
        <span className="ms-4 shrink-0 text-xs text-muted tabular-nums">{shortcut}</span>
      ) : null}
    </MenuItem>
  );
}

// ---------------------------------------------------------------------------
// Overflow splitting
// ---------------------------------------------------------------------------

/**
 * Splits a grouped map into the top-level items (< limit) and an overflow
 * bucket that spills into a "More…" section. Exported for tests.
 *
 * The split walks categories in insertion order (which matches
 * `MENU_CATEGORY_ORDER` because that's what `groupByCategory` returns) and
 * fills the top-level bucket until it hits the cap. Once a category would
 * push the bucket over the cap, its remaining items — and every following
 * category's items — flow into the overflow.
 *
 * We intentionally split at category boundaries only for the FIRST group
 * that fits partially: dropping half a category into overflow feels
 * arbitrary, but the first over-cap slice preserves the "most important
 * categories are visible" heuristic.
 */
export function splitOverflow(
  grouped: Map<MenuCategory, MenuCommand[]>,
  limit: number,
): {
  visible: Map<MenuCategory, MenuCommand[]>;
  overflow: MenuCommand[];
} {
  const visible = new Map<MenuCategory, MenuCommand[]>();
  const overflow: MenuCommand[] = [];
  let count = 0;

  for (const [category, items] of grouped) {
    if (count >= limit) {
      // Already over — everything spills.
      overflow.push(...items);
      continue;
    }

    const remaining = limit - count;

    if (items.length <= remaining) {
      visible.set(category, items);
      count += items.length;
    } else {
      // Fill what we can, spill the rest.
      const head = items.slice(0, remaining);
      const tail = items.slice(remaining);

      if (head.length > 0) {
        visible.set(category, head);
      }

      overflow.push(...tail);
      count = limit;
    }
  }

  return { visible, overflow };
}

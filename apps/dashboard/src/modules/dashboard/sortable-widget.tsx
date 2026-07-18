/**
 * @file sortable-widget.tsx
 * @module modules/dashboard/sortable-widget
 *
 * @description
 * A single sortable tile in the dashboard grid. Composes:
 *
 *   * `useSortable` from `@dnd-kit` for drag-to-reorder (edit mode).
 *   * A hover-triggered actions menu (⋮⋮ drag handle + `⋯` overflow
 *     menu with Duplicate / Resize / Copy embed / Remove) so power
 *     users get instrumentation without a global toolbar.
 *   * A size chip toggle (⅓ / ½ / ⅔ / full) exposed while editing,
 *     so widgets can be re-sized without opening the customise
 *     panel.
 *
 * The widget renders through the shared `renderWidget` dispatch so
 * the same component powers the editable canvas AND the public
 * embed viewer. Read-only surfaces skip every affordance.
 */

import { Button, Chip, Dropdown, Label, Popover, Tooltip } from "@heroui/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useState } from "react";

import type { Key, ReactNode } from "react";
import type { WidgetAnnotation } from "@/modules/dashboard/dashboards";

import { Iconify } from "@/icons/iconify";
import { WidgetAnnotationsPopoverContent } from "@/modules/dashboard/components/widget-annotations-popover";
import { findWidget } from "@/modules/dashboard/widgets.catalogue";
import { renderWidget } from "@/modules/dashboard/widget-renderer";

/**
 * Widget size preset — maps to a CSS-grid `col-span-*` shorthand.
 * Kept as literal strings so consumers can persist them in widget
 * `config._size` without inventing a new enum.
 */
export type WidgetSize = "third" | "half" | "twoThirds" | "full";

const SPAN_CLASS: Record<WidgetSize, string> = {
  third: "col-span-1 md:col-span-1 lg:col-span-1",
  half: "col-span-1 md:col-span-2 lg:col-span-2",
  twoThirds: "col-span-1 md:col-span-2 lg:col-span-2",
  full: "col-span-1 md:col-span-2 lg:col-span-3",
};

const SIZE_LABEL: Record<WidgetSize, string> = {
  third: "⅓",
  half: "½",
  twoThirds: "⅔",
  full: "1×",
};

const SIZE_TOOLTIP: Record<WidgetSize, string> = {
  third: "One-third width",
  half: "Half width",
  twoThirds: "Two-thirds width",
  full: "Full width",
};

/**
 * Convert the catalogue's `span` hint into our richer four-way
 * preset. The catalogue predates the size toggle so it only knows
 * three widths.
 */
function spanToSize(span: "full" | "half" | "third" | undefined): WidgetSize {
  switch (span) {
    case "full":
      return "full";
    case "half":
      return "half";
    default:
      return "third";
  }
}

export interface SortableWidgetProps {
  /** Instance id used as the sortable key + stable react-grid handle. */
  widgetInstanceId: string;
  widgetKey: string;
  isEditing: boolean;
  /**
   * Current widget size preset. Wins over the catalogue's default
   * span hint. Persisted through widget `config._size`.
   */
  size?: WidgetSize;
  /**
   * Whether the widget is currently the keyboard-nav selection
   * (task F5). Selected widgets show a solid, brighter outline and
   * keep the toolbar affordances visible without a hover — so
   * keyboard-only users can see focus + affordances at a glance.
   */
  isSelected?: boolean;
  /**
   * Whether this widget carries a per-instance filter override
   * (task F3). When true, a small "Filtered" chip appears in the
   * top-left overlay so the operator can spot at a glance which
   * tiles ignore the dashboard-wide filters.
   */
  hasFilters?: boolean;
  /**
   * Comment count attached to this widget instance (task G2).
   * When > 0, a small pill with the count is rendered in the
   * top-left corner. Visible in **every mode**, not just editing,
   * so the operator can review the thread without opening the
   * customise panel first.
   */
  commentCount?: number;
  /**
   * Annotations already filtered to this widget instance
   * (task G2). Passed through to the popover content so the
   * canvas is the single source of truth. Undefined means the
   * canvas hasn't opted into annotations — the pill + popover
   * are skipped even when `commentCount` is set.
   */
  annotationsForWidget?: readonly WidgetAnnotation[];
  /** Read-only guard forwarded to the annotations popover. */
  isAnnotationsReadOnly?: boolean;
  /** Add a new annotation on this widget. */
  onAddAnnotation?: (body: string) => Promise<WidgetAnnotation>;
  /** Edit an existing annotation on this widget. */
  onUpdateAnnotation?: (annotationId: string, body: string) => Promise<WidgetAnnotation>;
  /** Delete an annotation on this widget. */
  onRemoveAnnotation?: (annotationId: string) => Promise<void>;
  onRemove: (widgetInstanceId: string) => void;
  onDuplicate?: (widgetInstanceId: string) => void;
  onResize?: (widgetInstanceId: string, size: WidgetSize) => void;
  onCopyLink?: (widgetInstanceId: string) => void;
  /**
   * Open the widget-level filter drawer (task F3). Fired when the
   * user picks "Filter widget…" from the overflow menu.
   */
  onOpenFilters?: (widgetInstanceId: string) => void;
  /**
   * Open the widget annotations popover (task G2). Fired when the
   * user clicks the comment pill or picks "Comments…" from the
   * overflow menu.
   */
  onOpenComments?: (widgetInstanceId: string) => void;
}

export function SortableWidget({
  widgetInstanceId,
  widgetKey,
  isEditing,
  size,
  isSelected = false,
  hasFilters = false,
  commentCount = 0,
  annotationsForWidget,
  isAnnotationsReadOnly = false,
  onAddAnnotation,
  onUpdateAnnotation,
  onRemoveAnnotation,
  onRemove,
  onDuplicate,
  onResize,
  onCopyLink,
  onOpenFilters,
  onOpenComments,
}: SortableWidgetProps): ReactNode {
  const entry = findWidget(widgetKey);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widgetInstanceId,
    disabled: !isEditing,
  });

  const content = renderWidget(widgetKey);

  // WHY: Popover open state is owned locally so both the comment
  // pill (Popover.Trigger) and the "Comments…" overflow menu item
  // resolve to the same controlled surface. Kept as plain state so
  // the read/write paths stay symmetric — the trigger goes through
  // `onOpenChange`, the menu goes through `setCommentsOpen(true)`.
  const [commentsOpen, setCommentsOpen] = useState(false);

  if (!entry || !content) return null;

  const resolvedSize: WidgetSize = size ?? spanToSize(entry.span);

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const outer = [
    SPAN_CLASS[resolvedSize],
    "group/widget relative rounded-2xl transition-[outline,box-shadow]",
    isEditing
      ? isSelected
        ? // Keyboard-nav selected → solid, bright accent, thicker offset.
          "outline outline-2 outline-solid outline-accent outline-offset-4 shadow-[0_0_0_1px_rgb(var(--color-accent))] focus:outline-solid"
        : "outline outline-2 outline-dashed outline-accent/60 outline-offset-4 hover:outline-solid"
      : "outline outline-0",
    isDragging ? "shadow-lg" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleMenuAction = (key: Key): void => {
    const action = String(key);

    if (action === "remove") onRemove(widgetInstanceId);
    else if (action === "duplicate") onDuplicate?.(widgetInstanceId);
    else if (action === "copy-link") onCopyLink?.(widgetInstanceId);
    else if (action === "filter") onOpenFilters?.(widgetInstanceId);
    else if (action === "comments") {
      // Route the "Comments…" menu action through the same local
      // state the pill uses so the popover opens even when the
      // thread is empty (commentCount === 0 hides the pill).
      setCommentsOpen(true);
      onOpenComments?.(widgetInstanceId);
    } else if (action.startsWith("size:")) {
      const nextSize = action.slice("size:".length) as WidgetSize;

      onResize?.(widgetInstanceId, nextSize);
    }
  };

  // WHY: Predicate for whether we can render annotations UI at
  // all. Requires the canvas to have plumbed the callbacks and the
  // filtered annotation list — otherwise the pill would open a
  // broken popover that couldn't add / edit / delete anything.
  const canRenderAnnotations = Boolean(
    annotationsForWidget && onAddAnnotation && onUpdateAnnotation && onRemoveAnnotation,
  );

  // Render the annotations popover content once so the JSX tree
  // stays flat + we don't recompute the filter on every re-render.
  const annotationsContent = canRenderAnnotations ? (
    <WidgetAnnotationsPopoverContent
      annotations={annotationsForWidget ?? []}
      isReadOnly={isAnnotationsReadOnly}
      onAdd={onAddAnnotation as (body: string) => Promise<never>}
      onRemove={onRemoveAnnotation as (id: string) => Promise<void>}
      onUpdate={onUpdateAnnotation as (id: string, body: string) => Promise<never>}
      widgetInstanceId={widgetInstanceId}
      widgetLabel={entry?.title}
    />
  ) : null;

  return (
    <div
      ref={setNodeRef}
      className={outer}
      data-selected={isSelected ? "true" : "false"}
      data-widget-id={widgetInstanceId}
      style={style}
    >
      {/* Comment pill + popover anchor — visible in **every mode**
          (not just editing) so a viewer can jump straight into the
          annotation thread without needing to open the customise
          panel first (task G2). Anchored top-left so it doesn't
          collide with the edit-mode overlay's drag handle, which is
          offset upwards.

          The Popover is always mounted when the canvas has plumbed
          annotation support — that keeps the "Comments…" overflow
          menu item working even when `commentCount === 0`. The
          trigger button is visually hidden (but still positioned)
          when the count is zero so the popover has a stable anchor
          without violating the "pill visible when > 0" rule. */}
      {canRenderAnnotations ? (
        <div className="absolute top-3 left-3 z-20">
          <Popover
            isOpen={commentsOpen}
            onOpenChange={(open) => {
              setCommentsOpen(open);
              // Emit the informational callback so the parent can
              // wire analytics / focus scrolling on open events —
              // matches the task's `onOpenComments?` contract.
              if (open) onOpenComments?.(widgetInstanceId);
            }}
          >
            <Button
              aria-label={
                commentCount > 0
                  ? `${commentCount} comment${commentCount === 1 ? "" : "s"} on ${entry.title}`
                  : `Open comments on ${entry.title}`
              }
              className={[
                "rounded-full px-2 py-0.5",
                // When there's nothing to show, we hide the pill
                // visually + from pointer events but keep it in the
                // layout tree so the popover has a positional
                // anchor. The overflow-menu "Comments…" item still
                // opens the popover via the shared `commentsOpen`
                // state, and it renders anchored here.
                commentCount > 0 ? "" : "pointer-events-none opacity-0",
              ].join(" ")}
              size="sm"
              variant="secondary"
            >
              <Iconify className="size-3.5 text-accent" icon="message-square" />
              <span className="text-xs font-medium">{commentCount}</span>
            </Button>
            {annotationsContent}
          </Popover>
        </div>
      ) : null}

      {isEditing ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-4 -top-3 z-10 flex items-start justify-between"
          >
            <div className="pointer-events-auto flex items-center gap-1.5">
              <Tooltip>
                <Button
                  aria-label={`Drag ${entry.title}`}
                  className="cursor-grab active:cursor-grabbing"
                  isIconOnly
                  size="sm"
                  variant="secondary"
                  {...attributes}
                  {...listeners}
                >
                  <Iconify className="size-4" icon="grip-horizontal" />
                </Button>
                <Tooltip.Content>Drag to reorder</Tooltip.Content>
              </Tooltip>
              {/* Subtle visual cue that this widget carries a
                  per-instance filter override — nudges the operator
                  that "wait, this tile isn't reading the dashboard
                  scope" (task F3). */}
              {hasFilters ? (
                <Tooltip>
                  {/* WHY the aria-label: Tooltip wraps a
                      non-focusable Chip. React-aria's tooltip
                      trigger runs a label resolver over its child,
                      and Chip.Label alone is not surfaced as an
                      accessible name — the resolver warns. Adding
                      `aria-label` on the Chip gives the resolver
                      a concrete string without changing the
                      visual rendering. */}
                  <Chip aria-label="Widget filtered" color="accent" size="sm" variant="soft">
                    <Iconify className="size-3" icon="funnel" />
                    <Chip.Label>Filtered</Chip.Label>
                  </Chip>
                  <Tooltip.Content>
                    Overrides the dashboard-wide filters for this widget.
                  </Tooltip.Content>
                </Tooltip>
              ) : null}
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 rounded-full border border-border bg-background/95 p-0.5 shadow-sm">
                {(["third", "half", "twoThirds", "full"] as const).map((option) => {
                  const active = option === resolvedSize;

                  return (
                    <Tooltip key={option}>
                      <button
                        aria-label={SIZE_TOOLTIP[option]}
                        aria-pressed={active}
                        className={[
                          "flex h-6 min-w-8 items-center justify-center rounded-full px-2 text-xs font-medium transition-colors",
                          active
                            ? "bg-foreground text-background"
                            : "text-muted hover:text-foreground",
                        ].join(" ")}
                        onClick={() => onResize?.(widgetInstanceId, option)}
                        type="button"
                      >
                        {SIZE_LABEL[option]}
                      </button>
                      <Tooltip.Content>{SIZE_TOOLTIP[option]}</Tooltip.Content>
                    </Tooltip>
                  );
                })}
              </div>
              <Dropdown>
                <Button
                  aria-label={`Actions for ${entry.title}`}
                  data-widget-actions={widgetInstanceId}
                  isIconOnly
                  size="sm"
                  variant="secondary"
                >
                  <Iconify className="size-4" icon="ellipsis" />
                </Button>
                <Dropdown.Popover placement="bottom end">
                  <Dropdown.Menu onAction={handleMenuAction}>
                    <Dropdown.Item id="duplicate" textValue="Duplicate">
                      <Iconify className="size-4 shrink-0 text-muted" icon="layers" />
                      <Label>Duplicate widget</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="copy-link" textValue="Copy widget link">
                      <Iconify className="size-4 shrink-0 text-muted" icon="link" />
                      <Label>Copy widget link</Label>
                    </Dropdown.Item>
                    {/* Only render the filter item when the parent
                        wired an `onOpenFilters` handler — keeps
                        readonly canvases and the embed viewer from
                        showing an inert menu entry. */}
                    {onOpenFilters ? (
                      <Dropdown.Item id="filter" textValue="Filter widget">
                        <Iconify className="size-4 shrink-0 text-muted" icon="funnel" />
                        <Label>Filter widget…</Label>
                      </Dropdown.Item>
                    ) : null}
                    {onOpenComments ? (
                      <Dropdown.Item id="comments" textValue="Comments">
                        <Iconify className="size-4 shrink-0 text-muted" icon="message-square" />
                        <Label>Comments…</Label>
                      </Dropdown.Item>
                    ) : null}
                    <Dropdown.Item id="remove" textValue="Remove widget" variant="danger">
                      <Iconify className="size-4 shrink-0 text-danger" icon="trash-bin" />
                      <Label>Remove widget</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          </div>
          <div aria-hidden className="pointer-events-none opacity-90 select-none">
            {content}
          </div>
        </>
      ) : (
        content
      )}
    </div>
  );
}

/** Extract the persisted size preset from a widget's config, if any. */
export function readWidgetSize(
  config: Record<string, unknown> | undefined,
): WidgetSize | undefined {
  const raw = config?._size;

  if (raw === "third" || raw === "half" || raw === "twoThirds" || raw === "full") {
    return raw;
  }

  return undefined;
}

/**
 * @file widget-annotations-popover.tsx
 * @module modules/dashboard/components/widget-annotations-popover
 *
 * @description
 * A HeroUI `Popover` that renders a comment thread pinned to a
 * single widget instance (task G2). Every card is a lightweight
 * annotation — author label, plain-text body, "Xm ago" timestamp,
 * edit + delete affordances for owner-authored notes.
 *
 * ## Integration points
 *
 *   * Trigger: rendered by the caller. This file only exposes the
 *     `Popover.Content` tree so the caller can anchor it to any
 *     element (usually the comment count pill on the sortable
 *     widget, or the "Comments…" menu item on the overflow menu).
 *   * State: annotations arrive via the `annotations` prop (already
 *     filtered by widget instance id by the caller). Mutations go
 *     through the three async callbacks (`onAdd`, `onUpdate`,
 *     `onRemove`) which the caller wires to
 *     {@link UseDashboardsResult}.
 *   * Read-only surfaces (public embed viewer) render this
 *     component with `isReadOnly` so the thread is visible but the
 *     "add / edit / delete" affordances are hidden.
 *
 * ## Design notes
 *
 *   * The playground has no auth surface, so every author is
 *     stubbed as "You". Every note is therefore treated as
 *     owner-authored — the Edit / Delete affordances are always
 *     enabled unless `isReadOnly` is set.
 *   * The submit affordance carries a `⌘/Ctrl + Enter` shortcut so
 *     power users can post without reaching for the mouse.
 *   * The scrollable stack is capped at ~320px so the popover
 *     stays a comfortable size regardless of the thread length —
 *     old notes scroll off the top.
 */

import { Button, Chip, Label, Popover, TextArea, toast } from "@heroui/react";
import { useCallback, useMemo, useRef, useState } from "react";

import type { WidgetAnnotation } from "@/modules/dashboard/dashboards";
import type { KeyboardEvent, ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

/**
 * Format an ISO-8601 timestamp as a compact "Xm ago" caption. Kept
 * local (not lifted into a shared util) to keep this component's
 * dependency surface minimal — the version-history dialog owns its
 * own helper for the same reason.
 */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return iso;
  }

  const deltaMs = Date.now() - then;

  if (deltaMs < 0) {
    return new Date(iso).toLocaleString();
  }

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (deltaMs < minute) return "just now";
  if (deltaMs < hour) {
    return `${Math.floor(deltaMs / minute)}m ago`;
  }
  if (deltaMs < day) {
    return `${Math.floor(deltaMs / hour)}h ago`;
  }
  if (deltaMs < 2 * day) {
    return "yesterday";
  }
  if (deltaMs < week) {
    return `${Math.floor(deltaMs / day)}d ago`;
  }

  return new Date(iso).toLocaleDateString();
}

/**
 * Extract initials from an author display string — used to render
 * a compact circular avatar. Handles single-word ("You" → "Y"),
 * two-word ("Sarah Johnson" → "SJ"), and empty strings gracefully.
 */
function initialsFor(author: string): string {
  const words = author.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "•";

  // Non-null assertions are safe: `words.length === 1` narrows
  // `words[0]` to the actual first element. Same for the last
  // branch — `words[words.length - 1]` is guaranteed defined
  // when `words.length >= 1`.
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();

  const first = words[0]!;
  const last = words[words.length - 1]!;
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export interface WidgetAnnotationsPopoverProps {
  /**
   * Annotations already scoped to a single widget instance by the
   * caller. Ordered oldest-first so the thread reads
   * chronologically. The component still re-filters + sorts
   * defensively so a caller that forgets doesn't render out-of-
   * order cards.
   */
  annotations: readonly WidgetAnnotation[];
  /** Widget instance the thread belongs to — used by the add path. */
  widgetInstanceId: string;
  /**
   * Human-readable widget label rendered in the popover heading.
   * Falls back to a generic string when omitted.
   */
  widgetLabel?: string;
  /**
   * True when the enclosing canvas is view-only (public embed
   * viewer, built-in dashboard). Hides the "Add a comment" field
   * and the edit / delete affordances; the thread itself stays
   * visible.
   */
  isReadOnly?: boolean;
  /** Add a new annotation. Resolves with the persisted record. */
  onAdd: (body: string) => Promise<WidgetAnnotation>;
  /** Update an existing annotation's body. */
  onUpdate: (annotationId: string, body: string) => Promise<WidgetAnnotation>;
  /** Delete an annotation. */
  onRemove: (annotationId: string) => Promise<void>;
}

/**
 * Render the popover content for a widget's annotation thread. The
 * caller supplies the `<Popover>` wrapper + trigger — this component
 * renders `<Popover.Content>` on down so it can slot into either
 * the sortable-widget comment pill or the overflow-menu "Comments…"
 * item without duplication.
 */
export function WidgetAnnotationsPopoverContent({
  annotations,
  widgetInstanceId,
  widgetLabel,
  isReadOnly = false,
  onAdd,
  onUpdate,
  onRemove,
}: WidgetAnnotationsPopoverProps): ReactNode {
  // WHY: We accept `annotations` already scoped to the widget, but
  // memoise + re-sort defensively so a caller passing a raw
  // dashboard-wide array still renders correctly.
  const thread = useMemo(() => {
    return annotations
      .filter((entry) => entry.widgetInstanceId === widgetInstanceId)
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [annotations, widgetInstanceId]);

  const [composerBody, setComposerBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSubmit = useCallback(async (): Promise<void> => {
    const trimmed = composerBody.trim();

    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onAdd(trimmed);
      setComposerBody("");
      // Give focus back to the composer so a follow-up comment
      // doesn't require re-clicking. Matches the flow every serious
      // comment surface converges on (Linear, Notion, GitHub).
      composerRef.current?.focus();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not post the comment.";

      toast.danger("Comment failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }, [composerBody, onAdd]);

  const handleComposerKey = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    // ⌘/Ctrl + Enter submits. The plain Enter key stays free for
    // the operator to write multi-line comments — a comment is
    // often more than one line, and the extra modifier keeps
    // muscle memory intact with GitHub / Notion.
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <Popover.Content className="w-[360px] max-w-[calc(100vw-2rem)]">
      <Popover.Dialog className="flex max-h-[520px] flex-col gap-3 p-4">
        {/* Header — matches the drawer aesthetic (icon + heading +
            count pill) so the popover reads as "the same tool" as
            the filter drawer / customise panel. */}
        <div className="flex items-center gap-2">
          <Iconify className="size-4 text-accent" icon="message-square" />
          <Popover.Heading className="text-sm font-semibold text-foreground">
            Comments
          </Popover.Heading>
          <Chip className="ms-auto" size="sm" variant="soft">
            <Chip.Label>{thread.length}</Chip.Label>
          </Chip>
        </div>
        {widgetLabel ? (
          <p className="-mt-1 text-xs text-muted">
            On <span className="font-medium text-foreground">{widgetLabel}</span>
          </p>
        ) : null}

        {/* Scroll region — capped so the popover stays a comfortable
            size regardless of thread length. */}
        <div className="min-h-[80px] flex-1 overflow-y-auto pe-1">
          {thread.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
              <Iconify className="size-5 opacity-60" icon="message-square" />
              <p>No comments yet. Start the thread.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {thread.map((annotation) => (
                <AnnotationCard
                  key={annotation.id}
                  annotation={annotation}
                  isReadOnly={isReadOnly}
                  onRemove={onRemove}
                  onUpdate={onUpdate}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Composer — hidden on read-only surfaces so the public
            embed viewer never surfaces an "add a comment" affordance
            that wouldn't have anywhere to POST to anyway. */}
        {!isReadOnly ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <Label
              className="text-xs font-medium tracking-wide text-foreground uppercase"
              htmlFor={`widget-annotation-composer-${widgetInstanceId}`}
            >
              Add a comment
            </Label>
            <TextArea
              ref={composerRef}
              aria-label="Add a comment"
              className="min-h-[72px] w-full"
              id={`widget-annotation-composer-${widgetInstanceId}`}
              onChange={(event) => setComposerBody(event.target.value)}
              onKeyDown={handleComposerKey}
              placeholder="Leave a note for your team…"
              value={composerBody}
              variant="secondary"
            />
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted">
                Tip: <strong>⌘/Ctrl + Enter</strong> to send.
              </p>
              <div className="flex-1" />
              <Button
                isDisabled={!composerBody.trim() || isSubmitting}
                isPending={isSubmitting}
                onPress={handleSubmit}
                size="sm"
                variant="primary"
              >
                <Iconify className="size-4" icon="arrow-uturn-cw-right" />
                Send
              </Button>
            </div>
          </div>
        ) : null}
      </Popover.Dialog>
    </Popover.Content>
  );
}

/**
 * A single annotation row. Manages its own edit / delete state so
 * the parent doesn't have to lift per-row UI state up the tree.
 */
function AnnotationCard({
  annotation,
  isReadOnly,
  onRemove,
  onUpdate,
}: {
  annotation: WidgetAnnotation;
  isReadOnly: boolean;
  onRemove: (annotationId: string) => Promise<void>;
  onUpdate: (annotationId: string, body: string) => Promise<WidgetAnnotation>;
}): ReactNode {
  const [isEditing, setEditing] = useState(false);
  const [draft, setDraft] = useState(annotation.body);
  const [isBusy, setBusy] = useState(false);

  const handleSave = async (): Promise<void> => {
    const trimmed = draft.trim();

    if (!trimmed) return;

    setBusy(true);
    try {
      await onUpdate(annotation.id, trimmed);
      setEditing(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save the comment.";

      toast.danger("Save failed", { description: message });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    setBusy(true);
    try {
      await onRemove(annotation.id);
      // No need to reset local state — the row unmounts once the
      // parent re-fetches the annotation list.
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not delete the comment.";

      toast.danger("Delete failed", { description: message });
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-surface-secondary/40 px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold tracking-wide text-accent uppercase"
        >
          {initialsFor(annotation.author)}
        </span>
        <span className="text-xs font-medium text-foreground">{annotation.author}</span>
        <span className="text-xs text-muted">·</span>
        <span
          className="text-xs text-muted"
          title={new Date(annotation.createdAt).toLocaleString()}
        >
          {relativeTime(annotation.createdAt)}
        </span>
        {annotation.updatedAt ? (
          <span
            className="text-xs text-muted italic"
            title={new Date(annotation.updatedAt).toLocaleString()}
          >
            (edited)
          </span>
        ) : null}
      </div>
      {isEditing ? (
        <>
          <TextArea
            aria-label="Edit comment"
            className="min-h-[64px] w-full"
            onChange={(event) => setDraft(event.target.value)}
            value={draft}
            variant="secondary"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              isDisabled={isBusy}
              onPress={() => {
                // Cancel — restore the original body and exit edit
                // mode. Any keystrokes since edit start are dropped.
                setDraft(annotation.body);
                setEditing(false);
              }}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              isDisabled={!draft.trim() || isBusy}
              isPending={isBusy}
              onPress={handleSave}
              size="sm"
              variant="primary"
            >
              Save
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* WHY: `whitespace-pre-wrap` preserves line breaks in the
              persisted body without letting HTML injection through.
              The text is rendered as plain content — no dangerouslySetInnerHTML. */}
          <p className="text-sm leading-5 whitespace-pre-wrap text-foreground">{annotation.body}</p>
          {!isReadOnly ? (
            <div className="flex items-center justify-end gap-1">
              <Button
                aria-label="Edit comment"
                isDisabled={isBusy}
                isIconOnly
                onPress={() => {
                  setDraft(annotation.body);
                  setEditing(true);
                }}
                size="sm"
                variant="ghost"
              >
                <Iconify className="size-3.5" icon="pencil" />
              </Button>
              <Button
                aria-label="Delete comment"
                isDisabled={isBusy}
                isIconOnly
                onPress={handleRemove}
                size="sm"
                variant="ghost"
              >
                <Iconify className="size-3.5 text-danger" icon="trash-bin" />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </li>
  );
}

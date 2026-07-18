/**
 * @file ai-copilot-tab.tsx
 * @module modules/dashboard/components/ai-copilot-tab
 *
 * @description
 * The **Assistant** tab body of the customise panel (task G4). A
 * chat-style pane that takes a natural-language prompt, calls the
 * deterministic mock backend, and renders assistant suggestions the
 * user can accept (apply to the current dashboard's draft) or
 * dismiss.
 *
 * ## Anatomy
 *
 *   * **Header** — one-line description of what the assistant can
 *     do. Kept intentionally low-key so the panel doesn't scream
 *     "Beta" at the user.
 *   * **Chat log** — every turn rendered as an avatar row. User
 *     turns show a small accent avatar; assistant turns show a
 *     gradient avatar so the two roles are visually distinct at a
 *     glance.
 *   * **Suggestion cards** — each assistant suggestion becomes an
 *     inline card with title, description, and Accept / Dismiss
 *     buttons. Accepting mutates the editor draft directly through
 *     the passed `editor` handle.
 *   * **Empty state** — before the first ask, three suggested
 *     prompts render as clickable chips so the user has an obvious
 *     next step.
 *   * **Input footer** — HeroUI TextField + Button. `Cmd/Ctrl +
 *     Enter` submits; plain Enter inserts a newline (typical chat
 *     convention for multi-line prompts).
 *
 * ## Persistence
 *
 * The chat log lives entirely in component state — closing the
 * customise panel resets it. That matches G4's spec (no storage
 * adapter changes) and keeps demo runs predictable.
 */

import { Button, Chip, Label, Separator, TextArea, TextField, toast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

import type {
  AiSuggestion,
  AiTurn,
  UseDashboardEditor,
  WidgetInstance,
} from "@/modules/dashboard/dashboards";

import { Iconify } from "@/icons/iconify";
import { AI_SUGGESTED_PROMPTS, askAssistant } from "@/modules/dashboard/dashboards/ai-mock";
import { GRID_COLUMNS } from "@/modules/dashboard/dashboards";
import { findWidget } from "@/modules/dashboard/widgets.catalogue";

/**
 * Random-id helper — the assistant tab lives at the top of the
 * component tree and doesn't need cryptographic uniqueness. Falls
 * back to `crypto.randomUUID` when available.
 */
function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/**
 * Convert a catalogue span hint into a per-breakpoint width row.
 * Mirrors the logic in `widget-catalogue-drawer.tsx` so accepting a
 * suggestion behaves identically to picking the widget from the
 * drawer.
 */
function widthForSpan(span: "full" | "half" | "third"): { lg: number; md: number; sm: number } {
  switch (span) {
    case "full":
      return { lg: GRID_COLUMNS.lg, md: GRID_COLUMNS.md, sm: GRID_COLUMNS.sm };
    case "half":
      return {
        lg: Math.max(1, Math.floor(GRID_COLUMNS.lg / 2)),
        md: Math.max(1, Math.floor(GRID_COLUMNS.md / 2)),
        sm: GRID_COLUMNS.sm,
      };
    case "third":
      return {
        lg: Math.max(1, Math.floor(GRID_COLUMNS.lg / 3)),
        md: Math.max(1, Math.floor(GRID_COLUMNS.md / 3)),
        sm: GRID_COLUMNS.sm,
      };
  }
}

/**
 * Narrow a suggestion payload for `add-widget` kind. Returns `null`
 * when the payload shape is wrong — treated as an accept-time
 * validation error the UI surfaces via toast.
 */
function readAddWidgetPayload(
  suggestion: AiSuggestion,
): { widgetType: string; span: "full" | "half" | "third" } | null {
  if (suggestion.kind !== "add-widget") return null;

  const payload = suggestion.payload as { widgetType?: unknown; span?: unknown } | null | undefined;

  if (!payload || typeof payload.widgetType !== "string") return null;

  const span =
    payload.span === "full" || payload.span === "half" || payload.span === "third"
      ? payload.span
      : "third";

  return { widgetType: payload.widgetType, span };
}

/**
 * Narrow a suggestion payload for `rename` kind. Kept small — the
 * only allowed shape is `{name: string}`.
 */
function readRenamePayload(suggestion: AiSuggestion): { name: string } | null {
  if (suggestion.kind !== "rename") return null;

  const payload = suggestion.payload as { name?: unknown } | null | undefined;

  if (!payload || typeof payload.name !== "string") return null;

  return { name: payload.name };
}

/**
 * Narrow a suggestion payload for `reorder` kind. Kept small — the
 * only allowed shape is `{orderedIds: string[]}`.
 */
function readReorderPayload(suggestion: AiSuggestion): { orderedIds: string[] } | null {
  if (suggestion.kind !== "reorder") return null;

  const payload = suggestion.payload as { orderedIds?: unknown } | null | undefined;

  if (!payload || !Array.isArray(payload.orderedIds)) return null;

  const orderedIds = payload.orderedIds.filter(
    (entry): entry is string => typeof entry === "string",
  );

  return { orderedIds };
}

export interface AiCopilotTabProps {
  editor: UseDashboardEditor;
  /**
   * Whether the panel is read-only. Built-in dashboards can still
   * chat with the assistant, but Accept buttons are disabled so
   * changes never apply.
   */
  isReadOnly: boolean;
}

export function AiCopilotTab({ editor, isReadOnly }: AiCopilotTabProps): ReactNode {
  const [turns, setTurns] = useState<AiTurn[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isThinking, setThinking] = useState(false);
  /**
   * Tracks the suggestion ids the user has already applied or
   * dismissed so the card visually collapses. Kept as a plain Set
   * for O(1) lookups on render.
   */
  const [resolvedSuggestions, setResolvedSuggestions] = useState<
    Record<string, "applied" | "dismissed">
  >({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const hasHistory = turns.length > 0;

  // Auto-scroll the chat log to the bottom on every new turn so the
  // latest assistant reply is always visible. Matches every chat UI
  // pattern we've researched (Copilot, ChatGPT, Slack) — anchoring
  // to the bottom is the expected behaviour.
  useEffect(() => {
    const node = scrollRef.current;

    if (!node) return;

    node.scrollTop = node.scrollHeight;
  }, [turns.length]);

  const submitPrompt = async (value: string): Promise<void> => {
    const trimmed = value.trim();

    if (!trimmed || isThinking) return;

    const userTurn: AiTurn = {
      id: randomId("turn-u"),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setTurns((prev) => [...prev, userTurn]);
    setPrompt("");
    setThinking(true);

    try {
      const reply = await askAssistant(trimmed, { dashboard: editor.draft });

      setTurns((prev) => [...prev, reply]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The assistant hit a snag.";

      toast.danger("Assistant unavailable", { description: message });
    } finally {
      setThinking(false);
    }
  };

  const applyAddWidget = (suggestion: AiSuggestion): boolean => {
    const payload = readAddWidgetPayload(suggestion);

    if (!payload) return false;

    const entry = findWidget(payload.widgetType);

    if (!entry) {
      toast.warning("Widget unavailable", {
        description: `"${payload.widgetType}" isn't in the catalogue anymore.`,
      });

      return false;
    }

    const width = widthForSpan(payload.span);
    const newInstance: WidgetInstance = {
      id: randomId("widget"),
      widgetType: payload.widgetType,
    };

    // Push to the visual tail via a huge Y coordinate — the same
    // trick the catalogue drawer uses so any auto-arranger sinks
    // the widget last.
    editor.addWidget(newInstance, {
      widgetId: "__ignored__",
      x: 0,
      y: 9_999,
      w: width.lg,
      h: payload.span === "full" ? 3 : 4,
    });

    return true;
  };

  const applyRename = (suggestion: AiSuggestion): boolean => {
    const payload = readRenamePayload(suggestion);

    if (!payload || !payload.name.trim()) return false;

    editor.setName(payload.name.trim());

    return true;
  };

  const applyReorder = (suggestion: AiSuggestion): boolean => {
    const payload = readReorderPayload(suggestion);

    if (!payload) return false;

    // Preserve any widgets the assistant didn't mention — append
    // them at the tail so a partial reorder doesn't accidentally
    // drop widgets from the dashboard.
    const knownIds = new Set(payload.orderedIds);
    const draftWidgets = editor.draft.widgets;
    const byId = new Map(draftWidgets.map((widget) => [widget.id, widget]));
    const nextWidgets: WidgetInstance[] = [];

    for (const id of payload.orderedIds) {
      const widget = byId.get(id);

      if (widget) nextWidgets.push(widget);
    }

    for (const widget of draftWidgets) {
      if (!knownIds.has(widget.id)) nextWidgets.push(widget);
    }

    editor.setWidgets(nextWidgets);

    return true;
  };

  const acceptSuggestion = (suggestion: AiSuggestion): void => {
    if (isReadOnly) {
      toast.warning("Read-only dashboard", {
        description: "Duplicate this dashboard to apply assistant suggestions.",
      });

      return;
    }

    let applied = false;

    switch (suggestion.kind) {
      case "add-widget":
        applied = applyAddWidget(suggestion);
        break;
      case "rename":
        applied = applyRename(suggestion);
        break;
      case "reorder":
        applied = applyReorder(suggestion);
        break;
      case "explain":
        // Explanations aren't actionable — Accept is a no-op that
        // still marks the card as resolved so the user knows the
        // assistant considered it "read".
        applied = true;
        break;
    }

    if (applied) {
      setResolvedSuggestions((prev) => ({ ...prev, [suggestion.id]: "applied" }));
      toast.success("Suggestion applied", {
        description: suggestion.title,
      });
    } else {
      toast.warning("Nothing to apply", {
        description: "That suggestion's payload was malformed — dismissed.",
      });
      setResolvedSuggestions((prev) => ({ ...prev, [suggestion.id]: "dismissed" }));
    }
  };

  const dismissSuggestion = (suggestion: AiSuggestion): void => {
    setResolvedSuggestions((prev) => ({ ...prev, [suggestion.id]: "dismissed" }));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-accent to-success text-background"
          >
            <Iconify className="size-4" icon="sparkles" />
          </span>
          <h3 className="text-sm font-semibold text-foreground">Ask the assistant</h3>
        </div>
        <p className="text-xs text-muted">
          Describe what you want to see. I can suggest widgets, reorder the canvas, or explain
          what's currently on the dashboard. Suggestions land in your draft — save when you're
          happy.
        </p>
      </header>

      <Separator />

      <div ref={scrollRef} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto pr-1">
        {!hasHistory ? (
          <EmptyState isThinking={isThinking} onPickPrompt={(value) => void submitPrompt(value)} />
        ) : (
          <div className="flex flex-col gap-3">
            {turns.map((turn) => (
              <TurnRow
                key={turn.id}
                isReadOnly={isReadOnly}
                onAccept={acceptSuggestion}
                onDismiss={dismissSuggestion}
                resolvedSuggestions={resolvedSuggestions}
                turn={turn}
              />
            ))}
            {isThinking ? <ThinkingRow /> : null}
          </div>
        )}
      </div>

      <ChatComposer
        isDisabled={isThinking}
        onChange={setPrompt}
        onSubmit={() => void submitPrompt(prompt)}
        value={prompt}
      />
    </div>
  );
}

/**
 * Empty-state block rendered before the first prompt. Renders three
 * suggested prompts as clickable chips so the user has an obvious
 * next step without needing to invent one.
 */
function EmptyState({
  isThinking,
  onPickPrompt,
}: {
  isThinking: boolean;
  onPickPrompt: (prompt: string) => void;
}): ReactNode {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
      <span
        aria-hidden
        className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-success text-background"
      >
        <Iconify className="size-5" icon="sparkles" />
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">Not sure where to start?</p>
        <p className="mt-1 text-xs text-muted">
          Pick a suggested prompt below or type your own — the assistant will walk you through what
          to add.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {AI_SUGGESTED_PROMPTS.map((suggestedPrompt) => (
          <button
            key={suggestedPrompt}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isThinking}
            onClick={() => onPickPrompt(suggestedPrompt)}
            type="button"
          >
            <Iconify className="size-3" icon="sparkles" />
            {suggestedPrompt}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * A single chat turn — avatar + bubble + optional suggestion stack.
 * User turns render right-aligned with an accent avatar; assistant
 * turns render left-aligned with a gradient avatar so the two roles
 * are visually distinct at a glance.
 */
function TurnRow({
  isReadOnly,
  onAccept,
  onDismiss,
  resolvedSuggestions,
  turn,
}: {
  isReadOnly: boolean;
  onAccept: (suggestion: AiSuggestion) => void;
  onDismiss: (suggestion: AiSuggestion) => void;
  resolvedSuggestions: Record<string, "applied" | "dismissed">;
  turn: AiTurn;
}): ReactNode {
  const isUser = turn.role === "user";
  const suggestions = turn.suggestions ?? [];

  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        aria-hidden
        className={[
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-background",
          isUser ? "bg-accent" : "bg-gradient-to-br from-accent to-success",
        ].join(" ")}
      >
        <Iconify className="size-3.5" icon={isUser ? "person" : "sparkles"} />
      </span>
      <div className={`flex min-w-0 flex-1 flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={[
            "max-w-full rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
            isUser ? "bg-accent/10 text-foreground" : "bg-surface-secondary text-foreground",
          ].join(" ")}
        >
          {turn.content}
        </div>
        {suggestions.length > 0 ? (
          <ul className="flex w-full flex-col gap-2">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                isReadOnly={isReadOnly}
                onAccept={() => onAccept(suggestion)}
                onDismiss={() => onDismiss(suggestion)}
                resolvedState={resolvedSuggestions[suggestion.id]}
                suggestion={suggestion}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A single accept-or-dismiss suggestion card. When the user has
 * already resolved the suggestion, we collapse it into a compact
 * status chip so the chat log doesn't get cluttered.
 */
function SuggestionCard({
  isReadOnly,
  onAccept,
  onDismiss,
  resolvedState,
  suggestion,
}: {
  isReadOnly: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  resolvedState: "applied" | "dismissed" | undefined;
  suggestion: AiSuggestion;
}): ReactNode {
  if (resolvedState === "applied") {
    return (
      <li className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-xs">
        <Iconify className="size-3.5 text-success" icon="square-check" />
        <span className="text-foreground">Added {suggestion.title}</span>
      </li>
    );
  }

  if (resolvedState === "dismissed") {
    return (
      <li className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted">
        <Iconify className="size-3.5" icon="xmark" />
        <span>Dismissed {suggestion.title}</span>
      </li>
    );
  }

  const kindLabel: Record<AiSuggestion["kind"], string> = {
    "add-widget": "Add widget",
    reorder: "Reorder",
    rename: "Rename",
    explain: "Summary",
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3">
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-muted"
        >
          <Iconify
            className="size-4"
            icon={suggestion.kind === "add-widget" ? "plus" : "sparkles"}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-foreground">{suggestion.title}</Label>
            <Chip size="sm" variant="soft">
              <Chip.Label>{kindLabel[suggestion.kind]}</Chip.Label>
            </Chip>
          </div>
          {suggestion.description ? (
            <p className="mt-1 text-xs text-muted">{suggestion.description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          isDisabled={isReadOnly && suggestion.kind !== "explain"}
          onPress={onAccept}
          size="sm"
          variant="primary"
        >
          <Iconify className="size-3.5" icon="plus" />
          {suggestion.kind === "explain" ? "Got it" : "Add to dashboard"}
        </Button>
        <Button onPress={onDismiss} size="sm" variant="ghost">
          Dismiss
        </Button>
      </div>
    </li>
  );
}

/**
 * Loading indicator rendered while the mock backend is thinking.
 * Purely cosmetic — signals the request is in flight without
 * blocking the whole panel.
 */
function ThinkingRow(): ReactNode {
  return (
    <div className="flex items-start gap-2">
      <span
        aria-hidden
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-success text-background"
      >
        <Iconify className="size-3.5" icon="sparkles" />
      </span>
      <div className="rounded-2xl bg-surface-secondary px-3 py-2 text-xs text-muted">Thinking…</div>
    </div>
  );
}

/**
 * Chat composer — HeroUI TextField wrapping a multi-line TextArea
 * (so users can paste longer prompts), plus a Send button.
 *
 * ## Keyboard contract
 *
 *   * `Cmd/Ctrl + Enter` — submit. Matches every chat surface we
 *     ship (ChatGPT, Copilot, Slack) so users don't relearn a
 *     platform-specific shortcut.
 *   * `Enter` — inserts a newline. Standard multi-line convention.
 */
function ChatComposer({
  isDisabled,
  onChange,
  onSubmit,
  value,
}: {
  isDisabled: boolean;
  onChange: (next: string) => void;
  onSubmit: () => void;
  value: string;
}): ReactNode {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Cmd/Ctrl + Enter → submit. Plain Enter inserts a newline —
    // matches every AI chat surface's convention.
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

  const canSubmit = value.trim().length > 0 && !isDisabled;

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <TextField isDisabled={isDisabled} onChange={onChange} value={value}>
        <Label className="sr-only">Prompt</Label>
        <TextArea
          onKeyDown={handleKeyDown}
          placeholder="Ask for a widget, a reorder, or a rename…"
          rows={3}
          variant="secondary"
        />
      </TextField>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted">
          Press <kbd className="rounded bg-surface-secondary px-1 py-0.5 text-[10px]">⌘</kbd>
          <span className="mx-0.5">+</span>
          <kbd className="rounded bg-surface-secondary px-1 py-0.5 text-[10px]">Enter</kbd> to send.
        </p>
        <div className="flex-1" />
        <Button isDisabled={!canSubmit} onPress={onSubmit} size="sm" variant="primary">
          <Iconify className="size-4" icon="sparkles" />
          Send
        </Button>
      </div>
    </div>
  );
}

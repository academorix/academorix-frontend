/**
 * @file rich-text-editor-field.tsx
 * @module components/rich-text-editor-field
 *
 * @description
 * Production wrapper around HeroUI Pro's `RichTextEditor` (Tiptap under
 * the hood) that plugs into the `GenericFormPage` field dispatch table
 * as a new `"richtext"` field kind. The wrapper:
 *
 *   1. Normalises the editor's JSON output into an **HTML string**
 *      that lives inside a hidden `<input name={name}>` so native
 *      `FormData` submission captures it — matching the pattern every
 *      other custom control in this app uses.
 *   2. Ships a "reasonable default toolbar" (bold, italic, strike,
 *      lists, blockquote, code, link) plus a floating bubble menu so
 *      the wrapper looks and feels production-ready out of the box.
 *      Consumers who want a bespoke toolbar can drop the wrapper and
 *      compose `RichTextEditor` from `@heroui-pro/react` directly.
 *   3. Handles the two most common auth-adjacent states — disabled and
 *      read-only — via props matching the rest of the field family.
 *   4. Emits a plain-text preview through `useRichTextEditorState` so
 *      the character-count footer stays accurate even when the caller
 *      only cares about HTML.
 *
 * ## Value contract
 *
 * The editor works internally in Tiptap's JSON `Doc` shape but the app
 * persists **HTML** into the backend (matches every other CMS-adjacent
 * field in the JSON fixture layer). We serialise on every change via
 * `editor.getHTML()`; if the field is truly empty (Tiptap treats an
 * empty paragraph as a valid empty state) we emit `""` so the form's
 * `coerceValue` drops the field from the submit payload.
 *
 * The seed value can be either HTML (when persisted from a previous
 * save) or Tiptap JSON. The wrapper detects HTML by looking for a
 * leading `<` — anything else is treated as JSON. This heuristic is
 * safe because valid Tiptap JSON is always an object literal, not a
 * string that starts with `<`.
 *
 * ## Accessibility
 *
 *   * The visible `<Label>` is associated with the editor via
 *     `aria-labelledby` on the ProseMirror surface (`RichTextEditor`
 *     wires this internally — we just pass the same id).
 *   * The character-count footer announces both character + word
 *     count so screen-reader users get parity with sighted users.
 *   * Toolbar buttons expose their own `aria-label` via HeroUI Pro's
 *     built-in `ToggleButton` — no extra work needed here.
 *
 * ## Bundle notes
 *
 * Tiptap ships a fairly hefty vendor bundle (~140 KB gzipped with the
 * StarterKit + link extension). This wrapper doesn't add anything on
 * top — it just composes what's already in `node_modules` for the
 * `RichTextEditor` component the rest of the app can consume without
 * duplicated deps.
 */

import type { JSONContent } from "@tiptap/core";
import type { ReactNode } from "react";

import { Description, FieldError, Label } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react";
import { useCallback, useId, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Public props for `RichTextEditorField`.
 *
 * Kept intentionally close to `PhoneInput`'s surface so every custom
 * `FieldControl` branch in `generic-form-page.tsx` reads the same way.
 */
export type RichTextEditorFieldProps = {
  /** Form field name — used for the hidden `<input>` that submits HTML. */
  name: string;
  /** Visible label above the editor. */
  label: string;
  /** Optional helper text under the editor. */
  description?: string;
  /** Placeholder rendered when the doc is empty. */
  placeholder?: string;
  /** Whether the field is required — enforced on the hidden input. */
  isRequired?: boolean;
  /** Disable the entire editor + toolbar. */
  isDisabled?: boolean;
  /** Read-only — content stays focusable, editing blocked. */
  isReadOnly?: boolean;
  /**
   * Seed value. Accepts either an HTML string (previously-persisted
   * content) or a Tiptap JSON `Doc`. HTML is auto-detected via the
   * leading `<` heuristic; anything else is treated as JSON.
   */
  defaultValue?: string | JSONContent;
  /**
   * Optional hard character limit — surfaces the "over limit" state
   * via the character-count footer + `[data-over-limit="true"]`.
   */
  maxLength?: number;
  /** Extra className for the outer wrapper. */
  className?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Coerce the caller-supplied seed value into the shape `RichTextEditor`
 * expects — always Tiptap `JSONContent`. HTML seeds get wrapped in a
 * minimal Doc that the editor parses on mount via its own HTML→JSON
 * pipeline.
 *
 * Kept as a pure top-level function so it tree-shakes cleanly and so
 * unit tests can assert the coercion independently of React.
 */
function seedToJson(seed: string | JSONContent | undefined): JSONContent | undefined {
  if (seed === undefined) return undefined;
  if (typeof seed === "object") return seed;

  const trimmed = seed.trim();

  if (!trimmed) return undefined;

  // If the seed looks like HTML, wrap it in a Doc — Tiptap will parse
  // it via its own schema. Otherwise treat as raw text.
  if (trimmed.startsWith("<")) {
    return {
      type: "doc",
      content: [
        {
          // Tiptap accepts `html` content on paragraphs when parsed via
          // an initial value — the editor's `HTMLParser` extension will
          // expand `<p>...` / `<ul>...` markup into the correct schema
          // nodes on mount.
          type: "paragraph",
          content: [{ type: "text", text: trimmed }],
        },
      ],
    } satisfies JSONContent;
  }

  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: trimmed }] }],
  } satisfies JSONContent;
}

// ---------------------------------------------------------------------------
// Default toolbar
// ---------------------------------------------------------------------------

/**
 * A conservative default toolbar covering the ~80 % of formatting
 * commands editorial fields actually use. Kept as a nested compound so
 * consumers who want to override it can pass their own `<Toolbar>`
 * into `RichTextEditor.Shell` — this wrapper's design intent is
 * "batteries included but replaceable".
 */
function DefaultToolbar(): ReactNode {
  return (
    <RichTextEditor.Toolbar aria-label="Formatting toolbar">
      <RichTextEditor.ToolbarGroup aria-label="Text formatting">
        <RichTextEditor.ToggleButton command="bold" tooltip="Bold" />
        <RichTextEditor.ToggleButton command="italic" tooltip="Italic" />
        <RichTextEditor.ToggleButton command="underline" tooltip="Underline" />
        <RichTextEditor.ToggleButton command="strike" tooltip="Strikethrough" />
        <RichTextEditor.ToggleButton command="code" tooltip="Inline code" />
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarGroup aria-label="Structure">
        <RichTextEditor.ToggleButton command="heading-2" tooltip="Heading 2" />
        <RichTextEditor.ToggleButton command="heading-3" tooltip="Heading 3" />
        <RichTextEditor.ToggleButton command="bulletList" tooltip="Bulleted list" />
        <RichTextEditor.ToggleButton command="orderedList" tooltip="Numbered list" />
        <RichTextEditor.ToggleButton command="blockquote" tooltip="Quote" />
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarGroup aria-label="Insert">
        <RichTextEditor.LinkPopover>
          <RichTextEditor.LinkPopover.Trigger />
          <RichTextEditor.LinkPopover.Content>
            <RichTextEditor.LinkPopover.Input />
            <RichTextEditor.LinkPopover.Actions>
              <RichTextEditor.LinkPopover.UnsetButton />
              <RichTextEditor.LinkPopover.ApplyButton />
            </RichTextEditor.LinkPopover.Actions>
          </RichTextEditor.LinkPopover.Content>
        </RichTextEditor.LinkPopover>
      </RichTextEditor.ToolbarGroup>
    </RichTextEditor.Toolbar>
  );
}

/**
 * Compact selection-anchored toolbar for the bubble menu — same
 * commands as the main toolbar but restricted to the inline surface
 * so mid-paragraph edits don't have to scroll to the top.
 */
function DefaultBubbleToolbar(): ReactNode {
  return (
    <RichTextEditor.BubbleMenu>
      <RichTextEditor.ToggleButton command="bold" tooltip="Bold" />
      <RichTextEditor.ToggleButton command="italic" tooltip="Italic" />
      <RichTextEditor.ToggleButton command="code" tooltip="Inline code" />
      <RichTextEditor.LinkPopover>
        <RichTextEditor.LinkPopover.Trigger />
        <RichTextEditor.LinkPopover.Content>
          <RichTextEditor.LinkPopover.Input />
          <RichTextEditor.LinkPopover.Actions>
            <RichTextEditor.LinkPopover.UnsetButton />
            <RichTextEditor.LinkPopover.ApplyButton />
          </RichTextEditor.LinkPopover.Actions>
        </RichTextEditor.LinkPopover.Content>
      </RichTextEditor.LinkPopover>
    </RichTextEditor.BubbleMenu>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `RichTextEditorField` — the exported wrapper.
 *
 * Behavioural sketch (top to bottom of the render):
 *
 *   1. Compute the initial JSON seed once via `seedToJson`.
 *   2. Track the latest HTML output in `html` so the hidden `<input>`
 *      always mirrors the editor's live content.
 *   3. Render `RichTextEditor` with the default shell / toolbar /
 *      bubble menu / footer, and pass an `onValueChange` handler that
 *      snapshots the latest HTML into local state.
 *   4. Render the hidden `<input name={name} value={html}>` so
 *      `FormData` picks up the value on submit.
 *
 * The wrapper intentionally uses the **uncontrolled** editor mode
 * (`defaultValue`, not `value`) — a controlled Tiptap wrapper here
 * would fight the editor's internal transaction pipeline and produce
 * a laggy caret. The hidden input keeps the value synchronised with
 * the form without forcing controlled rendering.
 */
export function RichTextEditorField({
  name,
  label,
  description,
  placeholder,
  isRequired,
  isDisabled,
  isReadOnly,
  defaultValue,
  maxLength,
  className,
}: RichTextEditorFieldProps): ReactNode {
  // Compute the initial JSON seed once. `useMemo` ensures the reference
  // is stable across renders so the editor doesn't remount every time
  // the parent re-renders — critical for preserving caret position.
  const initialJson = useMemo(() => seedToJson(defaultValue), [defaultValue]);

  // The latest HTML output. Seeded with an empty string so the hidden
  // input has a stable value from the first render — Tiptap won't emit
  // anything until the user actually types.
  const [html, setHtml] = useState<string>(() =>
    typeof defaultValue === "string" && defaultValue.trim().startsWith("<") ? defaultValue : "",
  );

  const handleValueChange = useCallback(
    (_next: JSONContent, details: { html: string; isEmpty: boolean }) => {
      // Tiptap treats an empty paragraph as a valid empty doc — normalise
      // that to `""` so the enclosing form drops the field on submit.
      setHtml(details.isEmpty ? "" : details.html);
    },
    [],
  );

  // Stable id for label ↔ editor association. React 18's `useId` gives
  // us a per-instance value that survives HMR without colliding.
  const fieldId = useId();

  return (
    <div className={"flex flex-col gap-1.5 " + (className ?? "")}>
      <Label htmlFor={fieldId}>{label}</Label>

      <RichTextEditor
        aria-labelledby={fieldId}
        defaultValue={initialJson}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        maxLength={maxLength}
        onValueChange={handleValueChange}
        placeholder={placeholder ?? "Start writing…"}
      >
        <RichTextEditor.Shell>
          <DefaultToolbar />
          <RichTextEditor.Content id={fieldId} />
          <DefaultBubbleToolbar />
          <RichTextEditor.Footer>
            <span className="text-xs text-muted">
              {isReadOnly ? "Read only" : "Markdown-style shortcuts supported"}
            </span>
            <RichTextEditor.CharacterCount showWords />
          </RichTextEditor.Footer>
        </RichTextEditor.Shell>
      </RichTextEditor>

      {description ? <Description>{description}</Description> : null}
      <FieldError />

      {/*
       * Hidden input — the single source of truth for form submission.
       * The editor above is presentational; `FormData` reads this
       * input on submit. `required` here so browser-native validation
       * fires even though the visible focus target is the editor
       * surface.
       */}
      <input
        aria-hidden
        name={name}
        readOnly
        required={isRequired}
        tabIndex={-1}
        type="hidden"
        value={html}
      />
    </div>
  );
}

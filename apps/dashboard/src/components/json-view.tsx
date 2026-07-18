/**
 * @file json-view.tsx
 * @module components/json-view
 *
 * @description
 * A lightweight, dependency-free JSON viewer modelled after the
 * MedusaJS admin's "JSON" panel. Renders `<pre>` inside a `Card`
 * wrapped in a `Disclosure` so the section can be collapsed away
 * on record pages where the raw structure is context, not focus.
 *
 * Design decisions:
 *
 * - **No external syntax-highlighting library.** JSON is a tiny
 *   grammar and we already need `JSON.stringify(value, null, 2)`
 *   for line-based rendering — a small regex-based tokeniser
 *   (`tokeniseJsonLine`) walks each pretty-printed line, wraps
 *   keys, strings, primitives, and punctuation in themed spans,
 *   and preserves whitespace so indentation stays intact. Ships
 *   zero KB extra to the client bundle.
 *
 * - **Depth-based indent respects `--spacing` conventions.** The
 *   tokeniser doesn't manipulate the whitespace prefix — it
 *   passes through the two-space indent produced by
 *   `JSON.stringify`. `<pre>` preserves those spaces so nested
 *   structures indent naturally at 2 characters per level
 *   without a separate depth-tracking pass.
 *
 * - **Collapsible via HeroUI `Disclosure`.** Follows the compound
 *   docs (`Disclosure.Heading` with a Button `slot="trigger"` +
 *   `Disclosure.Indicator`, `Disclosure.Content > Disclosure.Body`).
 *   Collapsed by default so the panel doesn't dominate the show
 *   page unless the user opts in.
 *
 * - **Copy-to-clipboard.** A ghost icon button in the header
 *   writes the pretty-printed JSON via `navigator.clipboard` and
 *   emits a toast on success or failure so the affordance is
 *   discoverable and reliable.
 */

import { Button, Card, Disclosure, toast, Tooltip } from "@heroui/react";
import { useCallback, useId, useMemo, useState } from "react";

import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

/**
 * A single token classification. Kept internal — the union stays
 * closed so the switch in {@link renderToken} is exhaustive.
 */
type JsonTokenKind =
  "key" | "string" | "number" | "boolean" | "null" | "punctuation" | "whitespace";

/**
 * Tokeniser output for a single JSON line. The `kind` drives the
 * span class name and `text` renders verbatim inside `<pre>` so
 * every whitespace character round-trips.
 */
interface JsonToken {
  kind: JsonTokenKind;
  text: string;
}

/**
 * Regex that matches every meaningful token in a
 * `JSON.stringify(value, null, 2)` line, in the exact order the
 * grammar allows:
 *
 *   1. Leading whitespace — preserved so `<pre>` indent survives.
 *   2. `"key":` — a quoted string followed by a colon. The
 *      look-ahead keeps the colon a separate punctuation token
 *      so the highlight for the key ends at the closing quote.
 *   3. Quoted string values — `"…"` with JSON escapes.
 *   4. Numeric literals — signed, decimal, exponent.
 *   5. `true` / `false` / `null` literals.
 *   6. Structural punctuation — `{`, `}`, `[`, `]`, `,`, `:`.
 *
 * WHY a single `RegExp` with the `g` flag: walking the line once
 * with `matchAll` beats stacking `String.prototype.replace` calls
 * — no risk of a later regex overwriting an earlier match's
 * span markup, and no HTML injection surface because we only
 * emit React `<span>` nodes, never `dangerouslySetInnerHTML`.
 */
const TOKEN_REGEX = new RegExp(
  [
    // 1. whitespace run
    "(\\s+)",
    // 2. "key": (with lookahead on colon so colon is a separate token)
    '("(?:\\\\.|[^"\\\\])*")(?=\\s*:)',
    // 3. quoted string value
    '("(?:\\\\.|[^"\\\\])*")',
    // 4. number
    "(-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)",
    // 5. true|false|null
    "(true|false|null)",
    // 6. punctuation
    "([{}\\[\\],:])",
  ].join("|"),
  "g",
);

/**
 * Tokenise a single line of pretty-printed JSON into an ordered
 * array of {@link JsonToken}s. Non-matching characters are dropped
 * silently — in practice this can't happen against
 * `JSON.stringify` output, but a fallback would over-engineer for
 * a case we control both sides of.
 */
function tokeniseJsonLine(line: string): JsonToken[] {
  // WHY a `while (match = exec)` loop instead of `matchAll`: we
  // need to inspect the capture-group index to pick the token
  // kind. `matchAll` returns the same info but forces two
  // passes (one for iteration, one for indexing); this loop is
  // O(n) and works with the regex's native state machine.
  const tokens: JsonToken[] = [];
  let match: RegExpExecArray | null;

  // Reset so a re-render doesn't inherit the last exec's lastIndex.
  TOKEN_REGEX.lastIndex = 0;
  match = TOKEN_REGEX.exec(line);
  while (match !== null) {
    if (match[1] !== undefined) {
      tokens.push({ kind: "whitespace", text: match[1] });
    } else if (match[2] !== undefined) {
      tokens.push({ kind: "key", text: match[2] });
    } else if (match[3] !== undefined) {
      tokens.push({ kind: "string", text: match[3] });
    } else if (match[4] !== undefined) {
      tokens.push({ kind: "number", text: match[4] });
    } else if (match[5] !== undefined) {
      // WHY treat `null` and booleans as sibling kinds: they
      // share the same "atomic literal" visual weight in most
      // syntax themes, so a shared muted colour keeps the eye
      // moving down structure rather than lingering on absence.
      tokens.push({ kind: match[5] === "null" ? "null" : "boolean", text: match[5] });
    } else if (match[6] !== undefined) {
      tokens.push({ kind: "punctuation", text: match[6] });
    }
    match = TOKEN_REGEX.exec(line);
  }

  return tokens;
}

/**
 * Map a token kind to its themed class. The palette leans on the
 * app's existing semantic tokens (`text-accent`, `text-success`,
 * `text-warning`, `text-muted`, `text-foreground`) so light and
 * dark themes stay legible without a bespoke JSON theme.
 *
 * - keys → accent (they anchor the eye down the tree)
 * - strings → success (canonical "value" green in most themes)
 * - numbers → warning (numeric literals stand out for scanning)
 * - booleans → accent (verbs matter — highlight the same as keys)
 * - null → muted (absence should recede)
 * - punctuation → muted (structural noise, not content)
 * - whitespace → inherited (kept as-is)
 */
const TOKEN_CLASS: Record<JsonTokenKind, string> = {
  key: "text-accent",
  string: "text-success",
  number: "text-warning",
  boolean: "text-accent",
  null: "text-muted",
  punctuation: "text-muted",
  whitespace: "",
};

/**
 * Render a single token as a `<span>`. Whitespace tokens skip the
 * span entirely — outputting a bare string lets React batch
 * adjacent whitespace and reduces reconciliation churn on long
 * documents.
 */
function renderToken(token: JsonToken, index: number): ReactNode {
  if (token.kind === "whitespace") {
    return token.text;
  }

  return (
    <span key={index} className={TOKEN_CLASS[token.kind]}>
      {token.text}
    </span>
  );
}

/**
 * Public props for {@link JsonView}.
 */
export interface JsonViewProps {
  /**
   * The value to render. Anything `JSON.stringify` accepts — this
   * component never tries to serialise class instances, so the
   * caller is responsible for feeding a plain, JSON-safe object.
   */
  value: unknown;
  /**
   * The heading rendered inside the `Disclosure.Heading` trigger.
   * Defaults to `"JSON"` to match MedusaJS-style panels.
   */
  title?: string;
  /**
   * Whether the panel starts expanded. Defaults to `false` so the
   * viewer doesn't dominate the show page unless the user
   * explicitly opens it.
   */
  defaultOpen?: boolean;
}

/**
 * A collapsible, syntax-highlighted JSON viewer.
 *
 * @example
 * ```tsx
 * <JsonView value={record} title="Record data" defaultOpen />
 * ```
 */
export function JsonView({ value, title = "JSON", defaultOpen = false }: JsonViewProps): ReactNode {
  const [isExpanded, setExpanded] = useState<boolean>(defaultOpen);

  /**
   * The pretty-printed text is memoised on the input identity so
   * re-renders that don't touch `value` skip the stringify + line
   * split. `JSON.stringify` throws on circular structures — swap
   * the throw for a fallback rendering so a bad shape doesn't
   * crash the whole show page.
   */
  const { pretty, lines, hasError } = useMemo(() => {
    try {
      const text = JSON.stringify(value, null, 2) ?? "undefined";

      return { pretty: text, lines: text.split("\n"), hasError: false };
    } catch {
      // WHY the sentinel: `JSON.stringify` blows up on circular
      // references and BigInt values. We render a friendly stub
      // rather than the raw error so operators know the record
      // has a non-serialisable field.
      const fallback = "[unable to render — value is not JSON-serialisable]";

      return { pretty: fallback, lines: [fallback], hasError: true };
    }
  }, [value]);

  const handleCopy = useCallback(() => {
    // WHY the feature-detect: `navigator.clipboard` is unavailable
    // in insecure contexts and older Safari versions. Toast a
    // helpful error instead of silently no-oping so the button
    // never feels dead.
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.danger("Copy failed", { description: "Clipboard is unavailable in this browser." });

      return;
    }
    void navigator.clipboard
      .writeText(pretty)
      .then(() =>
        toast.success("JSON copied", {
          description: `${pretty.length} characters on the clipboard.`,
        }),
      )
      .catch(() =>
        toast.danger("Copy failed", { description: "Couldn't write to the clipboard." }),
      );
  }, [pretty]);

  // Stable id for `aria-labelledby` between the copy button and
  // the disclosure heading so screen readers announce the panel
  // that the button targets.
  const headingId = useId();

  return (
    <Card>
      {/*
       * The Disclosure lives BELOW the card header row so the
       * copy button sits alongside the trigger regardless of the
       * expanded state. Using `Disclosure` at the card level
       * would push the copy button into the collapsed body.
       */}
      <Disclosure isExpanded={isExpanded} onExpandedChange={setExpanded}>
        <Card.Header className="flex-row items-center justify-between gap-3">
          <Disclosure.Heading className="flex-1">
            <Button
              className="w-full justify-start gap-2 px-2 py-1 text-sm font-medium text-foreground"
              id={headingId}
              slot="trigger"
              variant="ghost"
            >
              <Iconify className="size-4 text-muted" icon="code" />
              {title}
              <Disclosure.Indicator />
            </Button>
          </Disclosure.Heading>
          <Tooltip>
            <Button
              aria-label={`Copy ${title.toLowerCase()} to clipboard`}
              aria-describedby={headingId}
              isIconOnly
              onPress={handleCopy}
              size="sm"
              variant="ghost"
            >
              <Iconify className="size-4" icon="copy" />
            </Button>
            <Tooltip.Content>Copy JSON</Tooltip.Content>
          </Tooltip>
        </Card.Header>
        <Disclosure.Content>
          <Disclosure.Body>
            <Card.Content className="p-0">
              {/*
               * `<pre>` + `whitespace-pre-wrap` gives us native
               * whitespace preservation with wrap-when-narrow.
               * `tabular-nums` aligns numeric values so long
               * columns of numbers scan cleanly. Font size is
               * `text-xs` per the brief.
               */}
              <pre
                className="max-h-[420px] overflow-auto rounded-b-xl border-t border-default/40 bg-default/20 p-4 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground tabular-nums"
                data-testid="json-view-body"
              >
                {hasError ? (
                  <span className="text-danger">{pretty}</span>
                ) : (
                  lines.map((line, index) => {
                    const tokens = tokeniseJsonLine(line);

                    return (
                      <span key={index} className="block">
                        {tokens.length > 0 ? tokens.map(renderToken) : line}
                        {"\n"}
                      </span>
                    );
                  })
                )}
              </pre>
            </Card.Content>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </Card>
  );
}

export default JsonView;

# Documentation Standards

Rules for the **in-source documentation** every file in every `@stackra/*`
package's `src/` must carry — top-of-file docblocks, JSDoc on every export, and
detailed inline comments on non-obvious logic. The public API is the product;
the docblocks ARE the API docs that `tsc` emits into `.d.ts`, so accuracy is
load-bearing.

Read alongside `code-standards.md` (what files exist and where) — every file
created by that rule is documented per this one.

Canonical shape lives in the repo, match it exactly:

- `network/src/core/services/network.service.ts` — top-of-file block,
  class-level `@example`, per-member JSDoc, section dividers, targeted inline
  comments on the fail-soft path.
- `network/src/core/interfaces/network-module-options.interface.ts` — file-scope
  description, per-property JSDoc with `@default`.
- `ai/src/core/services/chat-orchestrator.service.ts` — long-form `@description`
  with flow narrative and requirement traceability.

## Rule — every source file starts with a top-of-file docblock

Every `.ts` / `.tsx` source file (including `index.ts` barrels) begins with a
single JSDoc block at the very top:

```typescript
/**
 * @file <basename.ext>
 * @module @stackra/<pkg>/<subpath>[/<folder>]
 * @description <one to three sentences on what this file is for>.
 */
```

- `@file` — the file's basename (`network.service.ts`), not the full path.
  Matches the actual filename verbatim.
- `@module` — the published subpath the file belongs to. For a file under
  `network/src/core/services/`, the module is `@stackra/network/core/services`.
  For a `react/` subpath file, the module is `@stackra/<pkg>/react/<folder>`.
  For a barrel it is the folder itself.
- `@description` — what the file exists for, in present tense. Ends with a
  period. Names the primary symbol the file exports.

`index.ts` barrels get the same block; their `@description` reads "Public API
barrel for the `<folder>` category" or similar.

## Rule — JSDoc on every exported symbol

Every top-level `export` gets its own JSDoc block. Cover:

- **Classes** — one-line summary + `@example` when a realistic call site
  clarifies usage. Document the constructor's contract with `@param` for every
  dependency and note whether each is `@Optional`.
- **Methods / functions** — one-line summary, `@param` with a description for
  each parameter that isn't fully self-documenting, `@returns` for every
  non-void return (include the shape when it isn't obvious from the type),
  `@throws` for every path that can throw (constructor DI failures, explicit
  `throw`, contract violations, Zod parse errors). Public + protected members
  get JSDoc; private helpers get JSDoc when non-trivial, an inline comment when
  trivial.
- **Interfaces / type aliases / enums** — one-line summary above the
  declaration; one-line JSDoc on every property/member (or inline `/** */`
  in-line) that isn't obvious from its name + type. Interface members with a
  controlled default include `@default`.
- **Constants (`DEFAULT_*_CONFIG`, `NETWORK_EVENTS`, …)** — one-line summary;
  for maps, note the intended consumer of each key.
- **DI tokens (`Symbol()` exports)** — one-line summary naming the interface the
  token binds and where it's provided.
- **Decorators** — one-line summary + a small `@example` of the decorator
  applied to a class/method.
- **React components / hooks / providers / contexts** — one-line summary +
  `@example` of the intended import path and call
  (`import { X } from '@stackra/<pkg>/react'`). Compound components document
  `.Header`, `.Content`, etc. on the root's JSDoc.

### `@example` blocks

- Fenced ` ```typescript ` (or ` ```tsx ` for React), ≤ 6 lines.
- The `import` in the example uses the package's real public entry point
  (`@stackra/network`, `@stackra/ui/react`). Never invent a subpath.
- Show a plausible call, not a toy `foo(1, 2)`. Reuse the same names as
  canonical files above (`useInject<NetworkService>(NETWORK_SERVICE)`).

### First-line contract

The first line of every JSDoc block is a one-sentence summary that **ends with a
period**. Blank line, then longer paragraphs and tags. The one-liner is what
shows up in IDE hovers — make it useful.

## Rule — detailed inline comments on non-trivial logic

Docblocks describe **what** and **why**; inline `//` comments describe **how**
and **because**. Every source file the agent creates or substantially edits must
carry inline comments explaining any of:

- **Non-obvious flow** — branches, guard clauses, early returns whose reason is
  not immediately readable from the code.
- **Fail-soft behaviour** — `try/catch` blocks that swallow errors need a
  `// fail-soft — <why swallowing is safe here>` comment.
- **Ordering constraints** — steps that must happen in a specific order
  (`// register BEFORE dispatching to avoid a race with …`).
- **Non-obvious empty states** — `return`s with no value, `null`s passed
  intentionally, defensive `?? []` fallbacks.
- **External-behaviour ties** — anywhere the code depends on framework lifecycle
  (`onModuleInit` seeding, `onApplicationBootstrap` discovery), platform quirks
  (SSR, hydration, event-loop timing), or third-party contract quirks (React 19
  `use()`, HeroUI compound parts, Vitest's transformer).
- **Section boundaries in longer classes** — for classes with more than ~4
  members, use section dividers to group Public API / Lifecycle / Private,
  following the `network.service.ts` shape:

  ```typescript
  // ── Public API ────────────────────────────────────────────────
  …
  // ── Lifecycle ─────────────────────────────────────────────────
  …
  // ── Private ───────────────────────────────────────────────────
  …
  ```

Inline comments **precede** the line or block they describe, on their own line,
at the same indentation. End-of-line trailing comments (`code(); // comment`)
are permitted for one-word annotations (`// fallback`, `// noop`) but never for
full sentences.

### What NOT to comment

- **Don't restate the code.** `// increment i` above `i++` is noise.
- **Don't narrate the obvious.** `// return the result` above `return result;`
  is noise.
- **Don't leave dead `// TODO:` without an owner or a tracking reference.**
  Prefer a linked issue or an actionable comment
  (`// TODO(#123): switch to X once Y ships`).
- **Don't paraphrase the docblock.** If the JSDoc already said it, don't repeat
  it inside the method body.

## Rule — docblock style

- **Tone**: technical, precise, present tense, active voice. No marketing
  language, no emojis, no exclamation marks. Match the terseness of
  `network.service.ts`.
- **Types in prose** — reference workspace types via short names
  (`INetworkStatus`, `IAiClient`, `EVENT_EMITTER`), not their full import path.
  Use `{@link Symbol}` for cross-file references the IDE should linkify.
- **No `import(...)` type annotations in docblocks.** Docblocks are read by
  humans; the compiler already knows the types.
- **`@param` order matches the parameter order** in the signature. Every
  parameter that isn't fully self-documenting gets a description; `id`,
  `options`, and `signal: AbortSignal` can be documented tersely or with just
  the name.
- **`@returns` for every non-void function.** Include shape when it's not
  obvious.
- **`@throws` for every path that can throw**, naming the error class when
  applicable.
- **Preserve existing docblocks.** Augment or correct only when they are
  factually wrong or stale (renamed params, changed return types, moved
  responsibility). Never rewrite for style alone.

## Rule — interfaces and type aliases carry per-property JSDoc

Interfaces and top-level types get:

- A one-line summary above the declaration.
- Per-property JSDoc (block or inline) on every field whose meaning isn't
  obvious from its name and type. Include `@default` for optional fields that
  have a documented default in `mergeConfig`.
- Component props interfaces document every prop — no exceptions. `children`,
  `className`, `aria-label` are documented tersely.

```typescript
/** Configuration for the offline banner. */
export interface OfflineBannerProps {
  /** Text shown when the device is offline. */
  message?: string;

  /** Additional CSS classes appended to the root. */
  className?: string;
}
```

## Rule — barrels are documented, then boring

`index.ts` barrels get the top-of-file docblock (see above) and then contain
only re-exports. Do **not** add JSDoc to a `export … from '…'` line — the source
file's docblock is the source of truth. The barrel's job is to hoist those
symbols to a public subpath, nothing else.

## Enforcement

Zero-hit greps that must pass:

- **File missing `@file` / `@module` / `@description`** — every `.ts` / `.tsx`
  under `src/` (including `index.ts`) must have all three tags in its
  top-of-file docblock.
- **Exported symbol missing a JSDoc block** — every
  `^export (class|interface|type|enum|const|function|abstract class)` line must
  be preceded by a `*/` (closing a JSDoc block) or by another `export` line the
  block already covers.
- **`@param` mismatch** — parameter count / order / names in the JSDoc must
  match the signature.
- **`@returns` on a `void` function** — remove; add on a non-void function
  without one.
- **`@throws` missing on a method that has `throw` in its body** — add.
- **`@example` uses a fake import path** (a subpath the package doesn't publish)
  — fix.
- **End-of-line trailing sentence comments** (`code; // long sentence.`) — hoist
  to a preceding line.
- **`TODO:` without an owner or issue link** — attach one or remove.

## When you're tempted

- **"The name says it all — the JSDoc feels redundant."** Write it anyway. The
  first line of the block is what IDE hovers show; a redundant one-liner
  ("Returns the current status.") is better than nothing. Save terseness for the
  following paragraphs.
- **"Inline comments will bit-rot."** They will if the doc lies. Keep them close
  to the line they describe, and update them in the same commit that changes the
  code. A dead comment is worse than none.
- **"I'll add the docblocks in a follow-up."** No — docblocks land with the
  code. A file without a top-of-file block is not reviewable; a method without
  JSDoc is unreleasable.

# UI Component Rules

Rules for any package that ships React (or React Native) components.

## Rule — build on `@stackra/ui`, never hand-roll UI

Every visual component MUST be composed from HeroUI / HeroUI Pro primitives
re-exported by `@stackra/ui`:

- Web: `import { … } from '@stackra/ui/react'` (re-exports all `@heroui/react` +
  `@heroui-pro/react`).
- Native: `import { … } from '@stackra/ui/native'`.

Do **not**:

- Hand-roll semantic markup with bespoke class names (e.g.
  `<span className="network-indicator">`). Use the matching HeroUI component
  (`Chip`, `Alert`, `Badge`, …).
- Ship custom CSS / `.css` files / BEM class strings for component styling.
  HeroUI owns the styling layer.
- Reach past `@stackra/ui` straight into `@heroui/react` from a feature package
  — always go through `@stackra/ui` so the design system stays a single
  swappable dependency.

Allowed: standard Tailwind **layout** utilities for composition only (`flex`,
`gap-*`, `mt-*`, `w-full`, …) and passthrough `className` props. These arrange
HeroUI components; they don't restyle them. This mirrors HeroUI's own docs
examples.

`@stackra/ui` is declared as an **optional peer** on packages that ship
components (so headless consumers aren't forced to install it), and a dev
dependency so the package type-checks and builds.

## Rule — always prefer `ComboBox` over `Select`

When a component needs a single-choice dropdown, use HeroUI **`ComboBox`**, not
`Select`. `ComboBox` gives a filterable text input for free, so the control
scales as the option list grows. Reserve `Select` only for the rare case where
free-text search is explicitly undesirable — and justify it in a comment.

### API differences to remember

`ComboBox` is **not** a drop-in swap for `Select`:

| Concern          | `Select`                    | `ComboBox`                                   |
| ---------------- | --------------------------- | -------------------------------------------- |
| Controlled value | `value` / `onChange`        | `selectedKey` / `onSelectionChange`          |
| Change payload   | `Key \| Key[] \| null`      | `Key \| null` (single)                       |
| Trigger anatomy  | `Select.Trigger` + `.Value` | `ComboBox.InputGroup` → `Input` + `.Trigger` |
| Open behaviour   | click                       | `menuTrigger="focus" \| "input" \| "manual"` |

```tsx
// ✅ CORRECT — searchable single-select on ComboBox.
import { ComboBox, Input, Label, ListBox } from "@stackra/ui/react";

<ComboBox
  selectedKey={value}
  onSelectionChange={(key) => setValue(key)}
  menuTrigger="focus"
>
  <Label>Scope</Label>
  <ComboBox.InputGroup>
    <Input placeholder="Search scope..." />
    <ComboBox.Trigger />
  </ComboBox.InputGroup>
  <ComboBox.Popover>
    <ListBox>
      {options.map((o) => (
        <ListBox.Item key={o.id} id={o.id} textValue={o.label}>
          {o.label}
          <ListBox.ItemIndicator />
        </ListBox.Item>
      ))}
    </ListBox>
  </ComboBox.Popover>
</ComboBox>;
```

## Rule — verify component APIs against the HeroUI MCP

Before shipping a component, confirm the compound API (part names, prop names,
controlled-value contract) against the HeroUI MCP (`get_component_docs`). HeroUI
v3 is compound-first and the exact part names differ per component — never guess
them.

## Rule — Title-Case headings, no ALL-CAPS

Design taste rule (mirrors `.kiro/agents/heroui-ui-builder.md` "Title Case
(never ALL CAPS) headings"): every heading, section label, and micro-header
renders in Title Case. Do not apply the Tailwind `uppercase` utility to
headings, `<h1..h6>`, or nav-rail category labels.

### Exemption — command-palette aesthetic in `@stackra/kbd`

The `@stackra/kbd` package (Command Palette + Keyboard Catalog) intentionally
inherits the Raycast / Linear / Shopify command-palette visual language, which
uses ALL-CAPS + `tracking-[0.08em]` micro- headers as a genre convention. Both
hits in `keyboard-catalog.component.tsx` (section headers + inline scope labels)
are exempt.

Every exemption call site carries an inline
`// uppercase — kbd command-palette aesthetic` comment so reviewers see the
rationale without opening this file.

## Note — known upstream gap: `Popover` trigger + `aria-haspopup`

HeroUI's `Popover` does not stamp `aria-haspopup="dialog"` on its trigger — it
only stamps `aria-expanded` (from mount) and `aria-controls` (once open). Screen
readers still get the disclosure signal, so this is not blocking, but axe-core
and WAI-ARIA authoring practices both list `aria-haspopup` as the canonical
attribute for "this control opens a popup".

Do **not** hand-stamp `aria-haspopup="dialog"` on individual Popover triggers as
a workaround — the noise is not worth carrying until HeroUI ships the fix. Full
report + suggested upstream fix:
[`.kiro/reports/heroui-aria-haspopup-upstream-2026-07-21.md`](../reports/heroui-aria-haspopup-upstream-2026-07-21.md).

## Enforcement

- Search component `src/**/*.tsx` for bespoke class-name literals
  (`className="some-custom-name"`). Zero hits — only passthrough `className`
  variables and Tailwind layout utilities are allowed.
- Search for `<Select` in feature packages. Each hit must carry a comment
  justifying why search is undesirable; otherwise convert to `ComboBox`.
- Search for direct `@heroui/react` / `@heroui-pro/react` imports in feature
  packages. Zero hits — import through `@stackra/ui`.

## Note — logic-only components are exempt

Components that render no UI of their own — the base error boundary
(`ErrorBoundary` from `@stackra/error`), routing wrappers (`Link`,
`StackraRouter`), head/SEO renderers (`Meta`), DI providers — have nothing to
restyle and are **not** subject to the HeroUI rule. They render `children` /
caller-provided `fallback` and own no markup. Do not delete them and do not
force HeroUI into them.

Note: the _default fallbacks_ shipped by `@stackra/error`
(`DefaultErrorFallback`, `InlineErrorFallback`) **do** render UI and so **are**
subject to the HeroUI rule — they are built on `@stackra/ui` primitives (`Card`,
`Alert`, `Button`).

## Rule — React subpath folder structure

The `react` subpath of a package mirrors the canonical `@stackra/ui` layout.
Each concern gets its own folder:

```
src/
  core/            # platform-agnostic runtime: module, services, registries,
                   # adapters, types, tokens, utils — NO web-DOM code.
    hooks/         # ONLY cross-platform React hooks that a `native` subpath
                   # ALSO consumes (pure React + @stackra/container/react,
                   # no DOM APIs). Re-exported by both react + native.
  react/
    components/    # HeroUI / DOM components (*.component.tsx)
    providers/     # React context providers (*.provider.tsx)
    contexts/      # createContext definitions (*.context.ts)
    hooks/         # React hooks (default home for hooks)
    interfaces/    # component/provider prop interfaces
  native/          # React Native equivalents (when present)
```

### Where does a hook go?

- **Default: `react/hooks/`.** A hook is React and belongs in the react subpath.
- **Exception: `core/hooks/`** — only when the package has a `native` subpath
  that shares the exact same hook. Cross-platform hooks live in `core/hooks`
  (native cannot import the web `react/` subpath), and both `react/index.ts` and
  `native/index.ts` re-export them. `core/index.ts` may export them too (the `.`
  entry is cross-platform).

### Providers and contexts

- A context provider is **never** a `component/`. It lives in
  `react/providers/<name>/<name>.provider.tsx`.
- Its `createContext` lives in `react/contexts/<name>.context.ts`.
- The `useX()` consumer hook lives in `react/hooks/` (or `core/hooks` if
  cross-platform per the rule above).

Example (CSP): `NonceProvider` → `react/providers/nonce/nonce.provider.tsx`;
`NonceContext` → `react/contexts/nonce.context.ts`; `useNonce` →
`react/hooks/use-nonce.hook.ts`.

## Enforcement

- Search `react/components/**` for files exporting a `createContext` provider
  (`*.provider.tsx` under components). Zero hits — move to `react/providers/`.
- A `core/hooks/` folder is allowed ONLY when a `native/` subpath exists and
  re-exports it. Otherwise hooks belong in `react/hooks/`.

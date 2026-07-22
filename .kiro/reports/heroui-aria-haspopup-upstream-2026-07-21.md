# HeroUI Button + Popover — missing `aria-haspopup` on the trigger

**Status.** Upstream ergonomic gap. Not a regression in our code.
Copy-paste-ready for a HeroUI issue.

**Reporters.** Frontend UI reviewer (Round 6) + P1 close-out session
(2026-07-21). Documented in
[`ui-p1-fixes-2026-07-21.md`](./ui-p1-fixes-2026-07-21.md) §Fix 3, follow-up
flag 2.

---

## Summary

When a `<Button>` from `@heroui/react` is nested inside a `<Popover>`, HeroUI
does **not** stamp `aria-haspopup="dialog"` (or `"listbox"` / `"menu"` etc.) on
the trigger. It only stamps `aria-expanded` (from mount) and `aria-controls`
(populated when the popover opens).

Screen readers can still announce the disclosure relationship via
`aria-expanded` + `aria-controls`, so this is not a P0. It IS an ergonomic gap:
WAI-ARIA authoring practices +
[axe-core rule `aria-required-attr`](https://dequeuniversity.com/rules/axe/4.10/aria-required-attr)
both list `aria-haspopup` as the canonical signal for "this control opens a
popup", and audits routinely flag any Popover trigger that lacks it.

## Where we hit it

Package: `@stackra/ui` (a re-export layer over `@heroui/react` +
`@heroui-pro/react`).

Concrete call site — the country-picker trigger inside our phone input:

```tsx
// packages/frontend/ui/src/react/components/phone-input/phone-input.component.tsx
<Popover>
  <Button aria-label={`Selected country: ${selectedCountry}, +${callingCode}`}>
    {/* flag + calling code */}
  </Button>
  <Popover.Content className="w-64">
    <Popover.Dialog className="p-1">
      <ListBox
        aria-label="Country"
        selectionMode="single"
        onSelectionChange={handleCountryChange}
      >
        {/* options */}
      </ListBox>
    </Popover.Dialog>
  </Popover.Content>
</Popover>
```

## What React Aria actually stamps

Rendered DOM at rest (before open):

```html
<button
  aria-label="Selected country: US, +1"
  aria-expanded="false"
  data-slot="button"
  type="button"
>
  ...
</button>
```

After open:

```html
<button
  aria-label="Selected country: US, +1"
  aria-expanded="true"
  aria-controls="react-aria-1234"
  data-slot="button"
  type="button"
>
  ...
</button>
```

Note the absent `aria-haspopup`.

## Expected behaviour

The trigger element in a `Popover` (`DialogTrigger` under the hood in React Aria
Components) should stamp `aria-haspopup="dialog"` by default. When the Popover
wraps a `ListBox` / `Menu`, the value should mirror the child's role
(`aria-haspopup="listbox"` / `"menu"`).

This matches:

- WAI-ARIA authoring practices — disclosure buttons declare the type of popup
  they open via `aria-haspopup`.
- React Aria (raw hooks) — `useOverlayTrigger({ type: 'dialog' })` returns a
  `triggerProps` object with `aria-haspopup: 'dialog'`. Users of the low-level
  hook get it for free.
- Radix UI's `Popover.Trigger` — stamps `aria-haspopup="dialog"` on the trigger.

React Aria Components' `DialogTrigger` (the primitive that HeroUI's `Popover`
composes) appears to drop the `aria-haspopup` prop somewhere between the hook
layer and the rendered element. HeroUI's `Popover` wrapper does not re-add it.

## Suggested fix (HeroUI side)

Two options, ranked by scope:

1. **Fix in HeroUI's Popover.** Extend the trigger slot's rendered props to
   include `aria-haspopup="dialog"` (or a `type` prop that lets the caller opt
   into `"menu"` / `"listbox"` when the Popover wraps a Menu / ListBox).
2. **Fix in React Aria Components upstream.** File a follow-up against
   `react-aria-components`' `DialogTrigger` to preserve the `aria-haspopup` prop
   from `useOverlayTrigger` onto the rendered trigger element. This fixes every
   consumer of React Aria Components, not just HeroUI.

Option 1 is the tighter scope — HeroUI can ship the fix without waiting on React
Aria.

## Workaround (our side, until upstream lands)

Manually stamp the attribute on the trigger:

```tsx
<Popover>
  <Button
    aria-label={...}
    aria-haspopup="dialog"   // manual — remove once HeroUI stamps it
  >
    ...
  </Button>
  <Popover.Content>...</Popover.Content>
</Popover>
```

We are **not** applying this workaround right now — the current disclosure via
`aria-expanded` + `aria-controls` is sufficient for AT, and hard-coding
`aria-haspopup="dialog"` on every Popover trigger in the workspace to work
around the gap adds noise we would then have to unwind when HeroUI ships.
Revisit once an axe-core audit surfaces the missing attribute as a P1.

## References

- HeroUI React docs — `Popover` compound API:
  https://www.heroui.com/docs/components/popover
- React Aria Components — `DialogTrigger`:
  https://react-spectrum.adobe.com/react-aria/DialogTrigger.html
- MDN — `aria-haspopup`:
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-haspopup
- WAI-ARIA 1.2 — 6.6.2 Disclosure buttons

## Local cross-references

- [`.kiro/reports/ui-p1-fixes-2026-07-21.md`](./ui-p1-fixes-2026-07-21.md) — the
  session where we hit this, §Fix 3 (PhoneInput country picker) + follow-up
  flag 2.
- [`.kiro/steering/ui-components.md`](../steering/ui-components.md) — the UI
  component rule set (mentions the gap in its note on `Popover` triggers).

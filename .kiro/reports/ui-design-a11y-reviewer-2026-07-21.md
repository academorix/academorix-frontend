# UI Design + Accessibility Review — 2026-07-21

**Scope (READ-ONLY):** packages/frontend/ui/**,
packages/frontend/{notifications,consent,csp,dashboard,devtools,error,kbd,pwa,sdui,settings}/**,
packages/frontend/{routing,container,ai}/src/react/**.

**Rules audited:** .kiro/steering/ui-components.md (build on @stackra/ui, HeroUI
compound APIs, ComboBox over Select, no bespoke CSS/class-name literals, onPress
over onClick), plus HeroUI v3 design taste (semantic tokens, whitespace,
tabular-nums, Title-Case, no nested surfaces), WCAG 2.2 AA.

---

## 1. Executive summary

**Verdict: YELLOW.** The workspace is broadly compliant with `ui-components.md`.
The structural rules (Rules 1-3 in the steering doc) are all satisfied at
zero-hit-grep confidence. The findings below are concentrated in compound-API
drift (three broken ARIA tab patterns), one dead interactive control
(`PhoneInput` country picker), and a handful of design-taste nits (nested
surfaces, ALL-CAPS micro-headers, arbitrary Tailwind pixel values).

**Green highlights**

- Zero direct `@heroui/react` / `@heroui-pro/react` imports in feature packages
  — every consumer goes through `@stackra/ui/react` or `@stackra/ui/native`.
- Zero bespoke class-name literals — every `className` is a Tailwind utility or
  a passthrough variable.
- Zero `Divider`, `Progress`, `CardHeader` (v2 flat) imports.
- Zero forbidden CSS files inside feature packages — the only `.css` hits are
  `ui/src/react/styles/{controllers,globals,rtl}.css` (the design system itself)
  and `theming/src/react/styles/theme-presets.css` (design-token overrides, not
  component styling).
- Every icon-only Button we found carries `aria-label` (well-thought edge case
  in `pin-lock` for scramble mode).

**Where to focus**

- Three `role="tab"` widgets that lack keyboard support (P1).
- One `Chip` used as a click target with no accessible name (P1).
- One dead country picker in `PhoneInput` (P1).
- Nested surface + `Card.Header` reinvented (P2).
- ALL-CAPS + arbitrary pixel typography in `kbd` (P3).

---

## 2. `@heroui/react` + `@heroui-pro/react` direct-import leaks

**Zero violations in feature packages.** The only hits are within
`packages/frontend/ui/src/**` (the design-system package itself, which is the
intended owner of those imports).

`packages/frontend/ui/src/react/index.ts` re-exports every symbol from both
HeroUI OSS and Pro. `packages/frontend/ui/src/native/index.ts` does the same for
`heroui-native` + `heroui-native-pro`. Consumers strictly go through
`@stackra/ui/react` / `@stackra/ui/native`. Spot-checked feature imports:

- `packages/frontend/scope/src/react/components/scope-switcher/scope-switcher.component.tsx:20`
  → `from "@stackra/ui/react"`.
- `packages/frontend/consent/src/react/components/consent-banner/consent-banner.component.tsx:9`
  → `from "@stackra/ui/react"`.
- `packages/frontend/notifications/src/react/components/notification-row/notification-row.component.tsx:16`
  → `from "@stackra/ui/react"`.

Nothing to fix. ✅

---

## 3. Bespoke class-name literals

**Zero violations.** The wide-net grep for kebab-case class-name literals found
only:

- Tailwind utilities (`cursor-pointer`, `text-xs`, `text-muted`, `tabular-nums`,
  `font-medium`, layout classes, semantic tokens).
- Custom classes passed through `className` in test files (`my-tabs`,
  `my-modal`, `my-tip`, …) which exist to verify className pass-through and are
  allowed.

No hand-rolled BEM/CSS-module class names. ✅

---

## 4. Custom `.css` files inside feature packages

**Zero violations.** The four `.css` files found are:

- `packages/frontend/ui/src/react/styles/controllers.css` — owned by the design
  system (`@stackra/ui`).
- `packages/frontend/ui/src/react/styles/rtl.css` — same.
- `packages/frontend/ui/src/react/styles/globals.css` — same.
- `packages/frontend/theming/src/react/styles/theme-presets.css` —
  CSS-custom-property overrides for 11 design-token themes (`--accent`,
  `--surface`, `--chart-*`). No component styling; only design-token variables.
  This is what HeroUI v3 theming is for.

Nothing to fix. ✅

---

## 5. `<Select>` without `ComboBox` justification

**Zero unjustified `Select` uses.** Web feature packages use `ComboBox`:

- `packages/frontend/settings/src/react/components/setting-field/setting-field.component.tsx:23,231`
  — imports and uses `ComboBox`. Line 74 `case ControlType.Select:` is an enum
  branch that dispatches to `ComboBoxRenderer` with an explicit comment (line
  225: "Per `.kiro/steering/ui-components.md`, ComboBox beats Select for every
  single-choice dropdown"). ✅
- `packages/frontend/scope/src/react/components/scope-switcher/scope-switcher.component.tsx`
  — `ComboBox`. ✅
- `packages/frontend/i18n/src/react/components/language-selector/language-selector.component.tsx`
  — `ComboBox`. ✅

The native
`packages/frontend/scope/src/native/components/scope-switcher/scope-switcher.component.tsx`
does use `Select` — with a documented native-only justification (lines 5-14:
HeroUI Native has no `ComboBox`, native `Select` is the searchable primitive).
✅ Exempt.

---

## 6. `onClick` on interactive HeroUI components

Every `onClick` in production code, ranked:

| File:line                                                           | Component                                   | Verdict                                                                                                                                                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kbd/.../command-palette/layouts/clean.layout.tsx:65`               | HeroUI `Chip`                               | **P1 violation** — `Chip` has no `onClick` prop; see §9.                                                                                                                                                                     |
| `devtools/.../devtools-launcher/devtools-launcher.component.tsx:44` | `PressableFeedback` root                    | P3 nit — root renders a native `<button>` (docs: "supports all native `button` HTML attributes"), so `onClick` is technically valid. But the pattern drifts from the codebase `onPress` convention. See §11 open question 1. |
| `devtools/.../devtools-nav-item/devtools-nav-item.component.tsx:32` | `PressableFeedback` root                    | Same as above.                                                                                                                                                                                                               |
| `devtools/.../devtools-inspector-overlay.component.tsx:163`         | native `<button type="button">`             | OK — native element.                                                                                                                                                                                                         |
| `ui/.../file-upload.component.tsx:142`                              | native `<div role="button">`                | OK — native element.                                                                                                                                                                                                         |
| `routing/.../link.component.tsx:140`                                | native `<a>` (this IS the `Link` component) | OK — the routing Link is documented to intercept native `onClick`.                                                                                                                                                           |
| `notifications/.../notification-drawer.component.tsx:165, 188`      | native `<button>`                           | OK — native element.                                                                                                                                                                                                         |
| `notifications/.../inbox-page.component.tsx:148, 163`               | native `<button>`                           | OK — native element.                                                                                                                                                                                                         |
| tests, `*.spec.tsx` in devtools/error/ui/actions                    | test-mocks                                  | OK — tests.                                                                                                                                                                                                                  |
| JSDoc `@example` blocks in `sdui/`, `actions/`, `error/`            | doc                                         | OK — comments.                                                                                                                                                                                                               |

**Net finding:** one clear P1 (Chip), two P3-drift (PressableFeedback root vs
the `onPress` convention).

---

## 7. `Divider` → `Separator`

**Zero violations.** The only `Divider` hits are:

- `ui/.../section-container.component.tsx:56` — a `{/* Divider */}` JSX comment
  above a `Separator` render. Human-readable comment; not a component reference.
  ✅
- `devtools/__tests__/unit/devtools-shell.spec.tsx:95` — a test passthrough mock
  (`Divider: Passthrough`). ✅ Tests only.

No production code imports `Divider` from HeroUI. `Separator` is used correctly
throughout. ✅

---

## 8. A11y findings (grouped by severity)

### P1 — three broken `role="tab"` widgets

The WAI-ARIA "Tab" pattern requires arrow-key navigation between tabs,
`aria-controls` linking each tab to its panel, and a matching `id` on the tab
that the panel `aria-labelledby` targets. The three call sites below stamp
`role="tablist"` / `role="tab"` / `role="tabpanel"` but implement **none** of
these. Screen readers announce "tab 1 of 2, selected", but keyboard users cannot
arrow between tabs and cannot follow the tab→panel binding.

**A.
`packages/frontend/ui/src/react/components/progress-tabs/progress-tabs.component.tsx:114, 175`**

`ProgressTabsList` wraps a HeroUI Pro `Stepper` in a `<div role="tablist">`, and
`ProgressTabsContent` renders
`<div role="tabpanel" aria-labelledby={"tab-" + value}>`. Nothing in the
workspace ever renders a matching `id="tab-<value>"` — the `aria-labelledby`
reference is dangling. `Stepper` also has no arrow-key tab navigation built in.

**Fix options:**

- Preferred: rebuild `ProgressTabs` on HeroUI `Tabs` compound (which handles
  arrow keys, `aria-controls`, and panel semantics natively) and style each
  `Tabs.Trigger` to look like a Stepper step.
- Alternative: drop the `role="tab"` / `role="tabpanel"` / `role="tablist"` from
  the current implementation — the component becomes a plain "progress-driven
  content switcher", which is honest ARIA.

**B.
`packages/frontend/notifications/src/react/components/notification-drawer/notification-drawer.component.tsx:145, 157`**

Section chooser: `<div role="tablist" aria-label="Sections">` with
`<button role="tab" aria-selected={...}>` children. No arrow-key handler, no
`aria-controls`, no panel with `aria-labelledby`.

**Fix:** either swap to HeroUI `Tabs` OR drop the tab semantics and treat as a
plain toggle-button group (drop `role="tab"` / `role="tablist"`, use
`aria-pressed` on `<button>`).

**C.
`packages/frontend/notifications/src/react/pages/inbox-page/inbox-page.component.tsx:129, 140`**

Identical shape to (B). Same fix.

### P1 — Chip with `onClick`, no accessible name

**`packages/frontend/kbd/src/components/command-palette/layouts/clean.layout.tsx:56-67`**

HeroUI v3 `Chip` has no `onClick` prop (confirmed via `get_component_docs`);
`Chip` renders a display element with no `role="button"`, no keyboard support,
no focus ring. Adding `cursor-pointer` misleads sighted users; screen readers
and keyboard users cannot interact with it. Also breaks the workspace rule
"onPress not onClick" for HeroUI components.

**Fix:** wrap in a native `<button>`, matching the pattern the notifications
drawer uses — Chip inside a native `<button>` with `aria-label` and focus-ring
utilities.

### P1 — Dead interactive country picker

**`packages/frontend/ui/src/react/components/phone-input/phone-input.component.tsx:196-236`**

The country-picker branch renders a `<Button aria-label={...}>` with no
`onPress` handler and no attached menu. Line 132 `useCallback((key) => {...})`
declares a handler assigned to nothing (dead code). The comment "Country change
handler (reserved for future picker implementation)" confirms this is
unfinished.

**Impact:** screen readers announce an interactive control ("button, Selected
country: US, +1"). Keyboard users can Tab to and Enter it — nothing happens.
This is deceptive UI.

**Fix options:**

1. Wire the dropdown (e.g., HeroUI `Dropdown` or `ComboBox` with the country
   list) so the button opens a real picker.
2. If the picker is genuinely deferred, replace the `<Button>` with the same
   read-only `<span>` used in the `disableDropdown` branch (line 199-208). The
   `<Button>` should only exist when it does something.

### P2 — Nested surface in error fallback

**`packages/frontend/error/src/react/components/fallbacks/default-error-fallback/default-error-fallback.component.tsx:64-70`**

A nested `<Card variant="secondary">` inside `<Card.Content>` — HeroUI design
taste prohibits nested surfaces (double `shadow-surface`, two elevations, visual
muddle). Replace with a plain themed panel:
`<div className="bg-surface-secondary rounded-lg p-3">…</div>` for the
stack-trace section.

### P3 — Icon-only buttons without `Tooltip`

The design-taste rule wraps every icon-only Button in a `Tooltip` so sighted
users get the same disambiguating text screen readers get from `aria-label`. All
three below have `aria-label` (so a11y is covered), but sighted users do not see
the affordance.

- `packages/frontend/kbd/src/components/keyboard-catalog-trigger/keyboard-catalog-trigger.component.tsx:23`
- `packages/frontend/kbd/src/components/keyboard-hints-toggle/keyboard-hints-toggle.component.tsx:26`
- `packages/frontend/notifications/src/react/components/notification-bell/notification-bell.component.tsx:47`

**Reference to copy from:** the devtools trio (`devtools-inspector-toolbar`,
`devtools-position-menu`) wraps every icon-only Button in `Tooltip` correctly.

---

## 9. HeroUI compound API drift — spot-check findings

Verified against `get_component_docs` for `AlertDialog`, `ComboBox`, `Tooltip`,
`Chip`, `PressableFeedback`. Spot-check subjects:

**Compliant compound API (green):**

- `ui/.../confirm-dialog.component.tsx` — full v3 `AlertDialog` anatomy:
  `Backdrop → Container → Dialog → CloseTrigger`, `Header (Icon + Heading)`,
  `Body`, `Footer` with `slot="close"`-style buttons that use `onPress` +
  `isPending` + `variant`. ✅
- `ui/.../focus-modal.component.tsx` — full v3 `Modal` anatomy
  (`Backdrop → Container → Dialog`, `Header (Heading + CloseTrigger)`, `Body`,
  `Footer`). ✅
- `ui/.../inline-tip.component.tsx` — v3 `Alert` compound (`Indicator`,
  `Content`, `Title`, `Description`) with correct `status` prop; drops v2
  `variant="soft"`. ✅
- `ui/.../status-badge.component.tsx` — v3 `Chip` with `Chip.Label` + v3
  `accent` color token (drops v2 `primary`). ✅
- `ui/.../json-view-section.component.tsx` — v3 `Disclosure` compound
  (`Heading`, `Trigger`, `Indicator`, `Content`). ✅
- `settings/.../setting-field.component.tsx` (ComboBoxRenderer) — matches the v3
  `ComboBox` anatomy exactly (`Label`, `InputGroup(Input, Trigger)`,
  `Popover(ListBox(Item(textValue, ItemIndicator)))`). ✅
- `consent/.../consent-banner.component.tsx` — full v3 `Card` (`Header`,
  `Title`, `Description`, `Content`, `Footer`) + `Switch` compound (`Content`,
  `Control`, `Thumb`). ✅
- `pwa/.../install-prompt-banner.component.tsx` — same `Card` shape. ✅
- `error/.../default-error-fallback.component.tsx` — `Card` + `Alert` compounds
  used correctly (aside from the nested Card, §8 P2).
- `devtools/.../devtools-inspector-toolbar.component.tsx`,
  `devtools-position-menu.component.tsx` — icon-only Button correctly wrapped in
  `Tooltip.Trigger + Tooltip.Content`. ✅

**Drift found:**

**P2 — `section-container` reinvents `Card.Header`**

`ui/.../section-container.component.tsx:52-59` renders the title strip with a
hand-rolled `<div>` + `<h3>` + `<p>` inside `<Card>` and `<Separator>`, instead
of using `Card.Header` / `Card.Title` / `Card.Description`. Migrate to the
compound so screen readers and Tailwind theme presets see the semantic parts.

**P3 — ALL-CAPS micro-headers**

Design-taste rule: Title-Case, no ALL-CAPS. Current hits:

- `kbd/.../keyboard-catalog.component.tsx:181` — `<h3 class="… uppercase">`
- `kbd/.../keyboard-catalog.component.tsx:239` — `<span class="… uppercase">`
- `devtools/.../devtools-nav-rail.component.tsx:88` — `<h3 class="… uppercase">`

The `kbd` package inherits a "command palette" aesthetic from Raycast/Linear
where uppercase micro-headers are conventional. Consider a case-by-case
exemption in the palette or migrate to Title-Case.

**P3 — Arbitrary pixel typography**

HeroUI Pro ships semantic typography tokens (`text-xs`, `text-sm`, etc.);
arbitrary `text-[10px]` / `text-[11px]` / `tracking-[0.08em]` sidesteps them.
Hits in `kbd/keyboard-catalog.component.tsx` (7 lines),
`kbd/shortcut-display.component.tsx:69`,
`kbd/command-palette/layouts/shared.tsx:38`. Prefer `text-xs` / `tracking-wide`
(HeroUI tokens) unless the palette specifically needs sub-pixel visual density.

**P3 — `PressableFeedback` root vs `onPress` convention**

`devtools-launcher.component.tsx:44` and `devtools-nav-item.component.tsx:32`
use `<PressableFeedback>` as a standalone pressable button with `onClick`. The
API docs say the root "renders a `button` element by default" and "supports all
native `button` HTML attributes", so `onClick` is a valid native attribute — but
the docs example patterns nest `PressableFeedback.Ripple` / `.Highlight` INSIDE
a `<Button>` rather than using the root as a standalone element. Aligning on one
pattern would tidy the codebase. See §11 open question 1.

---

## 10. Findings by priority

**P0 — none.** No fundamentally broken or WCAG-blocking issues.

**P1 — 5 items (broken / rule-violation):**

1. Broken `role="tab"` in `ui/.../progress-tabs.component.tsx:114,175` (no
   keyboard nav, dangling `aria-labelledby`).
2. Broken `role="tab"` in
   `notifications/.../notification-drawer.component.tsx:145,157`.
3. Broken `role="tab"` in `notifications/.../inbox-page.component.tsx:129,140`.
4. `Chip` with `onClick` in
   `kbd/.../command-palette/layouts/clean.layout.tsx:65` (no accessible
   name/keyboard support; HeroUI Chip has no `onClick` prop).
5. Dead interactive country picker in `ui/.../phone-input.component.tsx:219-235`
   (button with no handler).

**P2 — 2 items (drift):**

6. Nested `<Card>` inside `<Card.Content>` in
   `error/.../default-error-fallback.component.tsx:64-70`.
7. `section-container.component.tsx` reinvents `Card.Header` / `Card.Title` /
   `Card.Description`.

**P3 — 6 items (nits):**

8. Icon-only Buttons without `Tooltip` in three call sites (`kbd`
   catalog-trigger, `kbd` hints-toggle, `notifications` bell).
9. ALL-CAPS micro-headers in `kbd/keyboard-catalog.component.tsx` and
   `devtools/devtools-nav-rail.component.tsx`.
10. Arbitrary Tailwind pixel typography (`text-[10px]`, `text-[11px]`,
    `tracking-[0.08em]`) across `kbd` package.
11. `PressableFeedback` root with `onClick` in `devtools-launcher.component.tsx`
    and `devtools-nav-item.component.tsx` — technically valid but drifts from
    the codebase `onPress` convention.
12. `section-container.component.tsx` hardcodes `shadow-sm` in addition to
    HeroUI Card own `shadow-surface` — Card already ships elevation; stacking a
    second shadow is design-taste drift.
13. `ProgressTabs.List` wraps HeroUI Pro `Stepper` in a `<div>` — the outer
    `<div>` adds nothing except the incorrect `role="tablist"` (see P1 #1); once
    tabs are fixed, this wrapper likely goes away too.

---

## 11. Open questions for humans

1. **`PressableFeedback` root — standalone or feedback layer only?** The HeroUI
   Pro docs consistently show `PressableFeedback.Ripple` / `.Highlight` nested
   INSIDE a `<Button>`, but the API supports the root as a standalone pressable.
   `devtools-launcher.component.tsx` and `devtools-nav-item.component.tsx` use
   the root as standalone with `onClick`. Should `ui-components.md` pick a rule
   (either "always compose inside a `<Button>`" or "root PressableFeedback is
   fine, use `onPress` for consistency")?

2. **Hand-rolled tab strips in notifications — HeroUI `Tabs` or plain toggle
   group?** The section chooser in `notification-drawer.component.tsx` /
   `inbox-page.component.tsx` is visually a segmented control but wears tab
   ARIA. The two remedies (migrate to HeroUI `Tabs`, or drop the tab roles) each
   ship a different UX. Product decision.

3. **`ProgressTabs` — restart on `Tabs`, or drop the tab semantics?** HeroUI Pro
   `Stepper` does not natively expose tab-panel keyboard navigation.
   `ProgressTabs` today grafts `role="tab"` + `role="tabpanel"` on top, which is
   the broken pattern in §8 P1 (A). Either (a) keep the visual Stepper look but
   drop the tab ARIA (make it a plain progress-driven content switcher), or (b)
   rebuild the compound on HeroUI `Tabs`. Which fits the product intent better?

4. **`kbd` micro-header typography** — the palette uses uppercase `text-[11px]`
   for section headers (Raycast/Linear style). Formal exception in
   `ui-components.md` for keyboard palettes, or Title-Case migration to align
   with the rest of the workspace?

5. **`@stackra/ui` component-naming convention** — the workspace already follows
   a `<Domain><Kind>` shape where `<Kind>` ∈ {Badge, Cell, Container, Dialog,
   Input, Lock, Modal, Section, Tip, View, Upload} ~90 percent consistently.
   Formalising it in a short steering entry (`ui-naming.md`?) would prevent
   future drift. Preview of the ruleset:

- Data display → `-Badge` / `-Cell` (`StatusBadge`, `MoneyAmountCell`).
- Overlays → `-Modal` / `-Dialog` (`FocusModal`, `ConfirmDialog`).
- Inline callouts → `-Tip` (`InlineTip`).
- Layout wrappers → `-Container` (`SectionContainer`).
- Interactive locks → `-Lock` (`PinLock`, `PatternLock`).
- Form inputs → `-Input` (`PhoneInput`).
- Expandable data → `-View` / `-Section` (`JsonViewSection`).
- Compound of an existing HeroUI compound → `-Tabs` / `-Accordion`
  (`ProgressTabs`, `ProgressAccordion`).

---

## Appendix — grep summary

Every zero-hit grep the `ui-components.md` rule enforces:

| Grep                                                 | Hits (excluding `ui/src/**`, `__tests__/**`, `dist/**`) |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `from ["']@heroui/react`                             | 0                                                       |
| `from ["']@heroui-pro/react`                         | 0                                                       |
| `\bDivider\b`                                        | 0 (2 hits are JSX comment + test mock)                  |
| `\bCardHeader\b`, `CardBody`, `CardFooter` (v2 flat) | 0                                                       |
| `\bProgress\b` (v2 Progress)                         | 0                                                       |
| `role="tab"`                                         | 6 (three broken widgets — see §8)                       |
| `onClick` on HeroUI components                       | 1 (Chip in `kbd`)                                       |
| `PressableFeedback` root + `onClick`                 | 2 (devtools; drift, not violation)                      |

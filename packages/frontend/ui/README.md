# @stackra/ui

Client-side UI kit for the Stackra framework. Re-exports HeroUI OSS and HeroUI
Pro components, adds custom composites (`ConfirmDialog`, `FocusModal`,
`FileUpload`, `PhoneInput`, `PinLock`, `PatternLock`, …), React hooks,
providers, contexts, and every heroicon variant plus an Iconify wrapper that
bundles the Gravity UI icon set.

## Install

```bash
pnpm add @stackra/ui @heroui/react @heroicons/react react react-dom tailwindcss
```

### Optional peers

```bash
# HeroUI Pro components (Stepper, Command, Sheet, DataGrid, …)
pnpm add @heroui-pro/react

# Iconify + Gravity UI icons
pnpm add @iconify/react
```

## pnpm approvals for HeroUI Pro

`@heroui-pro/react` runs a postinstall script that downloads licensed CDN
artifacts. pnpm 10+ blocks postinstall by default — allowlist it in your
workspace:

```yaml
# pnpm-workspace.yaml
onlyBuiltDependencies:
  - "@heroui-pro/react"
  - heroui-pro
```

Then authenticate:

```bash
# Interactive (opens a browser)
npx heroui-pro@latest login
npx heroui-pro@latest install

# CI (get a token from https://heroui.pro/dashboard)
export HEROUI_AUTH_TOKEN=…
pnpm install
```

## Usage

```tsx
// HeroUI components + custom composites
import { Button, Card, ConfirmDialog, PhoneInput } from '@stackra/ui/react';

// Platform-agnostic hooks (also work in React Native later)
import { useDebounce } from '@stackra/ui';

// Heroicons — one subpath per glyph size / weight (tree-shaken per import)
import { ArrowLeftIcon } from '@stackra/ui/icons/heroicon/outline'; // 24px stroke
import { CheckIcon }      from '@stackra/ui/icons/heroicon/solid';   // 24px fill
import { XMarkIcon }      from '@stackra/ui/icons/heroicon/mini';    // 20px
import { CogIcon }        from '@stackra/ui/icons/heroicon/micro';   // 16px

// Iconify — universal icon renderer with Gravity UI as default set
import { Iconify } from '@stackra/ui/icons/iconify';

<Iconify icon="star" width={20} />              // Gravity UI (bundled)
<Iconify icon="logos:github-icon" width={20} /> // Remote set via Iconify CDN

// Global CSS
import '@stackra/ui/react/styles';
```

## Custom composites (13)

Every component is composable, accessible, and Tailwind-styled.

| Component           | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `ConfirmDialog`     | Confirmation modal with configurable variant (danger, warning, info) |
| `FocusModal`        | Full-screen focus mode modal for immersive editing flows             |
| `FileUpload`        | Drag-drop file input with preview grid                               |
| `InlineTip`         | Inline callout (info / warning / danger / success)                   |
| `JsonViewSection`   | Syntax-highlighted, collapsible JSON viewer                          |
| `MoneyAmountCell`   | Locale-aware currency cell for tables                                |
| `PatternLock`       | Android-style connect-the-dots unlock pattern                        |
| `PhoneInput`        | International phone-number input with country picker                 |
| `PinLock`           | PIN entry with masked digits                                         |
| `ProgressAccordion` | Accordion where each section has a status (pending / active / done)  |
| `ProgressTabs`      | Wizard-style tabs with per-step status (needs `@heroui-pro/react`)   |
| `SectionContainer`  | Titled section container for settings pages                          |
| `StatusBadge`       | Colored badge with dot indicator                                     |

## Hooks

| Hook               | Purpose                                     |
| ------------------ | ------------------------------------------- |
| `useDebounce`      | Debounce any value with configurable delay  |
| `useConfirmDialog` | Imperative API for `ConfirmDialog`          |
| `useCopyClipboard` | Copy to clipboard with success feedback     |
| `usePageProgress`  | Access the global page-load progress state  |
| `useProgressTabs`  | Programmatically drive `ProgressTabs` state |

## Providers + contexts

| Provider               | Purpose                              |
| ---------------------- | ------------------------------------ |
| `PageProgressProvider` | Global route-load progress bar state |

Both `page-progress` and `progress-tabs` also export dedicated React contexts
for advanced consumers.

## Subpath map

| Import                               | Purpose                                                           |
| ------------------------------------ | ----------------------------------------------------------------- |
| `@stackra/ui`                        | Platform-agnostic hooks (`useDebounce`)                           |
| `@stackra/ui/react`                  | HeroUI OSS + Pro + custom composites + web-only hooks + providers |
| `@stackra/ui/icons/heroicon/outline` | 24px outline heroicons                                            |
| `@stackra/ui/icons/heroicon/solid`   | 24px solid heroicons                                              |
| `@stackra/ui/icons/heroicon/mini`    | 20px heroicons                                                    |
| `@stackra/ui/icons/heroicon/micro`   | 16px heroicons                                                    |
| `@stackra/ui/icons/iconify`          | `<Iconify />` component + Gravity UI (bundled)                    |
| `@stackra/ui/icons/gravity-ui`       | Raw Iconify JSON for the Gravity UI set (tooling)                 |
| `@stackra/ui/react/styles`           | Global CSS (HeroUI Pro base + controllers + RTL)                  |

## Styles

Import once at the app entry:

```css
/* app/globals.css */
@import "tailwindcss";
@import "@heroui/styles";
@import "@heroui-pro/react/css"; /* only if using Pro */
@import "@stackra/ui/react/styles";
```

`@stackra/ui/react/styles` bundles:

- `@heroui-pro/react/css` (if Pro is installed)
- Custom pointer / cursor conventions
- Right-to-left (Arabic/Hebrew) layout support

## License

MIT

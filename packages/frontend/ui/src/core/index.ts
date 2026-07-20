/**
 * @file index.ts
 * @module @stackra/ui/core
 * @description Platform-agnostic surface of `@stackra/ui`.
 *
 *   Everything exported from this barrel is pure React or pure TypeScript —
 *   no DOM APIs, no React Native APIs, no HeroUI components. Consumers can
 *   import from here on both web and native without bundling platform code
 *   they will not use.
 *
 *   The `@stackra/ui` package root (`.`) re-exports this barrel directly,
 *   so apps consume it as:
 *
 *   ```typescript
 *   import { useDebounce } from '@stackra/ui';
 *   ```
 *
 *   For platform-specific surfaces use:
 *     - `@stackra/ui/react`  — HeroUI v3 web components, web-only hooks
 *     - `@stackra/ui/native` — HeroUI Native components, native-only hooks
 *     - `@stackra/ui/icons/{outline,solid,mini,micro}` — heroicons
 *
 *   This folder follows the monorepo's `core/` convention used by every
 *   other platform package (`network`, `cache`, `i18n`, `router`, …).
 *   See `platform-package-standard.md` for the full convention.
 */

// ============================================================================
// Hooks
// ============================================================================
export { useDebounce } from "./hooks/use-debounce";

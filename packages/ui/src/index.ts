/**
 * @file index.ts
 * @module @stackra/ui
 * @description Root entry of `@stackra/ui`. Re-exports `./core` so
 *   consumers can import platform-agnostic symbols (pure-React hooks,
 *   shared types, utilities) from the package root.
 *
 *   Matches the monorepo's convention where every platform package's
 *   `.` subpath maps to its `src/core/` directory. See
 *   `platform-package-standard.md` for the full rule.
 *
 *   For platform-specific surfaces import from:
 *     - `@stackra/ui/react`  — HeroUI v3 web components, web-only hooks
 *     - `@stackra/ui/native` — HeroUI Native components, native-only hooks
 *     - `@stackra/ui/icons/{outline,solid,mini,micro}` — heroicons (web)
 *
 *   The `@stackra/ui/react` and `@stackra/ui/native` subpaths intentionally
 *   do NOT re-export from `./core`. Each subpath owns exactly one
 *   concern (web vs native vs cross-platform), which keeps import paths
 *   honest about where the code physically lives.
 *
 * @example
 * ```typescript
 * // Pure-React hook works on both web and native:
 * import { useDebounce } from '@stackra/ui';
 *
 * // Web-only components:
 * import { Button, Card } from '@stackra/ui/react';
 *
 * // Native-only components:
 * import { Button, Card } from '@stackra/ui/native';
 * ```
 */
export * from "./core";

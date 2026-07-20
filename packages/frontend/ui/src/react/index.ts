/**
 * @file index.ts
 * @module @stackra/ui/react
 * @description Web (React DOM) surface of `@stackra/ui`.
 *
 *   Re-exports every component, hook, and primitive from `@heroui/react`
 *   (OSS) and `@heroui-pro/react` (Pro), plus the monorepo's custom
 *   web composites, hooks, providers, and contexts.
 *
 *   This subpath does NOT re-export from `./core`. Consumers that
 *   need platform-agnostic symbols import them separately from
 *   `@stackra/ui` (root) or `@stackra/ui/hooks`. The rule keeps every
 *   import path honest about where the code physically lives.
 *
 *   For React Native, import from `@stackra/ui/native` instead.
 *   For icons, import from `@stackra/ui/icons/{outline,solid,mini,micro}`.
 *
 * @example
 * ```typescript
 * import { Button, Card, ProgressTabs } from '@stackra/ui/react';
 * import { useDebounce } from '@stackra/ui';            // shared
 * ```
 */

// ============================================================================
// HeroUI v3 OSS
// ============================================================================
export * from "@heroui/react";

// ============================================================================
// HeroUI Pro
// ============================================================================
export * from "@heroui-pro/react";

// ============================================================================
// Disambiguate names exported by BOTH OSS and Pro.
// Pro extends OSS, so Pro's version wins for everything they both ship.
// ============================================================================
export { cn, EmptyState, EmptyStateRoot, emptyStateVariants, tv } from "@heroui-pro/react";
export type {
  EmptyStateProps,
  EmptyStateRootProps,
  EmptyStateVariants,
  VariantProps,
} from "@heroui-pro/react";

// ============================================================================
// Custom Web Components
// ============================================================================
export * from "./components";

// ============================================================================
// Cross-platform hooks — re-exported here so the workspace `core/hooks`
// rule is satisfied (both `react/index.ts` and `native/index.ts` re-export
// the same source in `./core/hooks`).
// ============================================================================
export { useDebounce } from "../core/hooks/use-debounce";

// ============================================================================
// Web-Specific Hooks
// ============================================================================
export * from "./hooks";

// ============================================================================
// Providers
// ============================================================================
export * from "./providers";

// ============================================================================
// Contexts
// ============================================================================
export * from "./contexts";

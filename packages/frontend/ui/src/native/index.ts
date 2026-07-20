/**
 * @file index.ts
 * @module @stackra/ui/native
 * @description React Native surface of `@stackra/ui`.
 *
 *   Re-exports every OSS component + hook from `heroui-native` and every
 *   Pro compound from `heroui-native-pro` so feature packages
 *   (`@stackra/ai/native`, `@stackra/network/native`, …) compose native
 *   UI through a single, swappable design-system entry point — the same
 *   contract the web `./react` subpath enforces for `@heroui/react` +
 *   `@heroui-pro/react`.
 *
 *   Also re-exports the cross-platform hooks from `./core/hooks` so both
 *   web and native consume the same source (per the workspace
 *   `core/hooks` rule).
 *
 *   Both HeroUI Native packages are declared as **optional peers**.
 *   `heroui-native-pro` is a licensed distribution — consumers who want
 *   Pro must install it with a valid `HEROUI_AUTH_TOKEN` so the
 *   postinstall can hydrate `lib/`. Consumers who don't need Pro can
 *   omit it entirely; the OSS re-exports still resolve normally, and
 *   Pro re-exports resolve to `undefined` at runtime (matching the same
 *   contract as `@heroui-pro/react` on the web side).
 *
 * @example
 * ```typescript
 * // Native app or feature package:
 * import { Button, Card, TextArea, Spinner, Typography } from '@stackra/ui/native'; // OSS
 * import { NumberField, DatePicker, ProgressButton } from '@stackra/ui/native';     // Pro
 * import { useDebounce } from '@stackra/ui/native';                                 // shared
 * ```
 */

// ============================================================================
// HeroUI Native (OSS) — every component + hook re-exported.
// ============================================================================
export * from "heroui-native";

// ============================================================================
// HeroUI Native Pro — every licensed compound re-exported.
// ============================================================================
export * from "heroui-native-pro";

// ----------------------------------------------------------------------------
// Conflict resolution — both HeroUI Native OSS and Pro define private
// theme-color type aliases (`ThemeColor`, `ThemeColorValue`) with the same
// name but different shapes. OSS is the base design system, so we surface
// its versions from the barrel. Consumers who need the Pro-specific theme
// contract can import them directly from `heroui-native-pro/utils`.
// ----------------------------------------------------------------------------
export type { ThemeColor, ThemeColorValue } from "heroui-native";

// ============================================================================
// Cross-platform hooks (single source of truth in ./core/hooks)
// ============================================================================
export { useDebounce } from "../core/hooks/use-debounce";

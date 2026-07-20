/**
 * @file token-to-css-var.util.ts
 * @module @stackra/theming/utils
 * @description Converts a snake_case token key to a CSS custom property name.
 */

// ============================================================================
// Utility
// ============================================================================

/**
 * Convert a snake_case token key to a CSS custom property name.
 *
 * Maps directly to HeroUI v3 / HeroUI Native variable names — NO prefix.
 * Underscores are replaced with hyphens and the result is prepended with `--`.
 *
 * @param token - The snake_case token key from the backend API.
 * @returns The corresponding CSS custom property name.
 *
 * @example
 * ```typescript
 * tokenToCssVar('accent');           // → '--accent'
 * tokenToCssVar('surface_secondary'); // → '--surface-secondary'
 * ```
 */
export function tokenToCssVar(token: string): string {
  const kebab = token.replace(/_/g, "-");
  return `--${kebab}`;
}

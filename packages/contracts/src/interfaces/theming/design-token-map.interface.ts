/**
 * @file design-token-map.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description CSS-variable override map for a theme.
 */

/** Map of CSS variable names (semantic tokens) to string values. */
export interface IDesignTokenMap {
  readonly [key: string]: string;
}

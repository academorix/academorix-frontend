/**
 * @file index.ts
 * @module @stackra/kbd/components/command-palette/layouts
 * @description Public API barrel for the command-palette layouts — re-exports
 *   the shared `LayoutProps` contract and every built-in layout variant
 *   (default, launcher, split, minimal, clean).
 */

export type { LayoutProps } from "./layout-props.interface";
export { DefaultPaletteLayout } from "./default.layout";
export { LauncherPaletteLayout } from "./launcher.layout";
export { SplitPaletteLayout } from "./split.layout";
export { MinimalPaletteLayout } from "./minimal.layout";
export { CleanPaletteLayout } from "./clean.layout";

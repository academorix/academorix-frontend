/**
 * @fileoverview Spotlight-style palette theme.
 *
 * @module @stackra/kbd
 * @category Themes
 */

import type { PaletteTheme } from "../interfaces/palette-theme.interface";

/**
 * macOS Spotlight-inspired theme — top-anchored modal, oversized
 * primary search field, dense single-line items, dim backdrop, no
 * footer (intentionally minimal).
 */
export const spotlightTheme: PaletteTheme = {
  id: "spotlight",
  label: "Spotlight",
  modalWidth: "lg",
  modalRadius: "lg",
  placement: "top",
  backdrop: "dim",
  surface: "default",
  border: "hairline",
  searchVariant: "primary",
  searchSize: "lg",
  searchShowIcon: true,
  searchShowHintChip: false,
  listDensity: "compact",
  listShowCategories: true,
  listShowSectionCounts: false,
  listMaxHeight: 420,
  itemLayout: "row",
  itemShowIcon: true,
  itemIconTile: false,
  itemShowDescription: false,
  itemShowShortcut: true,
  itemShowEntityChip: true,
  itemShowTags: false,
  showFooter: false,
  draggable: false,
  persistPosition: false,
  persistKey: "kbd:palette:position:spotlight",
};

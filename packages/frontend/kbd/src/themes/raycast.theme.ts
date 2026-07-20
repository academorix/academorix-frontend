/**
 * @fileoverview Raycast-style palette theme.
 *
 * @module @stackra/kbd
 * @category Themes
 */

import type { PaletteTheme } from "../interfaces/palette-theme.interface";

/**
 * Raycast-inspired theme — floating glass modal anchored near the top
 * of the viewport, draggable with persisted position, two-line items
 * featuring tile icon + title + description, blurred backdrop, full
 * footer hint bar.
 */
export const raycastTheme: PaletteTheme = {
  id: "raycast",
  label: "Raycast",
  modalWidth: "lg",
  modalRadius: "lg",
  placement: "floating",
  backdrop: "blur",
  surface: "glass",
  border: "hairline",
  searchVariant: "secondary",
  searchSize: "lg",
  searchShowIcon: true,
  searchShowHintChip: false,
  listDensity: "comfortable",
  listShowCategories: true,
  listShowSectionCounts: true,
  listMaxHeight: 520,
  itemLayout: "two-line",
  itemShowIcon: true,
  itemIconTile: true,
  itemShowDescription: true,
  itemShowShortcut: true,
  itemShowEntityChip: true,
  itemShowTags: true,
  showFooter: true,
  draggable: true,
  persistPosition: true,
  persistKey: "kbd:palette:position:raycast",
};

/**
 * @fileoverview Default palette theme.
 *
 * Balanced, modern default — soft glass surface, prominent search,
 * comfortable density, and a footer hint bar. Suits most apps.
 *
 * @module @stackra/kbd
 * @category Themes
 */

import type { PaletteTheme } from "../interfaces/palette-theme.interface";

/**
 * Balanced default theme — centered modal, translucent backdrop,
 * comfortable density, single-line items with shortcut chips.
 */
export const defaultTheme: PaletteTheme = {
  id: "default",
  label: "Default",
  modalWidth: "lg",
  modalRadius: "lg",
  placement: "center",
  backdrop: "translucent",
  surface: "default",
  border: "hairline",
  searchVariant: "secondary",
  searchSize: "lg",
  searchShowIcon: true,
  searchShowHintChip: true,
  listDensity: "comfortable",
  listShowCategories: true,
  listShowSectionCounts: true,
  listMaxHeight: 480,
  itemLayout: "row",
  itemShowIcon: true,
  itemIconTile: false,
  itemShowDescription: true,
  itemShowShortcut: true,
  itemShowEntityChip: true,
  itemShowTags: true,
  showFooter: true,
  draggable: false,
  persistPosition: false,
  persistKey: "kbd:palette:position:default",
};

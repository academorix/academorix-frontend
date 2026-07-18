/**
 * @fileoverview Shopify-inspired palette theme.
 *
 * Mirrors the Shopify admin "Help & Search" experience: top-anchored
 * dialog, generous search field, content sections with uppercase
 * micro-headers and count chips, compact two-line items featuring a
 * leading icon tile, entity chip, and trailing keyboard combo.
 *
 * @module @stackra/kbd
 * @category Themes
 */

import type { PaletteTheme } from "../interfaces/palette-theme.interface";

/**
 * Shopify-style theme — clean, content-dense, opinionated about
 * hierarchy. Pair with the default UI tokens for a polished result.
 */
export const shopifyTheme: PaletteTheme = {
  id: "shopify",
  label: "Shopify",
  modalWidth: "lg",
  modalRadius: "lg",
  placement: "top",
  backdrop: "dim",
  surface: "default",
  border: "hairline",
  searchVariant: "secondary",
  searchSize: "lg",
  searchShowIcon: true,
  searchShowHintChip: true,
  listDensity: "comfortable",
  listShowCategories: true,
  listShowSectionCounts: true,
  listMaxHeight: 500,
  itemLayout: "two-line",
  itemShowIcon: true,
  itemIconTile: true,
  itemShowDescription: true,
  itemShowShortcut: true,
  itemShowEntityChip: true,
  itemShowTags: true,
  showFooter: true,
  draggable: false,
  persistPosition: false,
  persistKey: "kbd:palette:position:shopify",
};

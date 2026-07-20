/**
 * @fileoverview PaletteTheme — visual configuration for the command palette.
 *
 * Themes are stored in the {@link PaletteThemeRegistry} and selected
 * by id at render time. Each theme is a structured config — no raw
 * CSS, no hex colors. The palette renderer maps these tokens onto
 * HeroUI primitives (Modal variants, ListBox classes, Kbd chips).
 *
 * @module @stackra/kbd
 * @category Interfaces
 */

/**
 * Where the palette modal docks on screen.
 */
export type PalettePlacement = "top" | "center" | "bottom" | "floating";

/**
 * Backdrop variant behind the palette modal.
 */
export type PaletteBackdropVariant = "transparent" | "blur" | "opaque" | "dim" | "translucent";

/**
 * Surface tone of the palette dialog.
 */
export type PaletteSurfaceTone = "default" | "elevated" | "inset" | "glass";

/**
 * Search input visual variant.
 */
export type PaletteSearchVariant =
  "flat" | "bordered" | "faded" | "underlined" | "primary" | "secondary";

/**
 * Item density in the command list.
 */
export type PaletteListDensity = "compact" | "default" | "comfortable";

/**
 * Layout of individual command items.
 */
export type PaletteItemLayout = "horizontal" | "stacked" | "row" | "two-line";

/**
 * Visual configuration for the command palette.
 */
export interface PaletteTheme {
  /** Stable id (`"default"`, `"raycast"`, `"spotlight"`). */
  id: string;
  /** Display label shown in the theme switcher. */
  label: string;

  /* ── Layout ──────────────────────────────────────────────── */

  /** Modal width — HeroUI Modal size token. */
  modalWidth: "sm" | "md" | "lg";
  /** Modal radius. */
  modalRadius: "none" | "sm" | "md" | "lg" | "full";
  /** Where the modal docks. */
  placement: PalettePlacement;
  /** Backdrop variant. */
  backdrop: PaletteBackdropVariant;
  /**
   * Tone of the dialog surface. Defaults to `"default"`.
   *
   * @default "default"
   */
  surface?: PaletteSurfaceTone;
  /**
   * Whether the dialog renders a visible border.
   * `"hairline"` uses a 1px border in the divider color.
   *
   * @default "hairline"
   */
  border?: "none" | "hairline";

  /* ── Search ──────────────────────────────────────────────── */

  /** Search input variant. */
  searchVariant: PaletteSearchVariant;
  /** Search input size. */
  searchSize: "sm" | "md" | "lg";
  /** Whether to show the leading search icon. */
  searchShowIcon: boolean;
  /**
   * Whether to render a hint chip (e.g. `⌘K`) on the trailing edge of
   * the search field.
   *
   * @default true
   */
  searchShowHintChip?: boolean;

  /* ── List ────────────────────────────────────────────────── */

  /** Item density. */
  listDensity: PaletteListDensity;
  /** Whether to render the category headings between groups. */
  listShowCategories: boolean;
  /**
   * Whether to render a small count chip after each section heading.
   *
   * @default true
   */
  listShowSectionCounts?: boolean;
  /** Maximum visible rows before scroll kicks in. */
  listMaxHeight: number;

  /* ── Item ────────────────────────────────────────────────── */

  /** Item layout. */
  itemLayout: PaletteItemLayout;
  /** Whether to render the leading icon when the command provides one. */
  itemShowIcon: boolean;
  /**
   * Whether to render the leading icon inside a rounded tile background.
   * Reads better at higher densities (Shopify / Linear feel).
   *
   * @default false
   */
  itemIconTile?: boolean;
  /** Whether to render the description sub-line. */
  itemShowDescription: boolean;
  /** Whether to render the keyboard combo on the trailing edge. */
  itemShowShortcut: boolean;
  /** Whether to render an entity chip when the command supplies `meta.entity`. */
  itemShowEntityChip: boolean;
  /** Whether to render trailing tag chips when the command supplies `meta.tags`. */
  itemShowTags: boolean;

  /* ── Footer ──────────────────────────────────────────────── */

  /**
   * Whether to render a footer hint bar showing navigation hints
   * (`↑↓ navigate · ↵ open · esc close`).
   *
   * @default true
   */
  showFooter?: boolean;

  /* ── Behavior ────────────────────────────────────────────── */

  /** Whether the palette is draggable. */
  draggable: boolean;
  /** Whether to persist drag position to localStorage. */
  persistPosition: boolean;
  /** localStorage key used when `persistPosition === true`. */
  persistKey: string;

  /* ── Slots ───────────────────────────────────────────────── */

  /** Optional class applied to the dialog container. */
  dialogClassName?: string;
  /** Optional class applied to each item. */
  itemClassName?: string;
}

/**
 * @file keyboard-catalog-props.interface.ts
 * KeyboardCatalogProps — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

/**
 * Props for {@link KeyboardCatalog}.
 */
export interface KeyboardCatalogProps {
  /** Optional title rendered at the top of the modal. */
  title?: string;
  /** Optional subtitle rendered under the title. */
  subtitle?: string;
  /** Search input placeholder. */
  searchPlaceholder?: string;
  /** Empty-state message. */
  emptyMessage?: string;
  /** Empty-state hint shown below the message. */
  emptyHint?: string;
}

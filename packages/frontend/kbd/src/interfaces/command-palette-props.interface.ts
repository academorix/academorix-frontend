/**
 * CommandPaletteProps — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { ReactNode } from "react";

/**
 * Props for {@link CommandPalette}.
 */
export interface CommandPaletteProps {
  /** Override the search input placeholder. */
  placeholder?: string;
  /** Override the empty-state message. */
  emptyMessage?: string;
  /** Override the empty-state hint shown below the message. */
  emptyHint?: string;
  /** Override the footer hint copy (used when the theme shows the footer). */
  footerHint?: ReactNode;
}

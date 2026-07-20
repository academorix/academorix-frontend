/**
 * @file focus-modal.interface.ts
 * @module @stackra/ui/react/components/focus-modal
 * @description Props interfaces for the FocusModal compound component.
 *
 *   Public prop shapes are stable across HeroUI versions. Internally the
 *   component forwards `open` / `onOpenChange` to `Modal.Backdrop`
 *   (HeroUI v3 controlled-state contract) and `className` to `Modal.Dialog`.
 */

import type { ReactNode } from "react";

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for the root `FocusModal` container.
 *
 * The component is fully controlled — provide `open` to drive visibility and
 * `onOpenChange` to react to user-initiated close events (Escape key, backdrop
 * click, or the built-in close trigger inside the header).
 */
export interface FocusModalProps {
  /** Whether the modal is open. Controlled — drive with React state. */
  open?: boolean;

  /**
   * Callback fired when the open state changes.
   * Receives the new open value (`true` on open, `false` on close).
   */
  onOpenChange?: (open: boolean) => void;

  /** Modal content. Should contain `FocusModal.Header`, `Body`, `Footer`. */
  children?: ReactNode;

  /** Additional CSS classes appended to the inner `Modal.Dialog`. */
  className?: string;
}

/**
 * Props for the `FocusModal.Header` sticky top section.
 *
 * Renders the primary title (as `Modal.Heading`), an optional subtitle line,
 * any extra action elements passed via `children`, and a built-in close
 * trigger anchored to the right.
 */
export interface FocusModalHeaderProps {
  /** Primary title displayed in the header. */
  title: string;

  /** Optional subtitle / description rendered below the title. */
  description?: string;

  /** Additional CSS classes appended to the header element. */
  className?: string;

  /**
   * Optional extra actions rendered to the left of the close trigger
   * (e.g. step indicators, "save draft" buttons).
   */
  children?: ReactNode;
}

/**
 * Props for the `FocusModal.Body` scrollable content area.
 *
 * Stretches between the sticky header and sticky footer and scrolls vertically
 * when its content exceeds the available space.
 */
export interface FocusModalBodyProps {
  /** Additional CSS classes appended to the body container. */
  className?: string;

  /** Scrollable body content. */
  children?: ReactNode;
}

/**
 * Props for the `FocusModal.Footer` sticky action bar.
 *
 * Pinned to the bottom of the modal and intended for primary/secondary action
 * buttons (typically Cancel + Save).
 */
export interface FocusModalFooterProps {
  /** Additional CSS classes appended to the footer element. */
  className?: string;

  /** Action buttons (typically Cancel + Save). */
  children?: ReactNode;
}

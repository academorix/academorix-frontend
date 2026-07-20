/**
 * @file focus-modal.component.tsx
 * @module @stackra/ui/react/components/focus-modal
 * @description Full-screen focus modal for create/edit operations.
 *   Provides a viewport-filling modal with sticky header (title + close)
 *   and sticky footer (action buttons). Inspired by Medusa's FocusModal.
 *
 *   Built on HeroUI v3's compound Modal API:
 *     Modal.Backdrop > Modal.Container > Modal.Dialog
 *       > Modal.Header (with Modal.Heading + Modal.CloseTrigger)
 *       > Modal.Body
 *       > Modal.Footer
 *
 *   The component is fully controlled — pass `open` + `onOpenChange` on the
 *   root <FocusModal>. The state is forwarded internally to Modal.Backdrop.
 */

"use client";

import { Modal } from "@heroui/react";
import React from "react";

import type {
  FocusModalProps,
  FocusModalHeaderProps,
  FocusModalBodyProps,
  FocusModalFooterProps,
} from "./focus-modal.interface";

// ============================================================================
// Root
// ============================================================================

/**
 * FocusModal — Full-screen modal for focused create/edit workflows.
 *
 * Renders a viewport-filling modal with dark overlay, focus trapping, and
 * Escape-to-close behavior (provided by HeroUI v3 / React Aria primitives).
 *
 * The component is **controlled-only**: pass `open` and `onOpenChange`.
 * The body scrolls internally (`scroll="inside"`) so the sticky header/footer
 * stay pinned at the viewport edges while the content area scrolls.
 *
 * @example
 * ```tsx
 * <FocusModal open={isOpen} onOpenChange={setIsOpen}>
 *   <FocusModal.Header
 *     title="Create Product"
 *     description="Add a new product to your catalog."
 *   />
 *   <FocusModal.Body>
 *     <ProductForm />
 *   </FocusModal.Body>
 *   <FocusModal.Footer>
 *     <Button variant="secondary" onPress={() => setIsOpen(false)}>Cancel</Button>
 *     <Button onPress={handleSave}>Save</Button>
 *   </FocusModal.Footer>
 * </FocusModal>
 * ```
 */
function FocusModalRoot({
  open,
  onOpenChange,
  children,
  className,
}: FocusModalProps): React.ReactElement {
  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Container scroll="inside" size="full">
        <Modal.Dialog
          className={`flex h-full max-h-full flex-col rounded-none ${className ?? ""}`.trim()}
          data-component="focus-modal"
        >
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

FocusModalRoot.displayName = "FocusModal";

// ============================================================================
// Header
// ============================================================================

/**
 * FocusModal.Header — Sticky top section with title, description, and close button.
 *
 * Renders a `Modal.Header` with a flex layout: the title group (heading +
 * optional description) on the left, optional extra actions in the middle,
 * and a `Modal.CloseTrigger` on the right. The header is sticky to the top
 * of the dialog and gets a bottom border to separate it from the body.
 */
function FocusModalHeader({
  title,
  description,
  className,
  children,
}: FocusModalHeaderProps): React.ReactElement {
  return (
    <Modal.Header
      className={`border-default-200 bg-background sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4 ${className ?? ""}`.trim()}
    >
      <div className="flex flex-col gap-1">
        <Modal.Heading className="text-foreground text-lg font-semibold">{title}</Modal.Heading>
        {description ? <p className="text-foreground-500 text-sm">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Modal.CloseTrigger />
      </div>
    </Modal.Header>
  );
}

FocusModalHeader.displayName = "FocusModal.Header";

// ============================================================================
// Body
// ============================================================================

/**
 * FocusModal.Body — Scrollable content area between header and footer.
 *
 * Uses `flex-1` to grow into the available vertical space and `overflow-y-auto`
 * to scroll the body content while the header and footer remain pinned.
 */
function FocusModalBody({ className, children }: FocusModalBodyProps): React.ReactElement {
  return (
    <Modal.Body className={`flex-1 overflow-y-auto px-6 py-6 ${className ?? ""}`.trim()}>
      {children}
    </Modal.Body>
  );
}

FocusModalBody.displayName = "FocusModal.Body";

// ============================================================================
// Footer
// ============================================================================

/**
 * FocusModal.Footer — Sticky bottom action bar with right-aligned buttons.
 *
 * Rendered as a `Modal.Footer` pinned to the bottom of the dialog. Use this
 * for primary/secondary action buttons (Cancel + Save).
 */
function FocusModalFooter({ className, children }: FocusModalFooterProps): React.ReactElement {
  return (
    <Modal.Footer
      className={`border-default-200 bg-background sticky bottom-0 z-10 flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4 ${className ?? ""}`.trim()}
    >
      {children}
    </Modal.Footer>
  );
}

FocusModalFooter.displayName = "FocusModal.Footer";

// ============================================================================
// Compound Export
// ============================================================================

/**
 * Compound FocusModal export. Combines the root container with its
 * sticky-header, scrollable-body, and sticky-footer subcomponents under
 * a single dot-notation namespace.
 */
export const FocusModal = Object.assign(FocusModalRoot, {
  Header: FocusModalHeader,
  Body: FocusModalBody,
  Footer: FocusModalFooter,
});

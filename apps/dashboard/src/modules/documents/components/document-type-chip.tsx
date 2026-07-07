/**
 * @file document-type-chip.tsx
 * @module modules/documents/components/document-type-chip
 *
 * @description
 * Renders a document classification as a HeroUI {@link Chip} paired with
 * its per-type icon so the list, show, and preview surfaces render types
 * consistently. Colour follows the intent of the type (identity =
 * default, medical = warning, contract = accent, financial/compliance =
 * secondary, misc/unknown = default).
 */

import { Chip } from "@academorix/ui/react";

import type { ReactNode } from "react";

import { iconForDocumentType, labelForDocumentType } from "@/modules/documents/documents.config";

/**
 * Semantic Chip colour per known document type. Unknown / tenant-added
 * values fall back to `"default"` via the `??` in {@link colourForType}.
 *
 * These are Chip colours — not free CSS — so the module inherits the
 * design system's palette without hard-coding hex values.
 */
const TYPE_COLOUR: Record<string, "success" | "warning" | "danger" | "default" | "accent"> = {
  medical_clearance: "warning",
  passport: "default",
  national_id: "default",
  contract: "accent",
  work_permit: "accent",
  receipt: "default",
  family_invoice_bundle: "default",
  erasure_report: "danger",
  policy: "accent",
  misc: "default",
};

/**
 * Resolves the Chip colour for a (possibly unknown) type.
 *
 * @param type - The document type key.
 * @returns The Chip colour token.
 */
function colourForType(type: string): "success" | "warning" | "danger" | "default" | "accent" {
  return TYPE_COLOUR[type] ?? "default";
}

/** Props for {@link DocumentTypeChip}. */
export interface DocumentTypeChipProps {
  /** The document type key, e.g. `"medical_clearance"`. */
  type: string;
  /**
   * Whether to hide the leading glyph. Defaults to `false`. Useful when the
   * caller already renders an icon column next to the chip.
   */
  hideIcon?: boolean;
}

/**
 * A soft, iconified Chip for a document's classification.
 *
 * @param props - The type key and an optional icon-hide flag.
 */
export function DocumentTypeChip({ type, hideIcon = false }: DocumentTypeChipProps): ReactNode {
  const Icon = iconForDocumentType(type);

  return (
    <Chip color={colourForType(type)} size="sm" variant="soft">
      {hideIcon ? null : <Icon aria-hidden="true" className="size-3.5" />}
      <Chip.Label>{labelForDocumentType(type)}</Chip.Label>
    </Chip>
  );
}

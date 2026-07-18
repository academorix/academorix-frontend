/**
 * @file document-status-chip.tsx
 * @module modules/documents/components/document-status-chip
 *
 * @description
 * Renders the virus-scan pipeline outcome as a semantically-coloured
 * HeroUI {@link Chip}: `pending → warning`, `clean → success`,
 * `infected → danger`. Kept as a dedicated component so list rows, detail
 * headers, and preview banners share one visual language.
 */

import { Chip } from "@stackra/ui/react";

import type { DocumentScanStatus } from "@/modules/documents/documents.types";
import type { ReactNode } from "react";

import { DOCUMENT_STATUS_LABELS } from "@/modules/documents/documents.config";

/** Maps a scan status to its semantic Chip colour. */
const STATUS_COLOUR: Record<DocumentScanStatus, "success" | "warning" | "danger"> = {
  pending: "warning",
  clean: "success",
  infected: "danger",
};

/** Props for {@link DocumentStatusChip}. */
export interface DocumentStatusChipProps {
  /** Current virus-scan status. */
  status: DocumentScanStatus;
}

/**
 * A soft, colour-coded chip for the virus-scan status. Infected uses the
 * `primary` variant for visual emphasis — clean uploads should recede,
 * infected ones should not.
 *
 * @param props - The scan status to render.
 */
export function DocumentStatusChip({ status }: DocumentStatusChipProps): ReactNode {
  return (
    <Chip
      color={STATUS_COLOUR[status]}
      size="sm"
      variant={status === "infected" ? "primary" : "soft"}
    >
      {DOCUMENT_STATUS_LABELS[status]}
    </Chip>
  );
}

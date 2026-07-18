/**
 * @file document-scope-badge.tsx
 * @module modules/documents/components/document-scope-badge
 *
 * @description
 * Renders a document's owner scope as a labelled Chip that reads
 * `"Athlete: John Doe"` or `"Staff: Coach Marco"`. The owner label is
 * resolved by the caller (so the component stays free of data-fetching
 * concerns); the raw owner id shows through as the fallback when a name
 * cannot be resolved.
 */

import { Chip } from "@stackra/ui/react";

import type { DocumentOwnerType } from "@/modules/documents/documents.types";
import type { ReactNode } from "react";

import { labelForDocumentScope } from "@/modules/documents/documents.config";

/** Props for {@link DocumentScopeBadge}. */
export interface DocumentScopeBadgeProps {
  /** The document's `owner_type` (aka scope). */
  scope: DocumentOwnerType | string;
  /**
   * A human-readable owner name, when resolvable. Defaults to the raw
   * `ownerId` so nothing renders blank.
   */
  ownerName?: string | null;
  /** The raw owner id — used as a fallback when {@link ownerName} is null. */
  ownerId: string;
}

/**
 * A soft, "scope-labelled" chip. The label is a two-part read that keeps
 * table rows scannable even at small widths (`"Athlete: John Doe"`).
 *
 * @param props - The scope, resolved owner name (when available), and the
 *   raw owner id fallback.
 */
export function DocumentScopeBadge({
  scope,
  ownerName,
  ownerId,
}: DocumentScopeBadgeProps): ReactNode {
  const trimmed = ownerName?.trim();
  const target = trimmed && trimmed.length > 0 ? trimmed : ownerId;

  return (
    <Chip color="default" size="sm" variant="secondary">
      <Chip.Label>
        <span className="text-muted">{labelForDocumentScope(scope)}:</span>{" "}
        <span className="font-medium text-foreground">{target}</span>
      </Chip.Label>
    </Chip>
  );
}

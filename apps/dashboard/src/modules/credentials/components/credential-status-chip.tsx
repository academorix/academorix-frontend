/**
 * @file credential-status-chip.tsx
 * @module modules/credentials/components/credential-status-chip
 *
 * @description
 * Color-coded chip for a {@link Credential} status, reused by the credentials
 * list and detail screens.
 */

import { Chip } from "@stackra/ui/react";

import type { Credential } from "@/modules/credentials/credentials.types";
import type { ReactNode } from "react";

/** A credential's lifecycle status. */
type CredentialStatus = Credential["status"];

/** Maps each credential status to a semantic HeroUI Chip color. */
const COLOR: Record<CredentialStatus, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  revoked: "danger",
  lost: "warning",
};

/** Human-readable labels for a credential status. */
const LABELS: Record<CredentialStatus, string> = {
  active: "Active",
  revoked: "Revoked",
  lost: "Lost",
};

/** A soft, color-coded chip for a credential's status. */
export function CredentialStatusChip({ status }: { status: CredentialStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {LABELS[status]}
    </Chip>
  );
}

/**
 * @file documents.config.ts
 * @module modules/documents/documents.config
 *
 * @description
 * Display constants and per-type presentation config for the Documents
 * module — human labels, semantic colours, per-type icon glyphs, and the
 * upload-page size ceiling. Kept in one place so the list, show, and upload
 * pages render the same values without duplicating maps.
 */

import {
  ArchiveBoxIcon,
  BanknotesIcon,
  DocumentIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  HeartIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "@academorix/ui/icons/outline";

import type {
  DocumentOwnerType,
  DocumentScanStatus,
  DocumentType,
} from "@/modules/documents/documents.types";
import type { IconType } from "@academorix/ui/icons";

/**
 * Maximum accepted upload size per file — 25 MB. The upload page rejects
 * larger files client-side before ever hitting the (pending) backend
 * endpoint. This ceiling matches the backend's planned per-file cap.
 */
export const DOCUMENT_MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

/**
 * Comma-separated `accept` string for the upload file input. Keeps the
 * value in a single place so the upload page and any future dropzone
 * variant enforce the same policy.
 */
export const DOCUMENT_ACCEPTED_MIME_TYPES: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** Human-readable labels for {@link DocumentType}. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  medical_clearance: "Medical clearance",
  passport: "Passport",
  national_id: "National ID",
  contract: "Contract",
  work_permit: "Work permit",
  receipt: "Receipt",
  family_invoice_bundle: "Family invoice bundle",
  erasure_report: "Erasure report",
  policy: "Policy",
  misc: "Miscellaneous",
};

/** Human-readable labels for {@link DocumentOwnerType} (a.k.a. scope). */
export const DOCUMENT_SCOPE_LABELS: Record<DocumentOwnerType, string> = {
  athlete: "Athlete",
  staff: "Staff",
  user: "User",
  expense: "Expense",
  tenant: "Tenant",
  branch: "Branch",
};

/** Human-readable labels for {@link DocumentScanStatus}. */
export const DOCUMENT_STATUS_LABELS: Record<DocumentScanStatus, string> = {
  pending: "Scanning",
  clean: "Clean",
  infected: "Infected",
};

/**
 * Icon glyph per known document type. Falls back to the generic
 * {@link DocumentTextIcon} for unknown / tenant-added values via
 * {@link iconForDocumentType} so the UI never renders a blank cell.
 */
export const DOCUMENT_TYPE_ICONS: Record<DocumentType, IconType> = {
  medical_clearance: HeartIcon,
  passport: IdentificationIcon,
  national_id: IdentificationIcon,
  contract: DocumentCheckIcon,
  work_permit: ShieldCheckIcon,
  receipt: BanknotesIcon,
  family_invoice_bundle: ArchiveBoxIcon,
  erasure_report: TrashIcon,
  policy: ShieldCheckIcon,
  misc: DocumentIcon,
};

/**
 * Types whose contents are typically sensitive and should surface a
 * "Confidential" badge on the detail view. This is a UX signal only —
 * access control is enforced server-side by the DocumentPolicy.
 *
 * Kept as a `Set` of `string` (not `Set<DocumentType>`) so lookups still
 * succeed against unknown tenant-added values.
 */
const CONFIDENTIAL_TYPES = new Set<string>([
  "medical_clearance",
  "national_id",
  "passport",
  "erasure_report",
  "contract",
]);

/**
 * Resolves the icon for a given (possibly unknown) document type. Unknown
 * values fall back to the generic document glyph so the list column always
 * renders.
 *
 * @param type - The document type string (known or tenant-added).
 * @returns The icon component to render.
 */
export function iconForDocumentType(type: string): IconType {
  return (DOCUMENT_TYPE_ICONS as Record<string, IconType>)[type] ?? DocumentTextIcon;
}

/**
 * Resolves a display label for a (possibly unknown) document type. Unknown
 * values render as their raw key with underscores → spaces.
 *
 * @param type - The document type string.
 * @returns A human-readable label.
 */
export function labelForDocumentType(type: string): string {
  const known = (DOCUMENT_TYPE_LABELS as Record<string, string>)[type];

  if (known) {
    return known;
  }

  return type.replaceAll("_", " ");
}

/**
 * Resolves a display label for a (possibly unknown) owner-type / scope.
 * Unknown values render as their raw key.
 *
 * @param scope - The owner-type / scope string.
 * @returns A human-readable label.
 */
export function labelForDocumentScope(scope: string): string {
  return (DOCUMENT_SCOPE_LABELS as Record<string, string>)[scope] ?? scope;
}

/**
 * Whether the given type is considered confidential for UI-badging
 * purposes. Access control still lives on the server; this only drives a
 * visible affordance.
 *
 * @param type - The document type string.
 * @returns `true` when the type is in the confidential allow-list.
 */
export function isConfidentialType(type: string): boolean {
  return CONFIDENTIAL_TYPES.has(type);
}

/**
 * Formats a byte count as a short human-readable string (`KB` / `MB` / `GB`).
 * Uses IEC (1024-based) units to match how the OS reports file sizes.
 *
 * @param bytes - Raw byte count.
 * @returns A concise size label, e.g. `"340 KB"`.
 */
export function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  // Show one decimal below 10 to keep MB rows legible without visual noise
  // on multi-GB rows.
  const rounded = value < 10 ? value.toFixed(1) : Math.round(value).toString();

  return `${rounded} ${units[index]}`;
}

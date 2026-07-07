/**
 * @file documents.types.ts
 * @module modules/documents/documents.types
 *
 * @description
 * Module-local shapes for the **Documents** surface — the tenant's central
 * store for uploaded artefacts (medical clearances, ID scans, contracts,
 * receipts, compliance bundles) tied to any owning entity via a polymorphic
 * `owner_type` + `owner_id` pair.
 *
 * These mirror the backend Data DTO at
 * {@link "backend/modules/Documents/src/Data/Documents/DocumentData.php" DocumentData},
 * which is emitted in snake_case on the wire via the SnakeCaseMapper. The
 * fixture at `backend/modules/Documents/database/fixtures/documents.json`
 * feeds the read endpoints today; write endpoints are marked TODO on the
 * pages that will consume them.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.10 "Documents & Media"
 */

import type { BaseModel } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Owner scope
//
// `owner_type` is the polymorphic pointer to whichever entity a document is
// attached to. It doubles as the "scope" filter dimension in the list page.
// ─────────────────────────────────────────────────────────────────────────────

/** The known owner-entity kinds a document can be attached to. */
export const DOCUMENT_OWNER_TYPES = [
  "athlete",
  "staff",
  "user",
  "expense",
  "tenant",
  "branch",
] as const;

/** A single owner-entity kind (e.g. `"athlete"`). */
export type DocumentOwnerType = (typeof DOCUMENT_OWNER_TYPES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Type (classification)
//
// The document classification is emitted as a free-form string by the backend
// so tenants can add new types without a schema migration; we still enumerate
// the known values here to drive the list-page filter chip options and
// per-type iconography.
// ─────────────────────────────────────────────────────────────────────────────

/** Common document classifications the fixture emits. */
export const DOCUMENT_TYPES = [
  "medical_clearance",
  "passport",
  "national_id",
  "contract",
  "work_permit",
  "receipt",
  "family_invoice_bundle",
  "erasure_report",
  "policy",
  "misc",
] as const;

/**
 * A single document classification. Kept as `string` in the underlying
 * {@link Document} shape so unknown values (tenants add new types) still
 * flow through without a type error.
 */
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Virus-scan status
//
// Every uploaded file is scanned asynchronously — the UI reflects the three
// terminal-ish states from the pipeline.
// ─────────────────────────────────────────────────────────────────────────────

/** Terminal virus-scan states the pipeline emits. */
export const DOCUMENT_SCAN_STATUSES = ["pending", "clean", "infected"] as const;

/** A single virus-scan status. */
export type DocumentScanStatus = (typeof DOCUMENT_SCAN_STATUSES)[number];

/**
 * Alias exposed for the task-facing vocabulary — the design brief calls the
 * scan pipeline outcome the "document status", which is exactly what
 * {@link DocumentScanStatus} models. Kept as an alias so downstream code can
 * import whichever name reads clearer in context.
 */
export type DocumentStatus = DocumentScanStatus;

/**
 * Alias exposed for the task-facing "scope" vocabulary — the design brief
 * models the owning entity as the document's scope. Backend uses
 * `owner_type` (polymorphic FK); we surface the same values under
 * {@link DocumentScope} so filter/list code can name the concept in
 * whichever way reads clearer in context.
 */
export type DocumentScope = DocumentOwnerType;

// ─────────────────────────────────────────────────────────────────────────────
// The Document model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A **Document** — a single stored artefact belonging to some owning entity
 * within a tenant. Snake_case field names match the backend DTO verbatim so
 * the JSON fixture and the future DB-backed endpoint are byte-for-byte
 * interchangeable on the wire.
 *
 * The shape composes {@link BaseModel} for `id`/`created_at`/`updated_at`,
 * but keeps `tenant_id` as **nullable** — the backend fixture DTO allows a
 * null tenant id for a small set of platform-emitted rows (compliance
 * bundles), so we widen the tenancy marker rather than the strict
 * {@link "@/types".TenantScoped} interface which requires a non-null string.
 */
export interface Document extends BaseModel {
  /** Owning tenant id, or `null` for platform-emitted rows (rare). */
  tenant_id: string | null;
  /** Polymorphic owner kind, e.g. `"athlete"`, `"staff"`, `"expense"`. */
  owner_type: DocumentOwnerType | string;
  /** Opaque owner id (schema depends on {@link owner_type}). */
  owner_id: string;
  /** Classification, e.g. `"medical_clearance"`. */
  type: DocumentType | string;
  /** Original filename supplied at upload time. */
  filename: string;
  /** IANA media type, e.g. `"application/pdf"`. */
  mime: string;
  /** File size in bytes (int). */
  size_bytes: number;
  /** Virus-scan pipeline outcome. */
  scan_status: DocumentScanStatus;
  /** ISO-8601 expiry date, or `null` if the document never expires. */
  expiry_at: string | null;
  /** Backend storage URL (`s3://…`). Not directly consumable — see download. */
  storage_url: string;
  /** User id of the uploader, or `null` if unknown. */
  uploaded_by: string | null;
  /** ISO-8601 upload timestamp, or `null` if unknown. */
  uploaded_at: string | null;
  /** Free-text operator notes, e.g. compliance justification. */
  notes: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form values
//
// The edit form projects the mutable subset of a document. The backend edit
// endpoint (TODO — pending) is expected to accept the same snake_case keys.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Editable fields on a document. Kept separate from {@link Document} because
 * scan status, storage url, size, and the owner are all pipeline-managed —
 * only the operator-controlled metadata belongs on the form.
 */
export interface DocumentFormValues {
  /** Display title / filename override. */
  filename: string;
  /** Classification (free-form string on submit to allow future values). */
  type: string;
  /** ISO date (`YYYY-MM-DD`) or empty string when not applicable. */
  expiry_at: string;
  /** Free-text operator notes. */
  notes: string;
}

/**
 * Shape of a queued upload as tracked by the upload page's local state. This
 * mirrors {@link "@academorix/ui/react".UploadFile} but keeps the field set
 * intentionally small — we don't currently propagate a preview url after
 * dropzone selection, and the server side of the flow is TODO.
 */
export interface DocumentUploadItem {
  /** Stable id for React keying (a random uuid or `file.name-<idx>`). */
  id: string;
  /** Native File handle. */
  file: File;
  /** Upload progress percentage (0..100). Undefined until start. */
  progress?: number;
  /** Terminal or in-flight status. */
  status: "idle" | "uploading" | "completed" | "error";
  /** Error message when {@link status} is `"error"`. */
  error?: string;
}

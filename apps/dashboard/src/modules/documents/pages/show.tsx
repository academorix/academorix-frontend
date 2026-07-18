/**
 * @file show.tsx
 * @module modules/documents/pages/show
 *
 * @description
 * Document detail — all stored metadata for a single artefact plus a live
 * preview (image, PDF, or graceful "no preview" card) and a "Download"
 * button. The download resolves through a signed URL — today it points at
 * the raw `storage_url` because the signed-url endpoint is not yet wired
 * (see the `TODO(backend-endpoint)` in {@link resolveDownloadUrl}). Once
 * the backend surface ships, this is the one place to update.
 */

import { ArrowDownTrayIcon, LockClosedIcon } from "@stackra/ui/icons/heroicon/outline";
import { Alert, Button, Card, Chip, Spinner } from "@stackra/ui/react";
import { useList, useShow } from "@refinedev/core";
import { useMemo } from "react";

import type { Document } from "@/modules/documents/documents.types";
import type { Athlete, Staff, User } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate, formatDateTime } from "@/lib/format";
import { DocumentPreview } from "@/modules/documents/components/document-preview";
import { DocumentScopeBadge } from "@/modules/documents/components/document-scope-badge";
import { DocumentStatusChip } from "@/modules/documents/components/document-status-chip";
import { DocumentTypeChip } from "@/modules/documents/components/document-type-chip";
import {
  formatByteSize,
  isConfidentialType,
  labelForDocumentType,
} from "@/modules/documents/documents.config";

/**
 * Resolves the URL for the "Download" button + inline preview.
 *
 * TODO(backend-endpoint): swap this out for the signed-url endpoint
 * (`GET /api/v1/documents/{id}/signed-url`) once the backend surface
 * lands — today it hands back the raw `storage_url` from the fixture,
 * which is not fetchable but is safe to render since infected uploads
 * are already filtered by the DocumentPolicy on the server side.
 *
 * @param document - The document being viewed.
 * @returns The URL to open, or `null` when the document is quarantined.
 */
function resolveDownloadUrl(document: Document): string | null {
  // Never expose an infected upload — treat as if the URL were absent.
  if (document.scan_status === "infected") {
    return null;
  }

  return document.storage_url;
}

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** Compact human-name lookup used by the detail page for uploader + owner. */
function useNames(): {
  athlete: Map<string, string>;
  staff: Map<string, string>;
  user: Map<string, string>;
} {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const { result: usersResult } = useList<User>({
    resource: "users",
    pagination: { mode: "off" },
  });

  return useMemo(() => {
    const athlete = new Map<string, string>();
    const staff = new Map<string, string>();
    const user = new Map<string, string>();

    for (const record of athletesResult?.data ?? []) {
      athlete.set(record.id, `${record.first_name} ${record.last_name}`);
    }
    for (const record of staffResult?.data ?? []) {
      staff.set(record.id, `${record.first_name} ${record.last_name}`);
    }
    for (const record of usersResult?.data ?? []) {
      user.set(record.id, `${record.first_name} ${record.last_name}`);
    }

    return { athlete, staff, user };
  }, [athletesResult?.data, staffResult?.data, usersResult?.data]);
}

/** The document detail page. */
export default function DocumentsShow(): ReactNode {
  const { result: document, query } = useShow<Document>({ resource: "documents" });
  const names = useNames();

  if (query.isLoading || !document) {
    return (
      <ShowView resource="documents">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  const downloadUrl = resolveDownloadUrl(document);
  const isConfidential = isConfidentialType(document.type);
  const ownerLookup =
    document.owner_type === "athlete"
      ? names.athlete
      : document.owner_type === "staff"
        ? names.staff
        : document.owner_type === "user"
          ? names.user
          : null;
  const ownerName = ownerLookup?.get(document.owner_id) ?? null;
  const uploaderName = document.uploaded_by ? (names.user.get(document.uploaded_by) ?? null) : null;

  return (
    <ShowView resource="documents">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Card.Title>{document.filename}</Card.Title>
                <div className="flex flex-wrap items-center gap-2">
                  <DocumentTypeChip type={document.type} />
                  <DocumentStatusChip status={document.scan_status} />
                  {isConfidential ? (
                    <Chip color="warning" size="sm" variant="soft">
                      <LockClosedIcon aria-hidden="true" className="size-3.5" />
                      <Chip.Label>Confidential</Chip.Label>
                    </Chip>
                  ) : null}
                </div>
              </div>

              <Button
                aria-label="Download document"
                isDisabled={!downloadUrl}
                variant="primary"
                {...(downloadUrl
                  ? {
                      onPress: () => {
                        // TODO(backend-endpoint): call
                        // `POST /api/v1/documents/{id}/signed-url`,
                        // await the short-lived URL, then window.open()
                        // it. For now we point at the fixture's raw
                        // storage_url so the surface renders and can
                        // be swapped in one place later.
                        window.open(downloadUrl, "_blank", "noopener,noreferrer");
                      },
                    }
                  : {})}
              >
                <ArrowDownTrayIcon aria-hidden="true" className="size-4" />
                Download
              </Button>
            </div>
          </Card.Header>

          <Card.Content>
            {document.scan_status === "infected" ? (
              <Alert className="mb-4" status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>This upload was flagged as infected</Alert.Title>
                  <Alert.Description>
                    Download and preview are disabled. Contact your safeguarding lead.
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Type">{labelForDocumentType(document.type)}</Field>
              <Field label="Scope">
                <DocumentScopeBadge
                  ownerId={document.owner_id}
                  ownerName={ownerName}
                  scope={document.owner_type}
                />
              </Field>
              <Field label="Size">{formatByteSize(document.size_bytes)}</Field>
              <Field label="Mime type">
                <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-xs">
                  {document.mime}
                </code>
              </Field>
              <Field label="Uploaded by">{uploaderName ?? document.uploaded_by ?? "—"}</Field>
              <Field label="Uploaded at">{formatDateTime(document.uploaded_at)}</Field>
              <Field label="Expires">{formatDate(document.expiry_at)}</Field>
              <Field label="Storage path">
                <code className="max-w-full truncate rounded bg-surface-secondary px-1.5 py-0.5 text-xs">
                  {document.storage_url}
                </code>
              </Field>
              <Field label="Scan status">
                <DocumentStatusChip status={document.scan_status} />
              </Field>
            </dl>

            {document.notes ? (
              <div className="mt-6 flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wide text-muted uppercase">Notes</dt>
                <dd className="text-sm whitespace-pre-line text-foreground">{document.notes}</dd>
              </div>
            ) : null}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Preview</Card.Title>
            <Card.Description>
              {document.scan_status === "infected"
                ? "Preview blocked — this upload is quarantined."
                : "Inline preview of the uploaded file."}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <DocumentPreview
              filename={document.filename}
              mime={document.mime}
              type={document.type}
              url={downloadUrl}
            />
          </Card.Content>
        </Card>
      </div>
    </ShowView>
  );
}

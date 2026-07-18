/**
 * @file edit.tsx
 * @module modules/documents/pages/edit
 *
 * @description
 * Document metadata edit — the operator-facing subset (`filename`, `type`,
 * `expiry_at`, `notes`) of the underlying record. The write endpoint is
 * not yet available (fixture-first backend), so `onFinish` posts to the
 * Refine data provider today and the backend still returns 405 — the
 * `TODO(backend-endpoint)` inside the submit handler flags the swap.
 */

import {
  Button,
  Card,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@stackra/ui/react";
import { useForm } from "@refinedev/core";
import { useState } from "react";

import type { Document, DocumentFormValues } from "@/modules/documents/documents.types";
import type { Key, ReactNode } from "react";

import { EditView } from "@/components/refine";
import { DOCUMENT_TYPE_LABELS } from "@/modules/documents/documents.config";

/**
 * Projects a full {@link Document} onto the mutable subset of fields the
 * edit form owns. Every field defaults to the empty string so the
 * controlled inputs stay controlled from the first render.
 */
function toFormValues(record?: Partial<Document>): DocumentFormValues {
  return {
    filename: record?.filename ?? "",
    type: (record?.type as string | undefined) ?? "",
    expiry_at: record?.expiry_at ?? "",
    notes: record?.notes ?? "",
  };
}

/**
 * Converts form values back into a partial `Document` shape suitable for
 * `PUT /api/v1/documents/{id}`. Empty strings become `null` for the
 * nullable columns (`expiry_at`, `notes`) so the backend does not have to
 * distinguish empty vs absent.
 */
export function toDocumentPayload(values: DocumentFormValues): Partial<Document> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  return {
    filename: values.filename.trim(),
    type: values.type.trim(),
    expiry_at: emptyToNull(values.expiry_at),
    notes: emptyToNull(values.notes),
  };
}

/** The document metadata edit page. */
export default function DocumentsEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<Document>({
    resource: "documents",
    action: "edit",
    redirect: "show",
  });

  const record = query?.data?.data;

  if (!record) {
    return (
      <EditView resource="documents">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </EditView>
    );
  }

  return (
    <EditView resource="documents">
      <DocumentEditForm
        initialValues={record}
        isSubmitting={formLoading}
        onSubmit={(values) => {
          // TODO(backend-endpoint): once `PUT /api/v1/documents/{id}` is
          // wired, this call succeeds and Refine redirects to the show
          // page. Until then the request is a no-op (the read-only
          // fixture controller returns 405 Method Not Allowed).
          void onFinish(toDocumentPayload(values));
        }}
      />
    </EditView>
  );
}

/** Props for {@link DocumentEditForm}. */
interface DocumentEditFormProps {
  initialValues: Document;
  isSubmitting: boolean;
  onSubmit: (values: DocumentFormValues) => void;
}

/**
 * Controlled edit form. Kept as a named component so the tests can render
 * it in isolation without the surrounding Refine/`useForm` plumbing.
 */
function DocumentEditForm({
  initialValues,
  isSubmitting,
  onSubmit,
}: DocumentEditFormProps): ReactNode {
  const [values, setValues] = useState<DocumentFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof DocumentFormValues>(
    key: K,
    value: DocumentFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Card.Content>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              isRequired
              className="sm:col-span-2"
              name="filename"
              value={values.filename}
              variant="secondary"
              onChange={(value) => setField("filename", value)}
            >
              <Label>Filename</Label>
              <Input placeholder="report.pdf" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select type"
              value={values.type || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("type", key ? String(key) : "")}
            >
              <Label>Document type</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <ListBox.Item key={value} id={value} textValue={label}>
                      {label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="expiry_at"
              type="date"
              value={values.expiry_at}
              variant="secondary"
              onChange={(value) => setField("expiry_at", value)}
            >
              <Label>Expires on</Label>
              <Input placeholder="YYYY-MM-DD" />
            </TextField>

            <div className="sm:col-span-2">
              <TextField
                name="notes"
                value={values.notes}
                variant="secondary"
                onChange={(value) => setField("notes", value)}
              >
                <Label>Notes</Label>
                <TextArea placeholder="Operator notes…" rows={4} />
              </TextField>
            </div>
          </div>
        </Card.Content>

        <Card.Footer className="mt-4 justify-end">
          <Button isDisabled={isSubmitting} isPending={isSubmitting} type="submit">
            Save changes
          </Button>
        </Card.Footer>
      </Form>
    </Card>
  );
}

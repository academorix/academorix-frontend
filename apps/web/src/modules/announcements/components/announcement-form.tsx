/**
 * @file announcement-form.tsx
 * @module modules/announcements/components/announcement-form
 *
 * @description
 * Shared create/edit form for an announcement. Controlled form seeded from
 * optional initial values; the branch is taken from the active scope.
 */

import {
  Button,
  Card,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@academorix/ui/react";
import { useState } from "react";

import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementStatus,
} from "@/modules/announcements/announcements.types";
import type { Key, ReactNode } from "react";

/** Audience options with labels. */
const AUDIENCES: ReadonlyArray<{ id: AnnouncementAudience; label: string }> = [
  { id: "all", label: "Everyone" },
  { id: "branch", label: "Branch" },
  { id: "team", label: "Team" },
];

/** Status options with labels. */
const STATUSES: ReadonlyArray<{ id: AnnouncementStatus; label: string }> = [
  { id: "draft", label: "Draft" },
  { id: "published", label: "Published" },
];

/** Editable fields of an announcement (excludes server-managed + scope columns). */
export interface AnnouncementFormValues {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Announcement>): AnnouncementFormValues {
  return {
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    audience: initial?.audience ?? "all",
    status: initial?.status ?? "draft",
  };
}

/**
 * Converts form values into an announcement API payload, injecting the active
 * branch and stamping `published_at` when the status is `published`.
 */
export function toAnnouncementPayload(
  values: AnnouncementFormValues,
  branchId: string | null,
): Partial<Announcement> {
  return {
    title: values.title.trim(),
    body: values.body.trim(),
    audience: values.audience,
    status: values.status,
    branch_id: branchId,
    published_at: values.status === "published" ? new Date().toISOString() : null,
  };
}

/** Props for {@link AnnouncementForm}. */
interface AnnouncementFormProps {
  initialValues?: Partial<Announcement>;
  isSubmitting: boolean;
  onSubmit: (values: AnnouncementFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled announcement create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function AnnouncementForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: AnnouncementFormProps): ReactNode {
  const [values, setValues] = useState<AnnouncementFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof AnnouncementFormValues>(
    key: K,
    value: AnnouncementFormValues[K],
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
              name="title"
              value={values.title}
              variant="secondary"
              onChange={(value) => setField("title", value)}
            >
              <Label>Title</Label>
              <Input placeholder="Season kick-off details" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select audience"
              value={values.audience}
              variant="secondary"
              onChange={(key: Key | null) => setField("audience", key as AnnouncementAudience)}
            >
              <Label>Audience</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {AUDIENCES.map((option) => (
                    <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as AnnouncementStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {STATUSES.map((option) => (
                    <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="sm:col-span-2">
              <TextField
                isRequired
                name="body"
                value={values.body}
                variant="secondary"
                onChange={(value) => setField("body", value)}
              >
                <Label>Message</Label>
                <TextArea placeholder="Write the announcement…" rows={5} />
              </TextField>
            </div>
          </div>
        </Card.Content>

        <Card.Footer className="mt-4 justify-end">
          <Button isDisabled={isSubmitting} isPending={isSubmitting} type="submit">
            {submitLabel}
          </Button>
        </Card.Footer>
      </Form>
    </Card>
  );
}

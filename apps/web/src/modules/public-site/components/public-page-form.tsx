/**
 * @file public-page-form.tsx
 * @module modules/public-site/components/public-page-form
 *
 * @description
 * Shared create/edit form for a public-site CMS page. Controlled form seeded
 * from optional initial values. Public pages are tenant-level, so no scope is
 * injected.
 */

import {
  Button,
  Card,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextField,
} from "@academorix/ui/react";
import { useState } from "react";

import type { PublicPage, PublicPageStatus } from "@/modules/public-site/public-site.types";
import type { Key, ReactNode } from "react";

import {
  PUBLIC_PAGE_STATUS_LABELS,
  PUBLIC_PAGE_STATUSES,
} from "@/modules/public-site/public-site.types";

/** Editable fields of a public page (excludes server-managed columns). */
export interface PublicPageFormValues {
  title: string;
  slug: string;
  template: string;
  status: PublicPageStatus;
  is_home: boolean;
  updated_by: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<PublicPage>): PublicPageFormValues {
  return {
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    template: initial?.template ?? "",
    status: initial?.status ?? "draft",
    is_home: initial?.is_home ?? false,
    updated_by: initial?.updated_by ?? "",
  };
}

/** Converts form values into a public-page API payload. Empty strings become `null`. */
export function toPublicPagePayload(values: PublicPageFormValues): Partial<PublicPage> {
  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    template: values.template.trim(),
    status: values.status,
    is_home: values.is_home,
    updated_by: values.updated_by.trim() === "" ? null : values.updated_by.trim(),
  };
}

/** Props for {@link PublicPageForm}. */
interface PublicPageFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<PublicPage>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: PublicPageFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled public-page create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function PublicPageForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: PublicPageFormProps): ReactNode {
  const [values, setValues] = useState<PublicPageFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof PublicPageFormValues>(
    key: K,
    value: PublicPageFormValues[K],
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
              <Input placeholder="About us" />
            </TextField>

            <TextField
              name="slug"
              value={values.slug}
              variant="secondary"
              onChange={(value) => setField("slug", value)}
            >
              <Label>Slug</Label>
              <Input placeholder="about" />
            </TextField>

            <TextField
              name="template"
              value={values.template}
              variant="secondary"
              onChange={(value) => setField("template", value)}
            >
              <Label>Template</Label>
              <Input placeholder="about" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as PublicPageStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {PUBLIC_PAGE_STATUSES.map((status) => (
                    <ListBox.Item
                      key={status}
                      id={status}
                      textValue={PUBLIC_PAGE_STATUS_LABELS[status]}
                    >
                      {PUBLIC_PAGE_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="updated_by"
              value={values.updated_by}
              variant="secondary"
              onChange={(value) => setField("updated_by", value)}
            >
              <Label>Updated by</Label>
              <Input placeholder="usr_admin" />
            </TextField>

            <div className="flex items-center">
              <Switch
                isSelected={values.is_home}
                onChange={(selected) => setField("is_home", selected)}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Home page
                </Switch.Content>
              </Switch>
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

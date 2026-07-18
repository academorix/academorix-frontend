/**
 * @file integration-form.tsx
 * @module modules/integrations/components/integration-form
 *
 * @description
 * Shared create/edit form for a third-party integration. Controlled form seeded
 * from optional initial values. Integrations are tenant-level, so no scope is
 * injected. The last-sync timestamp uses a `datetime-local` input.
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
  TextArea,
  TextField,
} from "@stackra/ui/react";
import { useState } from "react";

import type { Integration, IntegrationStatus } from "@/modules/integrations/integrations.types";
import type { Key, ReactNode } from "react";

import {
  INTEGRATION_STATUS_LABELS,
  INTEGRATION_STATUSES,
} from "@/modules/integrations/integrations.types";

/** Trims an ISO timestamp to the `datetime-local` input format (`YYYY-MM-DDTHH:mm`). */
function toLocalInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : "";
}

/** Editable fields of an integration (excludes server-managed columns). */
export interface IntegrationFormValues {
  name: string;
  provider: string;
  category: string;
  status: IntegrationStatus;
  is_enabled: boolean;
  last_synced_at: string;
  note: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Integration>): IntegrationFormValues {
  return {
    name: initial?.name ?? "",
    provider: initial?.provider ?? "",
    category: initial?.category ?? "",
    status: initial?.status ?? "disconnected",
    is_enabled: initial?.is_enabled ?? false,
    last_synced_at: toLocalInput(initial?.last_synced_at),
    note: initial?.note ?? "",
  };
}

/** Converts form values into an integration API payload. Empty strings become `null`. */
export function toIntegrationPayload(values: IntegrationFormValues): Partial<Integration> {
  return {
    name: values.name.trim(),
    provider: values.provider.trim(),
    category: values.category.trim(),
    status: values.status,
    is_enabled: values.is_enabled,
    last_synced_at: values.last_synced_at === "" ? null : values.last_synced_at,
    note: values.note.trim() === "" ? null : values.note.trim(),
  };
}

/** Props for {@link IntegrationForm}. */
interface IntegrationFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Integration>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: IntegrationFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled integration create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function IntegrationForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: IntegrationFormProps): ReactNode {
  const [values, setValues] = useState<IntegrationFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof IntegrationFormValues>(
    key: K,
    value: IntegrationFormValues[K],
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
              name="name"
              value={values.name}
              variant="secondary"
              onChange={(value) => setField("name", value)}
            >
              <Label>Name</Label>
              <Input placeholder="Stripe" />
            </TextField>

            <TextField
              isRequired
              name="provider"
              value={values.provider}
              variant="secondary"
              onChange={(value) => setField("provider", value)}
            >
              <Label>Provider</Label>
              <Input placeholder="stripe" />
            </TextField>

            <TextField
              name="category"
              value={values.category}
              variant="secondary"
              onChange={(value) => setField("category", value)}
            >
              <Label>Category</Label>
              <Input placeholder="payments" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as IntegrationStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {INTEGRATION_STATUSES.map((status) => (
                    <ListBox.Item
                      key={status}
                      id={status}
                      textValue={INTEGRATION_STATUS_LABELS[status]}
                    >
                      {INTEGRATION_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="last_synced_at"
              type="datetime-local"
              value={values.last_synced_at}
              variant="secondary"
              onChange={(value) => setField("last_synced_at", value)}
            >
              <Label>Last synced at</Label>
              <Input />
            </TextField>

            <div className="flex items-center">
              <Switch
                isSelected={values.is_enabled}
                onChange={(selected) => setField("is_enabled", selected)}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Enabled
                </Switch.Content>
              </Switch>
            </div>

            <div className="sm:col-span-2">
              <TextField
                name="note"
                value={values.note}
                variant="secondary"
                onChange={(value) => setField("note", value)}
              >
                <Label>Note</Label>
                <TextArea placeholder="Connection notes…" rows={4} />
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

/**
 * @file season-form.tsx
 * @module modules/sports/seasons/components/season-form
 *
 * @description
 * Shared create/edit form for a season. Controlled form seeded from optional
 * initial values; the organization options come from the caller's accessible
 * scope. Season dates and the age cut-off are plain date inputs.
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

import type { Season, SeasonStatus } from "@/types";
import type { Key, ReactNode } from "react";

import { useScope } from "@/lib/scope";
import { SEASON_STATUS_LABELS, SEASON_STATUSES } from "@/types";

/** Editable fields of a season (excludes server-managed columns). */
export interface SeasonFormValues {
  name: string;
  organization_id: string;
  status: SeasonStatus;
  start_date: string;
  end_date: string;
  is_current: boolean;
  age_cutoff_date: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(scopeOrgId: string | null, initial?: Partial<Season>): SeasonFormValues {
  return {
    name: initial?.name ?? "",
    organization_id: initial?.organization_id ?? scopeOrgId ?? "",
    status: initial?.status ?? "upcoming",
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
    is_current: initial?.is_current ?? false,
    age_cutoff_date: initial?.age_cutoff_date ?? "",
  };
}

/** Converts form values into a season API payload. */
export function toSeasonPayload(values: SeasonFormValues): Partial<Season> {
  return {
    name: values.name.trim(),
    organization_id: values.organization_id,
    status: values.status,
    start_date: values.start_date,
    end_date: values.end_date,
    is_current: values.is_current,
    age_cutoff_date: values.age_cutoff_date === "" ? null : values.age_cutoff_date,
  };
}

/** Props for {@link SeasonForm}. */
interface SeasonFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Season>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: SeasonFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled season create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function SeasonForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: SeasonFormProps): ReactNode {
  const { scope, allowed } = useScope();
  const [values, setValues] = useState<SeasonFormValues>(() =>
    toFormValues(scope.organizationId, initialValues),
  );

  const setField = <K extends keyof SeasonFormValues>(key: K, value: SeasonFormValues[K]): void => {
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
              <Input placeholder="2025/26" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select organization"
              value={values.organization_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("organization_id", key ? String(key) : "")}
            >
              <Label>Organization</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {allowed.organizations.map((org) => (
                    <ListBox.Item key={org.id} id={org.id} textValue={org.name}>
                      {org.name}
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
              onChange={(key: Key | null) => setField("status", key as SeasonStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {SEASON_STATUSES.map((status) => (
                    <ListBox.Item key={status} id={status} textValue={SEASON_STATUS_LABELS[status]}>
                      {SEASON_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              isRequired
              name="start_date"
              type="date"
              value={values.start_date}
              variant="secondary"
              onChange={(value) => setField("start_date", value)}
            >
              <Label>Start date</Label>
              <Input />
            </TextField>

            <TextField
              isRequired
              name="end_date"
              type="date"
              value={values.end_date}
              variant="secondary"
              onChange={(value) => setField("end_date", value)}
            >
              <Label>End date</Label>
              <Input />
            </TextField>

            <TextField
              name="age_cutoff_date"
              type="date"
              value={values.age_cutoff_date}
              variant="secondary"
              onChange={(value) => setField("age_cutoff_date", value)}
            >
              <Label>Age cut-off date</Label>
              <Input />
            </TextField>

            <div className="flex items-center">
              <Switch
                isSelected={values.is_current}
                onChange={(selected) => setField("is_current", selected)}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Current season
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

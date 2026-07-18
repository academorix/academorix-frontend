/**
 * @file competition-form.tsx
 * @module modules/sports/competition/components/competition-form
 *
 * @description
 * Shared create/edit form for a competition. Controlled form seeded from
 * optional initial values; the active organization/branch are injected from the
 * caller's scope at submit time (see {@link toCompetitionPayload}).
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@stackra/ui/react";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type {
  Competition,
  CompetitionFormat,
  CompetitionStatus,
} from "@/modules/sports/competition/competition.types";
import type { FormEvent, Key, ReactNode } from "react";

import {
  COMPETITION_FORMAT_LABELS,
  COMPETITION_FORMATS,
  COMPETITION_STATUS_LABELS,
  COMPETITION_STATUSES,
} from "@/modules/sports/competition/competition.types";

/** Editable fields of a competition (excludes server-managed + scope columns). */
export interface CompetitionFormValues {
  name: string;
  sport_key: string;
  format: CompetitionFormat;
  status: CompetitionStatus;
  season_id: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Competition>): CompetitionFormValues {
  return {
    name: initial?.name ?? "",
    sport_key: initial?.sport_key ?? "",
    format: initial?.format ?? "league",
    status: initial?.status ?? "upcoming",
    season_id: initial?.season_id ?? "",
  };
}

/**
 * Converts form values into a competition API payload, injecting the active
 * organization/branch from the caller's scope. Empty strings become `null`.
 */
export function toCompetitionPayload(
  values: CompetitionFormValues,
  scope: ActiveScope,
): Partial<Competition> {
  return {
    name: values.name.trim(),
    sport_key: values.sport_key.trim(),
    format: values.format,
    status: values.status,
    season_id: values.season_id === "" ? null : values.season_id,
    organization_id: scope.organizationId ?? "",
    branch_id: scope.branchId ?? "",
  };
}

/** Props for {@link CompetitionForm}. */
interface CompetitionFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Competition>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: CompetitionFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled competition create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function CompetitionForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: CompetitionFormProps): ReactNode {
  const [values, setValues] = useState<CompetitionFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof CompetitionFormValues>(
    key: K,
    value: CompetitionFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
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
              name="name"
              value={values.name}
              variant="secondary"
              onChange={(value) => setField("name", value)}
            >
              <Label>Name</Label>
              <Input placeholder="U12 Regional League" />
            </TextField>

            <TextField
              isRequired
              name="sport_key"
              value={values.sport_key}
              variant="secondary"
              onChange={(value) => setField("sport_key", value)}
            >
              <Label>Sport</Label>
              <Input placeholder="football" />
            </TextField>

            <TextField
              name="season_id"
              value={values.season_id}
              variant="secondary"
              onChange={(value) => setField("season_id", value)}
            >
              <Label>Season ID</Label>
              <Input placeholder="Optional" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select format"
              value={values.format}
              variant="secondary"
              onChange={(key: Key | null) => setField("format", key as CompetitionFormat)}
            >
              <Label>Format</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {COMPETITION_FORMATS.map((format) => (
                    <ListBox.Item
                      key={format}
                      id={format}
                      textValue={COMPETITION_FORMAT_LABELS[format]}
                    >
                      {COMPETITION_FORMAT_LABELS[format]}
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
              onChange={(key: Key | null) => setField("status", key as CompetitionStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {COMPETITION_STATUSES.map((status) => (
                    <ListBox.Item
                      key={status}
                      id={status}
                      textValue={COMPETITION_STATUS_LABELS[status]}
                    >
                      {COMPETITION_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
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

/**
 * @file pass-form.tsx
 * @module modules/passes/components/pass-form
 *
 * @description
 * Shared create/edit form for a digital pass. Controlled form seeded from
 * optional initial values; athlete options come from the `athletes` resource,
 * and the active organization/branch are injected from the caller's scope at
 * submit time (see {@link toPassPayload}). Validity uses `date` inputs.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@academorix/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type { Pass, PassStatus, PassType } from "@/modules/passes/passes.types";
import type { Athlete } from "@/types";
import type { Key, ReactNode } from "react";

import {
  PASS_STATUS_LABELS,
  PASS_STATUSES,
  PASS_TYPE_LABELS,
  PASS_TYPES,
} from "@/modules/passes/passes.types";

/** Trims an ISO timestamp to the `date` input format (`YYYY-MM-DD`). */
function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

/** Editable fields of a pass (excludes server-managed + scope columns). */
export interface PassFormValues {
  holder_name: string;
  athlete_id: string;
  type: PassType;
  code: string;
  status: PassStatus;
  valid_from: string;
  valid_until: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Pass>): PassFormValues {
  return {
    holder_name: initial?.holder_name ?? "",
    athlete_id: initial?.athlete_id ?? "",
    type: initial?.type ?? "membership",
    code: initial?.code ?? "",
    status: initial?.status ?? "active",
    valid_from: toDateInput(initial?.valid_from),
    valid_until: toDateInput(initial?.valid_until),
  };
}

/**
 * Converts form values into a pass API payload, injecting the active
 * organization/branch from the caller's scope. Empty strings become `null`.
 */
export function toPassPayload(values: PassFormValues, scope: ActiveScope): Partial<Pass> {
  return {
    holder_name: values.holder_name.trim(),
    athlete_id: values.athlete_id === "" ? null : values.athlete_id,
    type: values.type,
    code: values.code.trim(),
    status: values.status,
    valid_from: values.valid_from,
    valid_until: values.valid_until === "" ? null : values.valid_until,
    organization_id: scope.organizationId ?? "",
    branch_id: scope.branchId ?? "",
  };
}

/** Props for {@link PassForm}. */
interface PassFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Pass>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: PassFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled pass create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function PassForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: PassFormProps): ReactNode {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const athletes = athletesResult?.data ?? [];

  const [values, setValues] = useState<PassFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof PassFormValues>(key: K, value: PassFormValues[K]): void => {
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
              name="holder_name"
              value={values.holder_name}
              variant="secondary"
              onChange={(value) => setField("holder_name", value)}
            >
              <Label>Holder name</Label>
              <Input placeholder="Emma Carter" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select athlete"
              value={values.athlete_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("athlete_id", key ? String(key) : "")}
            >
              <Label>Athlete</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {athletes.map((athlete) => (
                    <ListBox.Item
                      key={athlete.id}
                      id={athlete.id}
                      textValue={`${athlete.first_name} ${athlete.last_name}`}
                    >
                      {athlete.first_name} {athlete.last_name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-full"
              placeholder="Select type"
              value={values.type}
              variant="secondary"
              onChange={(key: Key | null) => setField("type", key as PassType)}
            >
              <Label>Type</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {PASS_TYPES.map((type) => (
                    <ListBox.Item key={type} id={type} textValue={PASS_TYPE_LABELS[type]}>
                      {PASS_TYPE_LABELS[type]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              isRequired
              name="code"
              value={values.code}
              variant="secondary"
              onChange={(value) => setField("code", value)}
            >
              <Label>Code</Label>
              <Input placeholder="AMX-EMMA-8F3K-2027" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as PassStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {PASS_STATUSES.map((status) => (
                    <ListBox.Item key={status} id={status} textValue={PASS_STATUS_LABELS[status]}>
                      {PASS_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              isRequired
              name="valid_from"
              type="date"
              value={values.valid_from}
              variant="secondary"
              onChange={(value) => setField("valid_from", value)}
            >
              <Label>Valid from</Label>
              <Input />
            </TextField>

            <TextField
              name="valid_until"
              type="date"
              value={values.valid_until}
              variant="secondary"
              onChange={(value) => setField("valid_until", value)}
            >
              <Label>Valid until</Label>
              <Input />
            </TextField>
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

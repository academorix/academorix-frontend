/**
 * @file safeguarding-form.tsx
 * @module modules/safeguarding/components/safeguarding-form
 *
 * @description
 * Shared create/edit form for a safeguarding case. Controlled form seeded from
 * optional initial values; the athlete options are loaded from the `athletes`
 * resource and the organization/branch are taken from the active scope. The
 * subject athlete is optional — a case may be general (not athlete-specific).
 *
 * **Sensitive data**: this surface is gated behind the `safeguarding` permission
 * by the resource's access rules; only designated leads/admins reach it.
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
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type {
  SafeguardingCase,
  SafeguardingSeverity,
  SafeguardingStatus,
} from "@/modules/safeguarding/safeguarding.types";
import type { Athlete } from "@/types";
import type { Key, ReactNode } from "react";

import { useScope } from "@/lib/scope";
import {
  SAFEGUARDING_SEVERITIES,
  SAFEGUARDING_SEVERITY_LABELS,
  SAFEGUARDING_STATUSES,
  SAFEGUARDING_STATUS_LABELS,
} from "@/modules/safeguarding/safeguarding.types";

/** Sentinel Select id for "no subject athlete" (a general/facility concern). */
const GENERAL_SUBJECT = "__general__";

/** Editable fields of a safeguarding case (excludes server-managed + scope columns). */
export interface SafeguardingFormValues {
  /** Subject athlete id, or `""` for a general (not athlete-specific) case. */
  athlete_id: string;
  category: string;
  severity: SafeguardingSeverity;
  status: SafeguardingStatus;
  summary: string;
  handler_id: string;
  opened_at: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<SafeguardingCase>): SafeguardingFormValues {
  return {
    athlete_id: initial?.athlete_id ?? "",
    category: initial?.category ?? "",
    severity: initial?.severity ?? "low",
    status: initial?.status ?? "open",
    summary: initial?.summary ?? "",
    handler_id: initial?.handler_id ?? "",
    opened_at: initial?.opened_at ?? "",
  };
}

/**
 * Converts form values into a safeguarding-case API payload, injecting the
 * active organization/branch and mapping an empty subject to `null` (general).
 */
export function toSafeguardingPayload(
  values: SafeguardingFormValues,
  scope?: ActiveScope,
): Partial<SafeguardingCase> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  return {
    organization_id: scope?.organizationId ?? "",
    branch_id: scope?.branchId ?? "",
    athlete_id: values.athlete_id === "" ? null : values.athlete_id,
    category: values.category.trim(),
    severity: values.severity,
    status: values.status,
    summary: values.summary.trim(),
    handler_id: emptyToNull(values.handler_id),
    opened_at: values.opened_at,
  };
}

/** Props for {@link SafeguardingForm}. */
interface SafeguardingFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<SafeguardingCase>;
  /** Whether a submit is in flight. */
  isSubmitting?: boolean;
  /** Called with the built API payload on submit. */
  onSubmit: (payload: Partial<SafeguardingCase>) => void;
}

/**
 * A controlled safeguarding-case create/edit form.
 *
 * @param props - Initial values, submit state, and the submit handler.
 */
export function SafeguardingForm({
  initialValues,
  isSubmitting = false,
  onSubmit,
}: SafeguardingFormProps): ReactNode {
  const { scope } = useScope();
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const athletes = athletesResult?.data ?? [];

  const [values, setValues] = useState<SafeguardingFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof SafeguardingFormValues>(
    key: K,
    value: SafeguardingFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(toSafeguardingPayload(values, scope));
  };

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Card.Content>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              className="w-full"
              placeholder="Select subject"
              value={values.athlete_id === "" ? GENERAL_SUBJECT : values.athlete_id}
              variant="secondary"
              onChange={(key: Key | null) =>
                setField("athlete_id", key === null || key === GENERAL_SUBJECT ? "" : String(key))
              }
            >
              <Label>Subject athlete</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id={GENERAL_SUBJECT} textValue="General / not athlete-specific">
                    General / not athlete-specific
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
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

            <TextField
              isRequired
              name="category"
              value={values.category}
              variant="secondary"
              onChange={(value) => setField("category", value)}
            >
              <Label>Category</Label>
              <Input placeholder="welfare / conduct / facility_safety" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select severity"
              value={values.severity}
              variant="secondary"
              onChange={(key: Key | null) => setField("severity", key as SafeguardingSeverity)}
            >
              <Label>Severity</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {SAFEGUARDING_SEVERITIES.map((severity) => (
                    <ListBox.Item
                      key={severity}
                      id={severity}
                      textValue={SAFEGUARDING_SEVERITY_LABELS[severity]}
                    >
                      {SAFEGUARDING_SEVERITY_LABELS[severity]}
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
              onChange={(key: Key | null) => setField("status", key as SafeguardingStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {SAFEGUARDING_STATUSES.map((status) => (
                    <ListBox.Item
                      key={status}
                      id={status}
                      textValue={SAFEGUARDING_STATUS_LABELS[status]}
                    >
                      {SAFEGUARDING_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="handler_id"
              value={values.handler_id}
              variant="secondary"
              onChange={(value) => setField("handler_id", value)}
            >
              <Label>Handler ID</Label>
              <Input placeholder="Optional" />
            </TextField>

            <TextField
              isRequired
              name="opened_at"
              type="date"
              value={values.opened_at}
              variant="secondary"
              onChange={(value) => setField("opened_at", value)}
            >
              <Label>Opened on</Label>
              <Input />
            </TextField>

            <div className="sm:col-span-2">
              <TextField
                isRequired
                name="summary"
                value={values.summary}
                variant="secondary"
                onChange={(value) => setField("summary", value)}
              >
                <Label>Summary</Label>
                <TextArea placeholder="Non-graphic case summary…" rows={5} />
              </TextField>
            </div>
          </div>
        </Card.Content>

        <Card.Footer className="mt-4 justify-end">
          <Button isDisabled={isSubmitting} isPending={isSubmitting} type="submit">
            Save
          </Button>
        </Card.Footer>
      </Form>
    </Card>
  );
}

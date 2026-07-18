/**
 * @file lead-form.tsx
 * @module modules/leads/components/lead-form
 *
 * @description
 * Shared create/edit form for a CRM lead. Controlled form seeded from optional
 * initial values; owner options come from the `staff` resource, and the active
 * organization/branch are injected from the caller's scope at submit time (see
 * {@link toLeadPayload}).
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
} from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type { Lead, LeadStage } from "@/modules/leads/leads.types";
import type { Staff } from "@/types";
import type { Key, ReactNode } from "react";

import { LEAD_STAGE_LABELS, LEAD_STAGES } from "@/modules/leads/leads.types";

/** Sentinel option id representing an unassigned owner (maps to `null`). */
const UNASSIGNED_OWNER = "__unassigned__";

/** Editable fields of a lead (excludes server-managed + scope columns). */
export interface LeadFormValues {
  name: string;
  contact_email: string;
  contact_phone: string;
  sport_key: string;
  stage: LeadStage;
  source: string;
  /** Owning staff id, or {@link UNASSIGNED_OWNER} when no owner is set. */
  owner_id: string;
  note: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Lead>): LeadFormValues {
  return {
    name: initial?.name ?? "",
    contact_email: initial?.contact_email ?? "",
    contact_phone: initial?.contact_phone ?? "",
    sport_key: initial?.sport_key ?? "",
    stage: initial?.stage ?? "new",
    source: initial?.source ?? "",
    owner_id: initial?.owner_id ?? UNASSIGNED_OWNER,
    note: initial?.note ?? "",
  };
}

/**
 * Converts form values into a lead API payload, injecting the active
 * organization/branch from the caller's scope. Empty strings become `null`.
 */
export function toLeadPayload(values: LeadFormValues, scope: ActiveScope): Partial<Lead> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  return {
    name: values.name.trim(),
    contact_email: emptyToNull(values.contact_email),
    contact_phone: emptyToNull(values.contact_phone),
    sport_key: emptyToNull(values.sport_key),
    stage: values.stage,
    source: values.source.trim(),
    owner_id: values.owner_id === UNASSIGNED_OWNER ? null : values.owner_id,
    note: emptyToNull(values.note),
    organization_id: scope.organizationId ?? "",
    branch_id: scope.branchId ?? "",
  };
}

/** Props for {@link LeadForm}. */
interface LeadFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Lead>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: LeadFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled lead create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function LeadForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: LeadFormProps): ReactNode {
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const staff = staffResult?.data ?? [];

  const [values, setValues] = useState<LeadFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]): void => {
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
              name="name"
              value={values.name}
              variant="secondary"
              onChange={(value) => setField("name", value)}
            >
              <Label>Name</Label>
              <Input placeholder="Jordan Reyes" />
            </TextField>

            <TextField
              name="contact_email"
              type="email"
              value={values.contact_email}
              variant="secondary"
              onChange={(value) => setField("contact_email", value)}
            >
              <Label>Contact email</Label>
              <Input placeholder="jordan@example.com" />
            </TextField>

            <TextField
              name="contact_phone"
              type="tel"
              value={values.contact_phone}
              variant="secondary"
              onChange={(value) => setField("contact_phone", value)}
            >
              <Label>Contact phone</Label>
              <Input placeholder="+1 555 0100" />
            </TextField>

            <TextField
              name="sport_key"
              value={values.sport_key}
              variant="secondary"
              onChange={(value) => setField("sport_key", value)}
            >
              <Label>Sport</Label>
              <Input placeholder="football" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select stage"
              value={values.stage}
              variant="secondary"
              onChange={(key: Key | null) => setField("stage", key as LeadStage)}
            >
              <Label>Stage</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {LEAD_STAGES.map((stage) => (
                    <ListBox.Item key={stage} id={stage} textValue={LEAD_STAGE_LABELS[stage]}>
                      {LEAD_STAGE_LABELS[stage]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="source"
              value={values.source}
              variant="secondary"
              onChange={(value) => setField("source", value)}
            >
              <Label>Source</Label>
              <Input placeholder="web" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select owner"
              value={values.owner_id || null}
              variant="secondary"
              onChange={(key: Key | null) =>
                setField("owner_id", key ? String(key) : UNASSIGNED_OWNER)
              }
            >
              <Label>Owner</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id={UNASSIGNED_OWNER} textValue="Unassigned">
                    Unassigned
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {staff.map((member) => (
                    <ListBox.Item
                      key={member.id}
                      id={member.id}
                      textValue={`${member.first_name} ${member.last_name}`}
                    >
                      {member.first_name} {member.last_name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="sm:col-span-2">
              <TextField
                name="note"
                value={values.note}
                variant="secondary"
                onChange={(value) => setField("note", value)}
              >
                <Label>Note</Label>
                <TextArea placeholder="Pipeline notes…" rows={4} />
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

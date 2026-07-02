/**
 * @file athlete-form.tsx
 * @module modules/athletes/components/athlete-form
 *
 * @description
 * The shared create/edit form for athletes. It is a **controlled** form seeded
 * from optional initial values (empty for create, the fetched record for edit)
 * and calls `onSubmit` with the collected {@link AthleteFormValues}. Data
 * fetching and the mutation live in the page (`useForm`); this component owns
 * only the fields and local input state, so it works identically for create and
 * edit under either data provider.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@academorix/ui/react";
import { useState } from "react";

import type { Athlete, EntityStatus } from "@/types";
import type { Key, ReactNode } from "react";

import { ENTITY_STATUSES, ENTITY_STATUS_LABELS } from "@/types";

/** The editable fields of an athlete (excludes server-managed columns). */
export interface AthleteFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: EntityStatus;
  gender: "male" | "female" | "other" | "";
  branch_id: string;
  date_of_birth: string;
  enrolled_at: string;
}

/** Gender options for the select (empty value = unspecified). */
const GENDER_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
] as const;

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Athlete>): AthleteFormValues {
  return {
    first_name: initial?.first_name ?? "",
    last_name: initial?.last_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    status: initial?.status ?? "pending",
    gender: initial?.gender ?? "",
    branch_id: initial?.branch_id ?? "",
    date_of_birth: initial?.date_of_birth ?? "",
    enrolled_at: (initial?.enrolled_at ?? new Date().toISOString()).slice(0, 10),
  };
}

/**
 * Converts collected form values into an API payload: trims strings and maps
 * empty optional fields to `null` so the backend stores absent values as null
 * rather than empty strings.
 */
export function toAthletePayload(values: AthleteFormValues): Partial<Athlete> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email.trim(),
    phone: emptyToNull(values.phone),
    status: values.status,
    gender: values.gender === "" ? null : values.gender,
    branch_id: values.branch_id.trim(),
    date_of_birth: emptyToNull(values.date_of_birth),
    enrolled_at: values.enrolled_at,
  };
}

/** Props for {@link AthleteForm}. */
interface AthleteFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Athlete>;
  /** Whether a submit is in flight (disables the submit button). */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: AthleteFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled athlete create/edit form.
 *
 * @param props - Initial values, submit state, and the submit handler.
 */
export function AthleteForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: AthleteFormProps): ReactNode {
  const [values, setValues] = useState<AthleteFormValues>(() => toFormValues(initialValues));

  /** Updates a single field by key. */
  const setField = <K extends keyof AthleteFormValues>(
    key: K,
    value: AthleteFormValues[K],
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
              name="first_name"
              value={values.first_name}
              variant="secondary"
              onChange={(value) => setField("first_name", value)}
            >
              <Label>First name</Label>
              <Input placeholder="Emma" />
            </TextField>

            <TextField
              isRequired
              name="last_name"
              value={values.last_name}
              variant="secondary"
              onChange={(value) => setField("last_name", value)}
            >
              <Label>Last name</Label>
              <Input placeholder="Johnson" />
            </TextField>

            <TextField
              isRequired
              name="email"
              type="email"
              value={values.email}
              variant="secondary"
              onChange={(value) => setField("email", value)}
            >
              <Label>Email</Label>
              <Input placeholder="emma@example.com" />
            </TextField>

            <TextField
              name="phone"
              type="tel"
              value={values.phone}
              variant="secondary"
              onChange={(value) => setField("phone", value)}
            >
              <Label>Phone</Label>
              <Input placeholder="+1 555 1000" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as EntityStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {ENTITY_STATUSES.map((status) => (
                    <ListBox.Item key={status} id={status} textValue={ENTITY_STATUS_LABELS[status]}>
                      {ENTITY_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-full"
              placeholder="Select gender"
              value={values.gender || null}
              variant="secondary"
              onChange={(key: Key | null) =>
                setField("gender", (key as AthleteFormValues["gender"] | null) ?? "")
              }
            >
              <Label>Gender</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {GENDER_OPTIONS.map((option) => (
                    <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="date_of_birth"
              type="date"
              value={values.date_of_birth}
              variant="secondary"
              onChange={(value) => setField("date_of_birth", value)}
            >
              <Label>Date of birth</Label>
              <Input />
            </TextField>

            <TextField
              isRequired
              name="branch_id"
              value={values.branch_id}
              variant="secondary"
              onChange={(value) => setField("branch_id", value)}
            >
              <Label>Branch ID</Label>
              <Input placeholder="brn_river" />
            </TextField>

            <TextField
              isRequired
              name="enrolled_at"
              type="date"
              value={values.enrolled_at}
              variant="secondary"
              onChange={(value) => setField("enrolled_at", value)}
            >
              <Label>Enrolled on</Label>
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

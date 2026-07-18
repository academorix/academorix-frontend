/**
 * @file staff-form.tsx
 * @module modules/staff/components/staff-form
 *
 * @description
 * Shared create/edit form for a staff member (coach/admin/reception/medical).
 * Controlled form seeded from optional initial values; the branch comes from the
 * active scope.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@stackra/ui/react";
import { useState } from "react";

import type { Staff, StaffEmploymentType, StaffStatus } from "@/types";
import type { Key, ReactNode } from "react";

import {
  STAFF_EMPLOYMENT_TYPE_LABELS,
  STAFF_EMPLOYMENT_TYPES,
  STAFF_STATUS_LABELS,
  STAFF_STATUSES,
} from "@/types";

/** Editable fields of a staff member (excludes server-managed columns). */
export interface StaffFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  employment_type: StaffEmploymentType;
  base_pay: string;
  currency: string;
  status: StaffStatus;
  hired_at: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Staff>): StaffFormValues {
  return {
    first_name: initial?.first_name ?? "",
    last_name: initial?.last_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    title: initial?.title ?? "",
    employment_type: initial?.employment_type ?? "salaried",
    base_pay: initial?.base_pay ?? "0.00",
    currency: initial?.currency ?? "USD",
    status: initial?.status ?? "active",
    hired_at: initial?.hired_at ?? new Date().toISOString().slice(0, 10),
  };
}

/** Converts form values into a staff API payload. */
export function toStaffPayload(values: StaffFormValues, branchId: string | null): Partial<Staff> {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() === "" ? null : values.phone.trim(),
    title: values.title.trim(),
    employment_type: values.employment_type,
    base_pay: values.base_pay.trim() || "0.00",
    currency: values.currency.trim() || "USD",
    status: values.status,
    hired_at: values.hired_at === "" ? null : values.hired_at,
    ...(branchId ? { branch_id: branchId } : {}),
  };
}

/** Props for {@link StaffForm}. */
interface StaffFormProps {
  initialValues?: Partial<Staff>;
  isSubmitting: boolean;
  onSubmit: (values: StaffFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled staff create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function StaffForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: StaffFormProps): ReactNode {
  const [values, setValues] = useState<StaffFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]): void => {
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
              <Input placeholder="Mike" />
            </TextField>

            <TextField
              isRequired
              name="last_name"
              value={values.last_name}
              variant="secondary"
              onChange={(value) => setField("last_name", value)}
            >
              <Label>Last name</Label>
              <Input placeholder="Turner" />
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
              <Input placeholder="mike@example.com" />
            </TextField>

            <TextField
              name="phone"
              type="tel"
              value={values.phone}
              variant="secondary"
              onChange={(value) => setField("phone", value)}
            >
              <Label>Phone</Label>
              <Input placeholder="+1 555 3000" />
            </TextField>

            <TextField
              isRequired
              name="title"
              value={values.title}
              variant="secondary"
              onChange={(value) => setField("title", value)}
            >
              <Label>Title</Label>
              <Input placeholder="Head Coach" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select employment"
              value={values.employment_type}
              variant="secondary"
              onChange={(key: Key | null) =>
                setField("employment_type", key as StaffEmploymentType)
              }
            >
              <Label>Employment</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {STAFF_EMPLOYMENT_TYPES.map((type) => (
                    <ListBox.Item
                      key={type}
                      id={type}
                      textValue={STAFF_EMPLOYMENT_TYPE_LABELS[type]}
                    >
                      {STAFF_EMPLOYMENT_TYPE_LABELS[type]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="base_pay"
              value={values.base_pay}
              variant="secondary"
              onChange={(value) => setField("base_pay", value)}
            >
              <Label>Base pay</Label>
              <Input placeholder="4000.00" />
            </TextField>

            <TextField
              name="currency"
              value={values.currency}
              variant="secondary"
              onChange={(value) => setField("currency", value)}
            >
              <Label>Currency</Label>
              <Input placeholder="USD" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as StaffStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {STAFF_STATUSES.map((status) => (
                    <ListBox.Item key={status} id={status} textValue={STAFF_STATUS_LABELS[status]}>
                      {STAFF_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="hired_at"
              type="date"
              value={values.hired_at}
              variant="secondary"
              onChange={(value) => setField("hired_at", value)}
            >
              <Label>Hired on</Label>
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

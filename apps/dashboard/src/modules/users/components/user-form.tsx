/**
 * @file user-form.tsx
 * @module modules/users/components/user-form
 *
 * @description
 * Shared create/edit form for a user account's identity and status. Role
 * assignment is managed by the Access module, not here.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@stackra/ui/react";
import { useState } from "react";

import type { User, UserStatus } from "@/types";
import type { Key, ReactNode } from "react";

import { USER_STATUS_LABELS, USER_STATUSES } from "@/types";

/** Editable identity fields of a user (excludes roles + server-managed columns). */
export interface UserFormValues {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  phone: string;
  status: UserStatus;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<User>): UserFormValues {
  return {
    first_name: initial?.first_name ?? "",
    last_name: initial?.last_name ?? "",
    email: initial?.email ?? "",
    username: initial?.username ?? "",
    phone: initial?.phone ?? "",
    status: initial?.status ?? "pending_verification",
  };
}

/** Converts form values into a user API payload. */
export function toUserPayload(values: UserFormValues): Partial<User> {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email.trim(),
    username: values.username.trim() === "" ? null : values.username.trim(),
    phone: values.phone.trim() === "" ? null : values.phone.trim(),
    status: values.status,
  };
}

/** Props for {@link UserForm}. */
interface UserFormProps {
  initialValues?: Partial<User>;
  isSubmitting: boolean;
  onSubmit: (values: UserFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled user create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function UserForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: UserFormProps): ReactNode {
  const [values, setValues] = useState<UserFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]): void => {
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
              <Input placeholder="Jordan" />
            </TextField>

            <TextField
              isRequired
              name="last_name"
              value={values.last_name}
              variant="secondary"
              onChange={(value) => setField("last_name", value)}
            >
              <Label>Last name</Label>
              <Input placeholder="Reed" />
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
              <Input placeholder="jordan@example.com" />
            </TextField>

            <TextField
              name="username"
              value={values.username}
              variant="secondary"
              onChange={(value) => setField("username", value)}
            >
              <Label>Username</Label>
              <Input placeholder="jordan" />
            </TextField>

            <TextField
              name="phone"
              type="tel"
              value={values.phone}
              variant="secondary"
              onChange={(value) => setField("phone", value)}
            >
              <Label>Phone</Label>
              <Input placeholder="+1 555 4000" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as UserStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {USER_STATUSES.map((status) => (
                    <ListBox.Item key={status} id={status} textValue={USER_STATUS_LABELS[status]}>
                      {USER_STATUS_LABELS[status]}
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

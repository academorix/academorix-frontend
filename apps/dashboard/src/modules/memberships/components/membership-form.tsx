/**
 * @file membership-form.tsx
 * @module modules/memberships/components/membership-form
 *
 * @description
 * Shared create/edit form for a recurring membership. Controlled form seeded from
 * optional initial values; the branch is taken from the active scope.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@stackra/ui/react";
import { useState } from "react";

import type { Membership, MembershipStatus } from "@/types";
import type { Key, ReactNode } from "react";

import { MEMBERSHIP_STATUS_LABELS, MEMBERSHIP_STATUSES } from "@/types";

/** Recurrence intervals a membership can bill on. */
const INTERVALS: ReadonlyArray<Membership["interval"]> = ["week", "month", "quarter", "year"];

/** Editable fields of a membership (excludes server-managed columns). */
export interface MembershipFormValues {
  plan_name: string;
  customer_id: string;
  athlete_id: string;
  status: MembershipStatus;
  currency: string;
  price: string;
  interval: Membership["interval"];
  current_period_start: string;
  current_period_end: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Membership>): MembershipFormValues {
  return {
    plan_name: initial?.plan_name ?? "",
    customer_id: initial?.customer_id ?? "",
    athlete_id: initial?.athlete_id ?? "",
    status: initial?.status ?? "active",
    currency: initial?.currency ?? "USD",
    price: initial?.price ?? "0.00",
    interval: initial?.interval ?? "month",
    current_period_start: initial?.current_period_start ?? new Date().toISOString().slice(0, 10),
    current_period_end: initial?.current_period_end ?? "",
  };
}

/** Converts form values into a membership API payload. */
export function toMembershipPayload(
  values: MembershipFormValues,
  branchId: string | null,
): Partial<Membership> {
  return {
    plan_name: values.plan_name.trim(),
    customer_id: values.customer_id.trim(),
    athlete_id: values.athlete_id.trim() === "" ? null : values.athlete_id.trim(),
    status: values.status,
    currency: values.currency.trim() || "USD",
    price: values.price.trim() || "0.00",
    interval: values.interval,
    current_period_start: values.current_period_start,
    current_period_end: values.current_period_end,
    ...(branchId ? { branch_id: branchId } : {}),
  };
}

/** Props for {@link MembershipForm}. */
interface MembershipFormProps {
  initialValues?: Partial<Membership>;
  isSubmitting: boolean;
  onSubmit: (values: MembershipFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled membership create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function MembershipForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: MembershipFormProps): ReactNode {
  const [values, setValues] = useState<MembershipFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof MembershipFormValues>(
    key: K,
    value: MembershipFormValues[K],
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
              name="plan_name"
              value={values.plan_name}
              variant="secondary"
              onChange={(value) => setField("plan_name", value)}
            >
              <Label>Plan name</Label>
              <Input placeholder="Monthly — Full Access" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as MembershipStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {MEMBERSHIP_STATUSES.map((status) => (
                    <ListBox.Item
                      key={status}
                      id={status}
                      textValue={MEMBERSHIP_STATUS_LABELS[status]}
                    >
                      {MEMBERSHIP_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              isRequired
              name="customer_id"
              value={values.customer_id}
              variant="secondary"
              onChange={(value) => setField("customer_id", value)}
            >
              <Label>Customer ID</Label>
              <Input placeholder="usr_guardian_emma" />
            </TextField>

            <TextField
              name="athlete_id"
              value={values.athlete_id}
              variant="secondary"
              onChange={(value) => setField("athlete_id", value)}
            >
              <Label>Athlete ID</Label>
              <Input placeholder="ath_emma" />
            </TextField>

            <TextField
              isRequired
              name="price"
              value={values.price}
              variant="secondary"
              onChange={(value) => setField("price", value)}
            >
              <Label>Price</Label>
              <Input placeholder="80.00" />
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
              placeholder="Select interval"
              value={values.interval}
              variant="secondary"
              onChange={(key: Key | null) => setField("interval", key as Membership["interval"])}
            >
              <Label>Interval</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {INTERVALS.map((interval) => (
                    <ListBox.Item key={interval} id={interval} textValue={interval}>
                      {interval}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              isRequired
              name="current_period_start"
              type="date"
              value={values.current_period_start}
              variant="secondary"
              onChange={(value) => setField("current_period_start", value)}
            >
              <Label>Period start</Label>
              <Input />
            </TextField>

            <TextField
              isRequired
              name="current_period_end"
              type="date"
              value={values.current_period_end}
              variant="secondary"
              onChange={(value) => setField("current_period_end", value)}
            >
              <Label>Period end</Label>
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

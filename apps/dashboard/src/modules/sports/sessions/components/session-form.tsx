/**
 * @file session-form.tsx
 * @module modules/sports/sessions/components/session-form
 *
 * @description
 * Shared create/edit form for a private session. Controlled form seeded from
 * optional initial values; coach options come from the `staff` resource and
 * athlete options from `athletes`. Branch/season are injected from the caller's
 * scope at submit time (see {@link toSessionPayload}). Start uses a
 * `datetime-local` input.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type { Athlete, EventStatus, PrivateSession, Staff } from "@/types";
import type { Key, ReactNode } from "react";

import { EVENT_STATUS_LABELS, EVENT_STATUSES } from "@/types";

/** Editable fields of a private session (excludes server-managed + scope columns). */
export interface SessionFormValues {
  coach_id: string;
  athlete_id: string;
  sport_key: string;
  starts_at: string;
  /** Duration in minutes as a raw input string. */
  duration_minutes: string;
  status: EventStatus;
  /** Price as a raw input string (`""` when unset). */
  price: string;
  currency: string;
}

/** Trims an ISO timestamp to the `datetime-local` input format (`YYYY-MM-DDTHH:mm`). */
function toLocalInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : "";
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<PrivateSession>): SessionFormValues {
  return {
    coach_id: initial?.coach_id ?? "",
    athlete_id: initial?.athlete_id ?? "",
    sport_key: initial?.sport_key ?? "",
    starts_at: toLocalInput(initial?.starts_at),
    duration_minutes: initial?.duration_minutes ? String(initial.duration_minutes) : "60",
    status: initial?.status ?? "scheduled",
    price: initial?.price ?? "",
    currency: initial?.currency ?? "USD",
  };
}

/** Trims a free-text field to `null` when empty. */
function toNullable(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

/**
 * Converts form values into a private-session API payload, injecting the active
 * branch and season from the caller's scope.
 */
export function toSessionPayload(
  values: SessionFormValues,
  scope: ActiveScope,
): Partial<PrivateSession> {
  return {
    coach_id: values.coach_id,
    athlete_id: values.athlete_id,
    sport_key: values.sport_key.trim(),
    starts_at: values.starts_at,
    duration_minutes: Number(values.duration_minutes),
    status: values.status,
    price: toNullable(values.price),
    currency: toNullable(values.currency),
    branch_id: scope.branchId ?? "",
    season_id: scope.seasonId,
  };
}

/** Props for {@link SessionForm}. */
interface SessionFormProps {
  initialValues?: Partial<PrivateSession>;
  isSubmitting: boolean;
  onSubmit: (values: SessionFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled private-session create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function SessionForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: SessionFormProps): ReactNode {
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const staff = staffResult?.data ?? [];
  const athletes = athletesResult?.data ?? [];

  const [values, setValues] = useState<SessionFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof SessionFormValues>(
    key: K,
    value: SessionFormValues[K],
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
            <Select
              className="w-full"
              placeholder="Select coach"
              value={values.coach_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("coach_id", key ? String(key) : "")}
            >
              <Label>Coach</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
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

            <TextField
              name="sport_key"
              value={values.sport_key}
              variant="secondary"
              onChange={(value) => setField("sport_key", value)}
            >
              <Label>Sport</Label>
              <Input placeholder="football" />
            </TextField>

            <TextField
              isRequired
              name="starts_at"
              type="datetime-local"
              value={values.starts_at}
              variant="secondary"
              onChange={(value) => setField("starts_at", value)}
            >
              <Label>Starts at</Label>
              <Input />
            </TextField>

            <TextField
              name="duration_minutes"
              type="number"
              value={values.duration_minutes}
              variant="secondary"
              onChange={(value) => setField("duration_minutes", value)}
            >
              <Label>Duration (minutes)</Label>
              <Input placeholder="60" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as EventStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {EVENT_STATUSES.map((status) => (
                    <ListBox.Item key={status} id={status} textValue={EVENT_STATUS_LABELS[status]}>
                      {EVENT_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="price"
              value={values.price}
              variant="secondary"
              onChange={(value) => setField("price", value)}
            >
              <Label>Price</Label>
              <Input placeholder="45.00" />
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

/**
 * @file training-form.tsx
 * @module modules/sports/training/components/training-form
 *
 * @description
 * Shared create/edit form for a training session. Controlled form seeded from
 * optional initial values; team options come from the `teams` resource and coach
 * options from `staff`. Branch/season are injected from the caller's scope at
 * submit time. Start uses a `datetime-local` input.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@academorix/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type { EventStatus, Staff, Team, TrainingSession } from "@/types";
import type { Key, ReactNode } from "react";

import { EVENT_STATUS_LABELS, EVENT_STATUSES } from "@/types";

/** Editable fields of a training session (excludes server-managed + scope columns). */
export interface TrainingFormValues {
  title: string;
  team_id: string;
  coach_id: string;
  starts_at: string;
  /** Duration in minutes as a raw input string. */
  duration_minutes: string;
  status: EventStatus;
  focus: string;
}

/** Trims an ISO timestamp to the `datetime-local` input format (`YYYY-MM-DDTHH:mm`). */
function toLocalInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : "";
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<TrainingSession>): TrainingFormValues {
  return {
    title: initial?.title ?? "",
    team_id: initial?.team_id ?? "",
    coach_id: initial?.coach_id ?? "",
    starts_at: toLocalInput(initial?.starts_at),
    duration_minutes: initial?.duration_minutes ? String(initial.duration_minutes) : "90",
    status: initial?.status ?? "scheduled",
    focus: initial?.focus ?? "",
  };
}

/**
 * Converts form values into a training-session API payload, injecting the active
 * branch and season from the caller's scope.
 */
export function toTrainingPayload(
  values: TrainingFormValues,
  scope: ActiveScope,
): Partial<TrainingSession> {
  return {
    title: values.title.trim(),
    team_id: values.team_id,
    coach_id: values.coach_id === "" ? null : values.coach_id,
    starts_at: values.starts_at,
    duration_minutes: Number(values.duration_minutes),
    status: values.status,
    focus: values.focus.trim() === "" ? null : values.focus.trim(),
    branch_id: scope.branchId ?? "",
    season_id: scope.seasonId,
  };
}

/** Props for {@link TrainingForm}. */
interface TrainingFormProps {
  initialValues?: Partial<TrainingSession>;
  isSubmitting: boolean;
  onSubmit: (values: TrainingFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled training-session create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function TrainingForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: TrainingFormProps): ReactNode {
  const { result: teamsResult } = useList<Team>({ resource: "teams", pagination: { mode: "off" } });
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const teams = teamsResult?.data ?? [];
  const staff = staffResult?.data ?? [];

  const [values, setValues] = useState<TrainingFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof TrainingFormValues>(
    key: K,
    value: TrainingFormValues[K],
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
              name="title"
              value={values.title}
              variant="secondary"
              onChange={(value) => setField("title", value)}
            >
              <Label>Title</Label>
              <Input placeholder="U12 Technical Session" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select team"
              value={values.team_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("team_id", key ? String(key) : "")}
            >
              <Label>Team</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {teams.map((team) => (
                    <ListBox.Item key={team.id} id={team.id} textValue={team.name}>
                      {team.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

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
              <Input placeholder="90" />
            </TextField>

            <div className="sm:col-span-2">
              <TextField
                name="focus"
                value={values.focus}
                variant="secondary"
                onChange={(value) => setField("focus", value)}
              >
                <Label>Focus</Label>
                <Input placeholder="Passing & movement" />
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

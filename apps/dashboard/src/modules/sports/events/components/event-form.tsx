/**
 * @file event-form.tsx
 * @module modules/sports/events/components/event-form
 *
 * @description
 * Shared create/edit form for an event. Controlled form seeded from optional
 * initial values; team options come from the `teams` resource and branch/season
 * from the caller's scope. Start/end use `datetime-local` inputs.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { Event, EventStatus, EventType, Team } from "@/types";
import type { Key, ReactNode } from "react";

import { useScope } from "@/lib/scope";
import { EVENT_STATUS_LABELS, EVENT_STATUSES, EVENT_TYPE_LABELS, EVENT_TYPES } from "@/types";

/** Editable fields of an event (excludes server-managed columns). */
export interface EventFormValues {
  title: string;
  type: EventType;
  status: EventStatus;
  team_id: string;
  branch_id: string;
  season_id: string;
  starts_at: string;
  ends_at: string;
  location: string;
}

/** Trims an ISO timestamp to the `datetime-local` input format (`YYYY-MM-DDTHH:mm`). */
function toLocalInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : "";
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(
  scopeBranchId: string | null,
  scopeSeasonId: string | null,
  initial?: Partial<Event>,
): EventFormValues {
  return {
    title: initial?.title ?? "",
    type: initial?.type ?? "training",
    status: initial?.status ?? "scheduled",
    team_id: initial?.team_id ?? "",
    branch_id: initial?.branch_id ?? scopeBranchId ?? "",
    season_id: initial?.season_id ?? scopeSeasonId ?? "",
    starts_at: toLocalInput(initial?.starts_at),
    ends_at: toLocalInput(initial?.ends_at),
    location: initial?.location ?? "",
  };
}

/** Converts form values into an event API payload. */
export function toEventPayload(values: EventFormValues): Partial<Event> {
  return {
    title: values.title.trim(),
    type: values.type,
    status: values.status,
    team_id: values.team_id === "" ? null : values.team_id,
    branch_id: values.branch_id,
    season_id: values.season_id === "" ? null : values.season_id,
    starts_at: values.starts_at,
    ends_at: values.ends_at,
    location: values.location.trim() === "" ? null : values.location.trim(),
  };
}

/** Props for {@link EventForm}. */
interface EventFormProps {
  initialValues?: Partial<Event>;
  isSubmitting: boolean;
  onSubmit: (values: EventFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled event create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function EventForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: EventFormProps): ReactNode {
  const { scope } = useScope();
  const { result: teamsResult } = useList<Team>({ resource: "teams", pagination: { mode: "off" } });
  const teams = teamsResult?.data ?? [];

  const [values, setValues] = useState<EventFormValues>(() =>
    toFormValues(scope.branchId, scope.seasonId, initialValues),
  );

  const setField = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]): void => {
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
              <Input placeholder="U12 Training" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select type"
              value={values.type}
              variant="secondary"
              onChange={(key: Key | null) => setField("type", key as EventType)}
            >
              <Label>Type</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {EVENT_TYPES.map((type) => (
                    <ListBox.Item key={type} id={type} textValue={EVENT_TYPE_LABELS[type]}>
                      {EVENT_TYPE_LABELS[type]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

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
              isRequired
              name="ends_at"
              type="datetime-local"
              value={values.ends_at}
              variant="secondary"
              onChange={(value) => setField("ends_at", value)}
            >
              <Label>Ends at</Label>
              <Input />
            </TextField>

            <div className="sm:col-span-2">
              <TextField
                name="location"
                value={values.location}
                variant="secondary"
                onChange={(value) => setField("location", value)}
              >
                <Label>Location</Label>
                <Input placeholder="Main Pitch" />
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

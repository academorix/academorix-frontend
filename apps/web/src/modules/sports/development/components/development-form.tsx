/**
 * @file development-form.tsx
 * @module modules/sports/development/components/development-form
 *
 * @description
 * Shared create/edit form for an individual development plan (IDP). Controlled
 * form seeded from optional initial values; athlete options come from the
 * `athletes` resource. The page composes the payload via {@link toDevelopmentPayload}.
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

import type {
  DevelopmentPlan,
  DevelopmentStatus,
} from "@/modules/sports/development/development.types";
import type { Athlete } from "@/types";
import type { FormEvent, Key, ReactNode } from "react";

import {
  DEVELOPMENT_STATUS_LABELS,
  DEVELOPMENT_STATUSES,
} from "@/modules/sports/development/development.types";

/** Editable fields of a development plan (excludes server-managed columns). */
export interface DevelopmentFormValues {
  athlete_id: string;
  sport_key: string;
  goal: string;
  status: DevelopmentStatus;
  target_date: string;
  note: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<DevelopmentPlan>): DevelopmentFormValues {
  return {
    athlete_id: initial?.athlete_id ?? "",
    sport_key: initial?.sport_key ?? "",
    goal: initial?.goal ?? "",
    status: initial?.status ?? "active",
    target_date: initial?.target_date ?? "",
    note: initial?.note ?? "",
  };
}

/** Converts form values into a development-plan API payload (trimmed, nullable-aware). */
export function toDevelopmentPayload(values: DevelopmentFormValues): Partial<DevelopmentPlan> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  return {
    athlete_id: values.athlete_id,
    sport_key: values.sport_key.trim(),
    goal: values.goal.trim(),
    status: values.status,
    target_date: values.target_date === "" ? null : values.target_date,
    note: emptyToNull(values.note),
  };
}

/** Props for {@link DevelopmentForm}. */
interface DevelopmentFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<DevelopmentPlan>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: DevelopmentFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled development-plan create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function DevelopmentForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: DevelopmentFormProps): ReactNode {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const athletes = athletesResult?.data ?? [];

  const [values, setValues] = useState<DevelopmentFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof DevelopmentFormValues>(
    key: K,
    value: DevelopmentFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
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
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as DevelopmentStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {DEVELOPMENT_STATUSES.map((status) => (
                    <ListBox.Item
                      key={status}
                      id={status}
                      textValue={DEVELOPMENT_STATUS_LABELS[status]}
                    >
                      {DEVELOPMENT_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              isRequired
              className="sm:col-span-2"
              name="goal"
              value={values.goal}
              variant="secondary"
              onChange={(value) => setField("goal", value)}
            >
              <Label>Goal</Label>
              <Input placeholder="Improve weak-foot passing accuracy" />
            </TextField>

            <TextField
              isRequired
              name="sport_key"
              value={values.sport_key}
              variant="secondary"
              onChange={(value) => setField("sport_key", value)}
            >
              <Label>Sport</Label>
              <Input placeholder="football" />
            </TextField>

            <TextField
              name="target_date"
              type="date"
              value={values.target_date}
              variant="secondary"
              onChange={(value) => setField("target_date", value)}
            >
              <Label>Target date</Label>
              <Input />
            </TextField>

            <div className="sm:col-span-2">
              <TextField
                name="note"
                value={values.note}
                variant="secondary"
                onChange={(value) => setField("note", value)}
              >
                <Label>Note</Label>
                <TextArea placeholder="Coaching context…" rows={4} />
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

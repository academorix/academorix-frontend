/**
 * @file medical-form.tsx
 * @module modules/sports/medical/components/medical-form
 *
 * @description
 * Shared create/edit form for a medical/clearance record. Controlled form seeded
 * from optional initial values; the athlete options are loaded from the
 * `athletes` resource so the form works under both the mock and REST providers.
 *
 * **Sensitive data**: this surface is gated behind the `medical` permission by
 * the resource's access rules; only authorized staff reach it.
 */

import {
  Button,
  Card,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@academorix/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { Athlete, MedicalRecord } from "@/types";
import type { Key, ReactNode } from "react";

/** Editable fields of a medical record (excludes server-managed columns). */
export interface MedicalFormValues {
  athlete_id: string;
  type: string;
  is_cleared: boolean;
  cleared_until: string;
  summary: string;
  recorded_by: string;
  recorded_at: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<MedicalRecord>): MedicalFormValues {
  return {
    athlete_id: initial?.athlete_id ?? "",
    type: initial?.type ?? "",
    is_cleared: initial?.is_cleared ?? false,
    cleared_until: initial?.cleared_until ?? "",
    summary: initial?.summary ?? "",
    recorded_by: initial?.recorded_by ?? "",
    recorded_at: initial?.recorded_at ?? "",
  };
}

/** Converts form values into a medical-record API payload (trimmed, nullable-aware). */
export function toMedicalPayload(values: MedicalFormValues): Partial<MedicalRecord> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  return {
    athlete_id: values.athlete_id,
    type: values.type.trim(),
    is_cleared: values.is_cleared,
    cleared_until: emptyToNull(values.cleared_until),
    summary: emptyToNull(values.summary),
    recorded_by: emptyToNull(values.recorded_by),
    recorded_at: values.recorded_at,
  };
}

/** Props for {@link MedicalForm}. */
interface MedicalFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<MedicalRecord>;
  /** Whether a submit is in flight. */
  isSubmitting?: boolean;
  /** Called with the built API payload on submit. */
  onSubmit: (payload: Partial<MedicalRecord>) => void;
}

/**
 * A controlled medical-record create/edit form.
 *
 * @param props - Initial values, submit state, and the submit handler.
 */
export function MedicalForm({
  initialValues,
  isSubmitting = false,
  onSubmit,
}: MedicalFormProps): ReactNode {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const athletes = athletesResult?.data ?? [];

  const [values, setValues] = useState<MedicalFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof MedicalFormValues>(
    key: K,
    value: MedicalFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(toMedicalPayload(values));
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

            <TextField
              isRequired
              name="type"
              value={values.type}
              variant="secondary"
              onChange={(value) => setField("type", value)}
            >
              <Label>Type</Label>
              <Input placeholder="clearance / injury / allergy" />
            </TextField>

            <TextField
              name="cleared_until"
              type="date"
              value={values.cleared_until}
              variant="secondary"
              onChange={(value) => setField("cleared_until", value)}
            >
              <Label>Cleared until</Label>
              <Input />
            </TextField>

            <TextField
              isRequired
              name="recorded_at"
              type="date"
              value={values.recorded_at}
              variant="secondary"
              onChange={(value) => setField("recorded_at", value)}
            >
              <Label>Recorded on</Label>
              <Input />
            </TextField>

            <TextField
              name="recorded_by"
              value={values.recorded_by}
              variant="secondary"
              onChange={(value) => setField("recorded_by", value)}
            >
              <Label>Recorded by</Label>
              <Input placeholder="Optional" />
            </TextField>

            <div className="flex items-center">
              <Switch
                isSelected={values.is_cleared}
                onChange={(selected) => setField("is_cleared", selected)}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Medically cleared
                </Switch.Content>
              </Switch>
            </div>

            <div className="sm:col-span-2">
              <TextField
                name="summary"
                value={values.summary}
                variant="secondary"
                onChange={(value) => setField("summary", value)}
              >
                <Label>Summary</Label>
                <TextArea placeholder="Restricted clinical summary…" rows={5} />
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

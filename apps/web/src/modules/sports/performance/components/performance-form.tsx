/**
 * @file performance-form.tsx
 * @module modules/sports/performance/components/performance-form
 *
 * @description
 * Shared create/edit form for a performance/fitness test. Controlled form seeded
 * from optional initial values; the athlete options are loaded from the
 * `athletes` resource so the form works under both the mock and REST providers.
 *
 * NOTE: The measured values themselves (the SDUI attribute set selected by
 * `sport_key`) are **not** edited here. On create the payload sets an empty
 * `attributes` map; on edit the record's existing `attributes` are preserved
 * untouched. A dedicated measured-value (SDUI) editor is a documented follow-up.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@academorix/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { Athlete, PerformanceTest } from "@/types";
import type { Key, ReactNode } from "react";

/** Editable fields of a performance test (excludes server-managed columns). */
export interface PerformanceFormValues {
  athlete_id: string;
  enrollment_id: string;
  sport_key: string;
  battery: string;
  assessor_id: string;
  tested_at: string;
  attribute_set_version: string;
  /**
   * Measured values, carried through untouched (SDUI editing is a follow-up).
   * Empty object on create; the record's existing map on edit.
   */
  attributes: Record<string, unknown>;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<PerformanceTest>): PerformanceFormValues {
  return {
    athlete_id: initial?.athlete_id ?? "",
    enrollment_id: initial?.enrollment_id ?? "",
    sport_key: initial?.sport_key ?? "",
    battery: initial?.battery ?? "",
    assessor_id: initial?.assessor_id ?? "",
    tested_at: initial?.tested_at ?? "",
    attribute_set_version:
      initial?.attribute_set_version != null ? String(initial.attribute_set_version) : "1",
    attributes: initial?.attributes ?? {},
  };
}

/** Converts form values into a performance-test API payload (trimmed, nullable-aware). */
export function toPerformancePayload(values: PerformanceFormValues): Partial<PerformanceTest> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  return {
    athlete_id: values.athlete_id,
    enrollment_id: emptyToNull(values.enrollment_id),
    sport_key: values.sport_key.trim(),
    battery: values.battery.trim(),
    assessor_id: emptyToNull(values.assessor_id),
    tested_at: values.tested_at,
    attribute_set_version: Number(values.attribute_set_version) || 1,
    // Measured values are SDUI-managed; editing them is a documented follow-up.
    // Preserve the record's existing values (empty object on create).
    attributes: values.attributes,
  };
}

/** Props for {@link PerformanceForm}. */
interface PerformanceFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<PerformanceTest>;
  /** Whether a submit is in flight. */
  isSubmitting?: boolean;
  /** Called with the built API payload on submit. */
  onSubmit: (payload: Partial<PerformanceTest>) => void;
}

/**
 * A controlled performance-test create/edit form.
 *
 * @param props - Initial values, submit state, and the submit handler.
 */
export function PerformanceForm({
  initialValues,
  isSubmitting = false,
  onSubmit,
}: PerformanceFormProps): ReactNode {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const athletes = athletesResult?.data ?? [];

  const [values, setValues] = useState<PerformanceFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof PerformanceFormValues>(
    key: K,
    value: PerformanceFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(toPerformancePayload(values));
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
              name="battery"
              value={values.battery}
              variant="secondary"
              onChange={(value) => setField("battery", value)}
            >
              <Label>Battery</Label>
              <Input placeholder="Pre-season fitness" />
            </TextField>

            <TextField
              isRequired
              name="sport_key"
              value={values.sport_key}
              variant="secondary"
              onChange={(value) => setField("sport_key", value)}
            >
              <Label>Sport key</Label>
              <Input placeholder="football" />
            </TextField>

            <TextField
              name="enrollment_id"
              value={values.enrollment_id}
              variant="secondary"
              onChange={(value) => setField("enrollment_id", value)}
            >
              <Label>Enrollment ID</Label>
              <Input placeholder="Optional" />
            </TextField>

            <TextField
              name="assessor_id"
              value={values.assessor_id}
              variant="secondary"
              onChange={(value) => setField("assessor_id", value)}
            >
              <Label>Assessor ID</Label>
              <Input placeholder="Optional" />
            </TextField>

            <TextField
              isRequired
              name="tested_at"
              type="date"
              value={values.tested_at}
              variant="secondary"
              onChange={(value) => setField("tested_at", value)}
            >
              <Label>Tested on</Label>
              <Input />
            </TextField>

            <TextField
              name="attribute_set_version"
              type="number"
              value={values.attribute_set_version}
              variant="secondary"
              onChange={(value) => setField("attribute_set_version", value)}
            >
              <Label>Attribute set version</Label>
              <Input min="1" />
            </TextField>
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

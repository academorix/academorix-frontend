/**
 * @file performance-form.tsx
 * @module modules/sports/performance/components/performance-form
 *
 * @description
 * Shared create/edit form for a performance/fitness test. The scalar columns are
 * edited as controlled fields; the **measured values** are edited live through
 * the SDUI attribute engine: the selected `sport_key` resolves the matching
 * attribute set and its {@link AttributeForm} renders the battery's fields into
 * the record's `attributes` bag. Athlete options load from the `athletes`
 * resource so the form works under both the mock and REST providers.
 */

import { Button, Card, Form, Input, Label, ListBox, Select, TextField } from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useEffect, useRef, useState } from "react";

import type { AttributeValues } from "@/lib/attributes";
import type { Athlete, PerformanceTest } from "@/types";
import type { Key, ReactNode } from "react";

import { AttributeForm, defaultAttributeValues, useAttributeSet } from "@/lib/attributes";

/**
 * Editable **scalar** fields of a performance test (excludes server-managed
 * columns and the SDUI-managed measured values, which are held separately).
 */
export interface PerformanceFormValues {
  athlete_id: string;
  enrollment_id: string;
  sport_key: string;
  battery: string;
  assessor_id: string;
  tested_at: string;
  attribute_set_version: string;
}

/** Builds the initial scalar form state, merging any provided record over defaults. */
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
  };
}

/**
 * Converts the scalar form values plus the edited measured `attributes` into a
 * performance-test API payload (trimmed, nullable-aware).
 *
 * @param values - The scalar field values.
 * @param attributes - The measured (SDUI) value bag for the selected sport.
 */
export function toPerformancePayload(
  values: PerformanceFormValues,
  attributes: AttributeValues,
): Partial<PerformanceTest> {
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
    // Measured values are edited live via the SDUI attribute set for this sport.
    attributes,
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
 * A controlled performance-test create/edit form with a live SDUI editor for
 * the sport's measured values.
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

  // Measured (SDUI) values — held separately from the scalar fields, mirroring
  // the host record's `attributes` bag. Seeded from the record on edit, and from
  // the resolved set's defaults on create (see the effect below).
  const [attributes, setAttributes] = useState<AttributeValues>(
    () => initialValues?.attributes ?? {},
  );

  // Resolve the attribute set bound to the chosen sport. The `sport_key` field
  // drives this, so it re-resolves whenever the value changes (and stays
  // disabled until a sport is chosen).
  const { set } = useAttributeSet({
    entityType: "performance",
    discriminatorValue: values.sport_key,
  });

  // Remembers the last set we seeded values for, so measured values are (re)seeded
  // exactly once per resolved set: the record's values are preserved on the first
  // edit load, and reset to the new battery's defaults whenever the sport changes.
  const seededSetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // No set yet (still loading, or none exists for this sport): leave the
    // current `attributes` untouched.
    if (!set) {
      return;
    }
    // Already seeded for this exact set — don't clobber in-progress edits.
    if (seededSetIdRef.current === set.id) {
      return;
    }

    const isFirstResolution = seededSetIdRef.current === null;

    seededSetIdRef.current = set.id;

    const defaults = defaultAttributeValues(set);
    const initial = initialValues?.attributes;

    if (isFirstResolution && initial && Object.keys(initial).length > 0) {
      // First resolution in edit mode: keep the record's measured values,
      // backfilling any fields a newer set version may have added.
      setAttributes({ ...defaults, ...initial });
    } else {
      // Create, or a sport change: start from the battery's defaults.
      setAttributes(defaults);
    }
  }, [set, initialValues]);

  const setField = <K extends keyof PerformanceFormValues>(
    key: K,
    value: PerformanceFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(toPerformancePayload(values, attributes));
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
        <Card>
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
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Measured values</Card.Title>
            <Card.Description>The test battery defined for this sport</Card.Description>
          </Card.Header>
          <Card.Content>
            {set ? (
              <AttributeForm set={set} value={attributes} onChange={setAttributes} />
            ) : (
              <p className="text-sm text-muted">No test battery defined for this sport.</p>
            )}
          </Card.Content>
        </Card>

        <div className="flex justify-end">
          <Button isDisabled={isSubmitting} isPending={isSubmitting} type="submit">
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
}

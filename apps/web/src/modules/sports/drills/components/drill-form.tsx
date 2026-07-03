/**
 * @file drill-form.tsx
 * @module modules/sports/drills/components/drill-form
 *
 * @description
 * Shared create/edit form for a curriculum drill. Controlled form seeded from
 * optional initial values. Tags are entered as a comma-separated string and
 * converted to a string array in {@link toDrillPayload}.
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
import { useState } from "react";

import type { Drill, SkillLevel } from "@/types";
import type { FormEvent, Key, ReactNode } from "react";

import { SKILL_LEVEL_LABELS, SKILL_LEVELS } from "@/types";

/** Editable fields of a drill (excludes server-managed columns). */
export interface DrillFormValues {
  name: string;
  sport_key: string;
  description: string;
  /** Comma-separated tag list; split into a string[] on submit. */
  tags: string;
  level: SkillLevel;
  /** Duration in minutes, as an input string. */
  duration_minutes: string;
  media_document_id: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Drill>): DrillFormValues {
  return {
    name: initial?.name ?? "",
    sport_key: initial?.sport_key ?? "",
    description: initial?.description ?? "",
    tags: initial?.tags?.join(", ") ?? "",
    level: initial?.level ?? "beginner",
    duration_minutes: initial?.duration_minutes != null ? String(initial.duration_minutes) : "",
    media_document_id: initial?.media_document_id ?? "",
  };
}

/** Converts form values into a drill API payload (tags split, duration numeric). */
export function toDrillPayload(values: DrillFormValues): Partial<Drill> {
  return {
    name: values.name.trim(),
    sport_key: values.sport_key.trim(),
    description: values.description.trim(),
    tags: values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== ""),
    level: values.level,
    duration_minutes: Number(values.duration_minutes) || 0,
    media_document_id:
      values.media_document_id.trim() === "" ? null : values.media_document_id.trim(),
  };
}

/** Props for {@link DrillForm}. */
interface DrillFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Drill>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: DrillFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled drill create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function DrillForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: DrillFormProps): ReactNode {
  const [values, setValues] = useState<DrillFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof DrillFormValues>(key: K, value: DrillFormValues[K]): void => {
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
            <TextField
              isRequired
              className="sm:col-span-2"
              name="name"
              value={values.name}
              variant="secondary"
              onChange={(value) => setField("name", value)}
            >
              <Label>Name</Label>
              <Input placeholder="4v1 Rondo" />
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

            <Select
              className="w-full"
              placeholder="Select level"
              value={values.level}
              variant="secondary"
              onChange={(key: Key | null) => setField("level", key as SkillLevel)}
            >
              <Label>Level</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {SKILL_LEVELS.map((level) => (
                    <ListBox.Item key={level} id={level} textValue={SKILL_LEVEL_LABELS[level]}>
                      {SKILL_LEVEL_LABELS[level]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              isRequired
              name="duration_minutes"
              type="number"
              value={values.duration_minutes}
              variant="secondary"
              onChange={(value) => setField("duration_minutes", value)}
            >
              <Label>Duration (minutes)</Label>
              <Input min="0" placeholder="15" />
            </TextField>

            <TextField
              name="tags"
              value={values.tags}
              variant="secondary"
              onChange={(value) => setField("tags", value)}
            >
              <Label>Tags</Label>
              <Input placeholder="passing, control, first-touch" />
            </TextField>

            <TextField
              name="media_document_id"
              value={values.media_document_id}
              variant="secondary"
              onChange={(value) => setField("media_document_id", value)}
            >
              <Label>Media document ID</Label>
              <Input placeholder="Optional" />
            </TextField>

            <div className="sm:col-span-2">
              <TextField
                isRequired
                name="description"
                value={values.description}
                variant="secondary"
                onChange={(value) => setField("description", value)}
              >
                <Label>Description</Label>
                <TextArea placeholder="How the drill is run…" rows={5} />
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

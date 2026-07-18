/**
 * @file award-form.tsx
 * @module modules/sports/awards/components/award-form
 *
 * @description
 * Shared create/edit form for an award/certificate. Controlled form seeded from
 * optional initial values; the recipient (athlete) options are loaded from the
 * `athletes` resource so the form works under both the mock and REST providers.
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
} from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { Athlete, Award } from "@/types";
import type { Key, ReactNode } from "react";

/** Editable fields of an award (excludes server-managed columns). */
export interface AwardFormValues {
  athlete_id: string;
  type: string;
  title: string;
  description: string;
  granted_at: string;
  certificate_document_id: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Award>): AwardFormValues {
  return {
    athlete_id: initial?.athlete_id ?? "",
    type: initial?.type ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    granted_at: initial?.granted_at ?? "",
    certificate_document_id: initial?.certificate_document_id ?? "",
  };
}

/** Converts form values into an award API payload (trimmed, nullable-aware). */
export function toAwardPayload(values: AwardFormValues): Partial<Award> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  return {
    athlete_id: values.athlete_id,
    type: values.type.trim(),
    title: values.title.trim(),
    description: emptyToNull(values.description),
    granted_at: values.granted_at,
    certificate_document_id: emptyToNull(values.certificate_document_id),
  };
}

/** Props for {@link AwardForm}. */
interface AwardFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Award>;
  /** Whether a submit is in flight. */
  isSubmitting?: boolean;
  /** Called with the built API payload on submit. */
  onSubmit: (payload: Partial<Award>) => void;
}

/**
 * A controlled award create/edit form.
 *
 * @param props - Initial values, submit state, and the submit handler.
 */
export function AwardForm({
  initialValues,
  isSubmitting = false,
  onSubmit,
}: AwardFormProps): ReactNode {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const athletes = athletesResult?.data ?? [];

  const [values, setValues] = useState<AwardFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof AwardFormValues>(key: K, value: AwardFormValues[K]): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(toAwardPayload(values));
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
              name="title"
              value={values.title}
              variant="secondary"
              onChange={(value) => setField("title", value)}
            >
              <Label>Title</Label>
              <Input placeholder="Player of the Month" />
            </TextField>

            <TextField
              isRequired
              name="type"
              value={values.type}
              variant="secondary"
              onChange={(value) => setField("type", value)}
            >
              <Label>Type</Label>
              <Input placeholder="player_of_the_month / belt_promotion" />
            </TextField>

            <TextField
              isRequired
              name="granted_at"
              type="date"
              value={values.granted_at}
              variant="secondary"
              onChange={(value) => setField("granted_at", value)}
            >
              <Label>Granted on</Label>
              <Input />
            </TextField>

            <TextField
              name="certificate_document_id"
              value={values.certificate_document_id}
              variant="secondary"
              onChange={(value) => setField("certificate_document_id", value)}
            >
              <Label>Certificate document ID</Label>
              <Input placeholder="Optional" />
            </TextField>

            <div className="sm:col-span-2">
              <TextField
                name="description"
                value={values.description}
                variant="secondary"
                onChange={(value) => setField("description", value)}
              >
                <Label>Description</Label>
                <TextArea placeholder="Optional citation or notes…" rows={5} />
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

/**
 * @file formation-form.tsx
 * @module modules/sports/formations/components/formation-form
 *
 * @description
 * Shared create/edit form for a tactical formation's metadata (name, shape,
 * sport, team, note). The active organization/branch are injected from scope at
 * submit time. NOTE: the on-pitch slot geometry is NOT edited here — on create
 * the payload uses an empty `slots` array; on edit the record's existing slots
 * are preserved untouched. A drag-to-edit slot builder is a documented follow-up.
 */

import { Button, Card, Form, Input, Label, TextArea, TextField } from "@academorix/ui/react";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type { Formation, FormationSlot } from "@/modules/sports/formations/formation.types";
import type { FormEvent, ReactNode } from "react";

/** Editable fields of a formation (excludes slots, server-managed + scope columns). */
export interface FormationFormValues {
  name: string;
  shape: string;
  sport_key: string;
  team_id: string;
  note: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Formation>): FormationFormValues {
  return {
    name: initial?.name ?? "",
    shape: initial?.shape ?? "",
    sport_key: initial?.sport_key ?? "",
    team_id: initial?.team_id ?? "",
    note: initial?.note ?? "",
  };
}

/**
 * Converts form values into a formation API payload, injecting the active
 * organization/branch from scope. `slots` are passed through unchanged (empty on
 * create, the record's existing slots on edit) since geometry editing is a
 * documented follow-up.
 */
export function toFormationPayload(
  values: FormationFormValues,
  scope: ActiveScope,
  slots: FormationSlot[] = [],
): Partial<Formation> {
  return {
    name: values.name.trim(),
    shape: values.shape.trim(),
    sport_key: values.sport_key.trim(),
    team_id: values.team_id === "" ? null : values.team_id,
    note: values.note.trim() === "" ? null : values.note.trim(),
    slots,
    organization_id: scope.organizationId ?? "",
    branch_id: scope.branchId ?? "",
  };
}

/** Props for {@link FormationForm}. */
interface FormationFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Formation>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: FormationFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled formation create/edit form (metadata only; slots preserved).
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function FormationForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: FormationFormProps): ReactNode {
  const [values, setValues] = useState<FormationFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof FormationFormValues>(
    key: K,
    value: FormationFormValues[K],
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
            <TextField
              isRequired
              className="sm:col-span-2"
              name="name"
              value={values.name}
              variant="secondary"
              onChange={(value) => setField("name", value)}
            >
              <Label>Name</Label>
              <Input placeholder="First Team 4-3-3" />
            </TextField>

            <TextField
              isRequired
              name="shape"
              value={values.shape}
              variant="secondary"
              onChange={(value) => setField("shape", value)}
            >
              <Label>Shape</Label>
              <Input placeholder="4-3-3" />
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
              name="team_id"
              value={values.team_id}
              variant="secondary"
              onChange={(value) => setField("team_id", value)}
            >
              <Label>Team ID</Label>
              <Input placeholder="Optional" />
            </TextField>

            <div className="sm:col-span-2">
              <TextField
                name="note"
                value={values.note}
                variant="secondary"
                onChange={(value) => setField("note", value)}
              >
                <Label>Note</Label>
                <TextArea placeholder="Tactical notes…" rows={4} />
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

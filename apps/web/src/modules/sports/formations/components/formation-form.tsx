/**
 * @file formation-form.tsx
 * @module modules/sports/formations/components/formation-form
 *
 * @description
 * Shared create/edit form for a tactical formation. Edits both the metadata
 * (name, shape, sport, team, note) and the on-pitch player slots: each slot has
 * an editable label plus normalized `x`/`y` coordinates (0–100 percentages), and
 * a live pitch preview mirrors the current slot state as the coach edits. The
 * active organization/branch are injected from scope at submit time.
 */

import { PlusIcon, TrashIcon } from "@academorix/ui/icons/outline";
import {
  Button,
  Card,
  Form,
  Input,
  Label,
  NumberField,
  TextArea,
  TextField,
} from "@academorix/ui/react";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type { Formation, FormationSlot } from "@/modules/sports/formations/formation.types";
import type { CSSProperties, FormEvent, ReactNode } from "react";

/** Editable fields of a formation (excludes server-managed + scope columns). */
export interface FormationFormValues {
  name: string;
  shape: string;
  sport_key: string;
  team_id: string;
  note: string;
  /** Positioned player slots, edited in-place by the slot editor. */
  slots: FormationSlot[];
}

/** Clamps a slot coordinate into the inclusive 0–100 pitch range (NaN → 0). */
function clampCoordinate(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

/**
 * Generates a stable slot id, preferring `crypto.randomUUID` and falling back to
 * a timestamp + index pair when the Web Crypto API is unavailable.
 */
function createSlotId(index: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `slot_${crypto.randomUUID()}`;
  }

  return `slot_${Date.now()}_${index}`;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Formation>): FormationFormValues {
  return {
    name: initial?.name ?? "",
    shape: initial?.shape ?? "",
    sport_key: initial?.sport_key ?? "",
    team_id: initial?.team_id ?? "",
    note: initial?.note ?? "",
    // Copy each slot so edits never mutate the source record in place.
    slots: (initial?.slots ?? []).map((slot) => ({ ...slot })),
  };
}

/**
 * Converts form values into a formation API payload, injecting the active
 * organization/branch from scope. The edited `slots` are carried on `values`;
 * labels are trimmed and `x`/`y` are clamped to the 0–100 pitch range.
 */
export function toFormationPayload(
  values: FormationFormValues,
  scope: ActiveScope,
): Partial<Formation> {
  return {
    name: values.name.trim(),
    shape: values.shape.trim(),
    sport_key: values.sport_key.trim(),
    team_id: values.team_id === "" ? null : values.team_id,
    note: values.note.trim() === "" ? null : values.note.trim(),
    slots: values.slots.map((slot) => ({
      ...slot,
      label: slot.label.trim(),
      x: clampCoordinate(slot.x),
      y: clampCoordinate(slot.y),
    })),
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
  /** Called with the collected values (metadata + slots) on submit. */
  onSubmit: (values: FormationFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled formation create/edit form with an on-pitch slot editor.
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

  /** Appends a new slot with a generated id and sensible mid-pitch defaults. */
  const addSlot = (): void => {
    setValues((current) => ({
      ...current,
      slots: [
        ...current.slots,
        { id: createSlotId(current.slots.length), label: "", x: 50, y: 50 },
      ],
    }));
  };

  /** Patches the slot matched by `id` with the provided fields. */
  const updateSlot = (id: string, patch: Partial<Omit<FormationSlot, "id">>): void => {
    setValues((current) => ({
      ...current,
      slots: current.slots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
    }));
  };

  /** Removes the slot matched by `id`. */
  const removeSlot = (id: string): void => {
    setValues((current) => ({
      ...current,
      slots: current.slots.filter((slot) => slot.id !== id),
    }));
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

          <section className="mt-8 border-t border-default pt-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">Player slots</h3>
                <p className="mt-1 text-xs text-muted">
                  Position each player on the pitch. Coordinates are 0–100 percentages: X runs
                  left→right, Y runs own goal→attack.
                </p>
              </div>
              <Button size="sm" type="button" variant="secondary" onPress={addSlot}>
                <PlusIcon className="size-4" />
                Add slot
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Live preview — mirrors the read-only pitch from the show page. */}
              <figure className="mx-auto w-full max-w-sm lg:sticky lg:top-4">
                <div
                  aria-label={`${values.shape || "Formation"} preview on the pitch`}
                  className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-emerald-700/40 bg-gradient-to-b from-emerald-600 to-emerald-700"
                  role="img"
                >
                  {/* Halfway line + centre circle for orientation. */}
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/40" />
                  <div className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />

                  {values.slots.map((slot) => {
                    // Percentages come from form state, so position is set inline.
                    const style: CSSProperties = {
                      left: `${clampCoordinate(slot.x)}%`,
                      bottom: `${clampCoordinate(slot.y)}%`,
                    };

                    return (
                      <div
                        key={slot.id}
                        className="absolute flex size-8 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-emerald-800 shadow"
                        style={style}
                        title={slot.label}
                      >
                        {slot.label}
                      </div>
                    );
                  })}
                </div>
                <figcaption className="mt-2 text-center text-xs text-muted">
                  Attacking direction is upward.
                </figcaption>
              </figure>

              {/* Editable slot list. */}
              {values.slots.length === 0 ? (
                <p className="flex items-center justify-center rounded-lg border border-dashed border-default p-4 text-center text-sm text-muted">
                  No slots yet. Use “Add slot” to place players on the pitch.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {values.slots.map((slot, index) => (
                    <li
                      key={slot.id}
                      className="rounded-lg border border-default bg-default/20 p-3"
                    >
                      <div className="flex items-end gap-2">
                        <TextField
                          className="flex-1"
                          value={slot.label}
                          variant="secondary"
                          onChange={(value) => updateSlot(slot.id, { label: value })}
                        >
                          <Label>Label</Label>
                          <Input placeholder="GK" />
                        </TextField>
                        <Button
                          isIconOnly
                          aria-label={`Remove slot ${index + 1}`}
                          type="button"
                          variant="danger"
                          onPress={() => removeSlot(slot.id)}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <NumberField
                          fullWidth
                          maxValue={100}
                          minValue={0}
                          value={slot.x}
                          variant="secondary"
                          onChange={(value) => updateSlot(slot.id, { x: value ?? 0 })}
                        >
                          <Label>X</Label>
                          <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </NumberField>

                        <NumberField
                          fullWidth
                          maxValue={100}
                          minValue={0}
                          value={slot.y}
                          variant="secondary"
                          onChange={(value) => updateSlot(slot.id, { y: value ?? 0 })}
                        >
                          <Label>Y</Label>
                          <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input />
                            <NumberField.IncrementButton />
                          </NumberField.Group>
                        </NumberField>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
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

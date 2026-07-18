/**
 * @file facility-form.tsx
 * @module modules/facilities/components/facility-form
 *
 * @description
 * Shared create/edit form for a facility (a bookable venue — pitch, pool,
 * court, gym, …). Controlled form seeded from optional initial values; branch
 * options come from the caller's accessible scope so a facility is always
 * created against a branch the user can reach.
 *
 * The pure {@link toFacilityPayload} builder — exported alongside the
 * component — is what the create/edit pages call at submit time. Keeping the
 * transform outside the component makes it trivial to unit-test the trim /
 * empty-to-null / branch injection rules without mounting anything.
 */

import {
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@stackra/ui/react";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type { Facility, FacilityType } from "@/modules/facilities/facilities.types";
import type { Key, ReactNode } from "react";

import { useScope } from "@/lib/scope";
import {
  FACILITY_DEFAULT_CAPACITY,
  FACILITY_DEFAULT_UNIT_OF_CAPACITY,
} from "@/modules/facilities/facilities.config";
import { FACILITY_TYPE_LABELS, FACILITY_TYPES } from "@/modules/facilities/facilities.types";

/** Editable fields of a facility (excludes server-managed + scope-only columns). */
export interface FacilityFormValues {
  name: string;
  branch_id: string;
  type: FacilityType;
  /**
   * Capacity is edited as a string so the {@link TextField} `type="number"`
   * behaves; it is parsed to an integer inside {@link toFacilityPayload}.
   */
  capacity: string;
  unit_of_capacity: string;
  indoor: boolean;
  is_active: boolean;
  currency: string;
  /**
   * Hourly cost expressed in **major** units on the form (e.g. `"30.00"` for a
   * USD facility). The payload builder multiplies by 100 to persist in minor
   * units on the wire, matching the backend contract.
   */
  hourly_cost: string;
  notes: string;
}

/**
 * Validation errors surfaced by {@link validateFacilityForm}. Only the required
 * fields (`name`, `branch_id`, `type`) can fail — everything else is optional
 * with a sensible default.
 */
export interface FacilityFormErrors {
  name?: string;
  branch_id?: string;
  type?: string;
  capacity?: string;
}

/**
 * Pure validator for the facility form: reports the required-field errors so
 * the submit handler can bail before hitting {@link toFacilityPayload}.
 */
export function validateFacilityForm(values: FacilityFormValues): FacilityFormErrors {
  const errors: FacilityFormErrors = {};

  if (values.name.trim() === "") {
    errors.name = "Name is required.";
  }

  if (values.branch_id.trim() === "") {
    errors.branch_id = "Branch is required.";
  }

  if (values.type.trim() === "") {
    errors.type = "Type is required.";
  }

  // A capacity of 0 is allowed (e.g. a maintenance-only equipment row), but
  // a truly empty or negative value is rejected so the record round-trips.
  if (values.capacity.trim() !== "") {
    const parsed = Number.parseInt(values.capacity, 10);

    if (Number.isNaN(parsed) || parsed < 0) {
      errors.capacity = "Capacity must be a positive number.";
    }
  }

  return errors;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(
  scopeBranchId: string | null,
  initial?: Partial<Facility>,
): FacilityFormValues {
  const initialType: FacilityType = initial?.type ?? "pitch";

  return {
    name: initial?.name ?? "",
    branch_id: initial?.branch_id ?? scopeBranchId ?? "",
    type: initialType,
    capacity:
      initial?.capacity != null
        ? String(initial.capacity)
        : String(FACILITY_DEFAULT_CAPACITY[initialType]),
    unit_of_capacity: initial?.unit_of_capacity ?? FACILITY_DEFAULT_UNIT_OF_CAPACITY[initialType],
    // The fixture does not yet ship `indoor`; treat null the same as false on
    // the form so the toggle has a definite state.
    indoor: initial?.indoor ?? false,
    is_active: initial?.is_active ?? true,
    currency: initial?.currency ?? "USD",
    // The wire format stores the cost in minor units — divide when we hydrate
    // and multiply when we submit. Two-decimal string keeps the field friendly.
    hourly_cost:
      initial?.hourly_cost_minor != null ? (initial.hourly_cost_minor / 100).toFixed(2) : "0.00",
    notes: initial?.notes ?? "",
  };
}

/**
 * Converts form values into a facility API payload, injecting the active
 * scope's branch id when the form does not explicitly override it (empty
 * string becomes the empty string, mirroring the branch form contract). The
 * scope is passed as an argument so the transform stays pure and testable.
 */
export function toFacilityPayload(
  values: FacilityFormValues,
  scope: ActiveScope,
): Partial<Facility> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  // Parse the "major-unit" hourly cost into an integer minor-unit value. An
  // unparsable value collapses to 0 so a partially-filled form still round-trips.
  const parsedMajor = Number.parseFloat(values.hourly_cost);
  const hourlyCostMinor = Number.isNaN(parsedMajor) ? 0 : Math.round(parsedMajor * 100);

  return {
    name: values.name.trim(),
    // Branch defaults to the caller's active branch when the form has no
    // explicit selection. The empty-string fallback matches the branch form
    // pattern for `organization_id`.
    branch_id: values.branch_id || scope.branchId || "",
    type: values.type,
    capacity: Number.parseInt(values.capacity, 10) || 0,
    unit_of_capacity: emptyToNull(values.unit_of_capacity),
    indoor: values.indoor,
    is_active: values.is_active,
    currency: values.currency.trim().toUpperCase() || "USD",
    hourly_cost_minor: hourlyCostMinor,
    notes: emptyToNull(values.notes),
  };
}

/** Props for {@link FacilityForm}. */
interface FacilityFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Facility>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: FacilityFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled facility create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function FacilityForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: FacilityFormProps): ReactNode {
  const { scope, allowed } = useScope();

  const [values, setValues] = useState<FacilityFormValues>(() =>
    toFormValues(scope.branchId, initialValues),
  );
  // Errors are kept in local state so the submit handler can populate them
  // just-in-time; individual fields clear their own error on change so the
  // hint disappears the moment the user fixes it.
  const [errors, setErrors] = useState<FacilityFormErrors>({});

  const setField = <K extends keyof FacilityFormValues>(
    key: K,
    value: FacilityFormValues[K],
  ): void => {
    setValues((current) => {
      const next = { ...current, [key]: value };

      // Switching type retunes the capacity + unit defaults, but only when
      // the user has not manually overridden them yet (i.e. still holding the
      // previous type's defaults). This mirrors how the branches form seeds
      // the timezone on organization change.
      if (key === "type") {
        const nextType = value as FacilityType;
        const previousType = current.type;

        if (current.capacity === String(FACILITY_DEFAULT_CAPACITY[previousType])) {
          next.capacity = String(FACILITY_DEFAULT_CAPACITY[nextType]);
        }

        if (current.unit_of_capacity === FACILITY_DEFAULT_UNIT_OF_CAPACITY[previousType]) {
          next.unit_of_capacity = FACILITY_DEFAULT_UNIT_OF_CAPACITY[nextType];
        }
      }

      return next;
    });

    // Clear any error hint the moment the user starts fixing the field.
    if (errors[key as keyof FacilityFormErrors]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const nextErrors = validateFacilityForm(values);

    setErrors(nextErrors);

    // Only fire onSubmit when nothing failed — otherwise the parent's
    // `useForm` mutation will just re-reject with the same message.
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Card.Content>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              isRequired
              className="sm:col-span-2"
              // Announce the validation error through the standard React Aria
              // channel — the field will render its own error message slot.
              isInvalid={Boolean(errors.name)}
              name="name"
              value={values.name}
              variant="secondary"
              onChange={(value) => setField("name", value)}
            >
              <Label>Name</Label>
              <Input placeholder="Main Pitch (Full 11v11)" />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </TextField>

            <Select
              className="w-full"
              isInvalid={Boolean(errors.branch_id)}
              placeholder="Select branch"
              value={values.branch_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("branch_id", key ? String(key) : "")}
            >
              <Label>Branch</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {allowed.branches.map((branch) => (
                    <ListBox.Item key={branch.id} id={branch.id} textValue={branch.name}>
                      {branch.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
              {errors.branch_id ? <FieldError>{errors.branch_id}</FieldError> : null}
            </Select>

            <Select
              className="w-full"
              isInvalid={Boolean(errors.type)}
              placeholder="Select type"
              value={values.type}
              variant="secondary"
              onChange={(key: Key | null) => setField("type", key as FacilityType)}
            >
              <Label>Type</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {FACILITY_TYPES.map((type) => (
                    <ListBox.Item key={type} id={type} textValue={FACILITY_TYPE_LABELS[type]}>
                      {FACILITY_TYPE_LABELS[type]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
              {errors.type ? <FieldError>{errors.type}</FieldError> : null}
            </Select>

            <TextField
              isInvalid={Boolean(errors.capacity)}
              name="capacity"
              type="number"
              value={values.capacity}
              variant="secondary"
              onChange={(value) => setField("capacity", value)}
            >
              <Label>Capacity</Label>
              <Input min="0" />
              {errors.capacity ? <FieldError>{errors.capacity}</FieldError> : null}
            </TextField>

            <TextField
              name="unit_of_capacity"
              value={values.unit_of_capacity}
              variant="secondary"
              onChange={(value) => setField("unit_of_capacity", value)}
            >
              <Label>Unit of capacity</Label>
              <Input placeholder="players" />
            </TextField>

            <TextField
              name="hourly_cost"
              type="number"
              value={values.hourly_cost}
              variant="secondary"
              onChange={(value) => setField("hourly_cost", value)}
            >
              <Label>Hourly cost</Label>
              <Input min="0" step="0.01" />
            </TextField>

            <TextField
              name="currency"
              value={values.currency}
              variant="secondary"
              onChange={(value) => setField("currency", value)}
            >
              <Label>Currency</Label>
              <Input maxLength={3} placeholder="USD" />
            </TextField>

            <div className="flex items-center">
              <Switch
                isSelected={values.indoor}
                onChange={(selected) => setField("indoor", selected)}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Indoor
                </Switch.Content>
              </Switch>
            </div>

            <div className="flex items-center">
              <Switch
                isSelected={values.is_active}
                onChange={(selected) => setField("is_active", selected)}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Active
                </Switch.Content>
              </Switch>
            </div>

            <div className="sm:col-span-2">
              <TextField
                name="notes"
                value={values.notes}
                variant="secondary"
                onChange={(value) => setField("notes", value)}
              >
                <Label>Notes</Label>
                <TextArea placeholder="Operational notes, maintenance quirks, …" rows={3} />
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

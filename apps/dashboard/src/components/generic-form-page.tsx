/**
 * @file generic-form-page.tsx
 * @module components/generic-form-page
 *
 * @description
 * The full-page routed form (§7.1) used for both `create` and `edit`.
 * Wires Refine's `useForm` for load + save, renders fields from
 * `meta.formFields` (or from an inferred schema when absent), and
 * lays them out in one of three modes:
 *
 *   * `single`    — legacy one-page stack, one section per card.
 *   * `tabs`      — Medusa-style `<ProgressTabs>` with per-step status
 *                   chips + Next/Back navigation.
 *   * `accordion` — `<ProgressAccordion>` for variable-step flows
 *                   where later steps depend on earlier ones (invoice
 *                   creation, athlete onboarding with document uploads).
 *
 * The mode is picked in this order:
 *
 *   1. Explicit `meta.formLayout` if set on the module manifest.
 *   2. `"tabs"` when `formFields` has 2+ distinct `section` values
 *      (auto-adoption of the new default — no manifest change needed).
 *   3. `"single"` otherwise.
 *
 * Step content is either derived from field sections (matching
 * section names, one step per unique section) or declared explicitly
 * via `meta.formSteps`. Field data is tracked in local state so per-
 * step required-field completion can flip status chips green live —
 * users see progress across the stepper as they type, not only on
 * submit. Values still submit as one atomic FormData payload so the
 * backend contract doesn't change based on the layout.
 */

import {
  Button,
  ComboBox,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";
import { useForm, useNavigation, useShow } from "@refinedev/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "@stackra/routing/react";

import type { AppResourceMeta, FieldSchema, FormLayoutMode, FormStep } from "@/lib/module";
import type { BaseRecord } from "@refinedev/core";
import type { ProgressStatus, ProgressStep } from "@/components/progress-tabs";
import type { ReactNode } from "react";

import { FileUploadField } from "@/components/file-upload-field";
import { PageHeader } from "@/components/page-header";
import { PhoneInput } from "@/components/phone-input";
import { ProgressAccordion } from "@/components/progress-accordion";
import { ProgressTabs } from "@/components/progress-tabs";
import { RichTextEditorField } from "@/components/rich-text-editor-field";
import { Iconify } from "@/icons/iconify";
import { inferFieldSchema } from "@/lib/field-inference";
import { singularize } from "@/lib/singularize";
import { appResources } from "@/modules/registry";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type GenericFormPageProps = {
  action: "create" | "edit";
  resource: string;
  /** Optional explicit title — defaults to `Create <singular>` / `Edit <singular>`. */
  title?: string;
};

// ---------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------

/**
 * Read a nested value out of an object using dot notation, e.g.
 * `readPath({status: {text: "Paid"}}, "status.text") === "Paid"`.
 * Returns `undefined` for any missing hop so the caller can safely
 * chain `??` fallbacks.
 */
function readPath(row: Record<string, unknown> | undefined, path: string): unknown {
  if (!row) return undefined;

  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];

    return undefined;
  }, row);
}

/**
 * Mirror of `readPath` — creates any missing intermediate objects
 * along the way so nested payloads (e.g. `status.text`) round-trip
 * cleanly into the Refine mutation input.
 */
function writePath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let cursor: Record<string, unknown> = target;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;

    if (typeof cursor[key] !== "object" || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;
}

/**
 * Coerce a form-data string value into whatever shape the backend
 * expects for the given field kind. Empty/undefined/null shortcut to
 * `undefined` so the enclosing form drops the field entirely from the
 * mutation payload.
 */
function coerceValue(field: FieldSchema, raw: unknown): unknown {
  if (raw === "" || raw === null || raw === undefined) return undefined;
  if (field.kind === "number" || field.kind === "currency") return Number(raw);
  if (field.kind === "percent") return Number(raw) / 100;
  if (field.kind === "switch") return Boolean(raw);
  if (field.kind === "file") {
    // FileUploadField submits a JSON array of `UploadedFile` records
    // via its hidden input. Parse it back into a real array so the
    // Refine mutation payload carries structured data, not a string.
    try {
      const parsed = JSON.parse(String(raw)) as unknown;

      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  return raw;
}

/**
 * Whether the field carries a "meaningful" value for step-completion
 * tracking. Empty strings and `undefined` don't count; explicit `false`
 * on a switch does (the user made a choice).
 */
function hasValue(raw: unknown): boolean {
  if (raw === null || raw === undefined) return false;
  if (typeof raw === "string") return raw.trim().length > 0;
  if (Array.isArray(raw)) return raw.length > 0;

  return true;
}

// ---------------------------------------------------------------------------
// Step derivation
// ---------------------------------------------------------------------------

/**
 * Group fields by `section` in the order sections first appear. Used
 * both by the single-page layout (renders one card per group) and by
 * the auto-derived step layout (one step per group).
 */
function groupFieldsBySection(fields: FieldSchema[]): { section: string; items: FieldSchema[] }[] {
  const map = new Map<string, FieldSchema[]>();

  for (const field of fields) {
    const key = field.section ?? "";
    const bucket = map.get(key) ?? [];

    bucket.push(field);
    map.set(key, bucket);
  }

  return [...map.entries()].map(([section, items]) => ({ section, items }));
}

/**
 * Pick the effective layout mode. Explicit `formLayout` on the meta
 * wins; otherwise auto-adopt `"tabs"` when there are 2+ distinct
 * sections (Medusa-style default), and fall back to `"single"` for
 * one-section or no-section forms.
 */
function resolveLayoutMode(
  meta: AppResourceMeta | undefined,
  fields: FieldSchema[],
): FormLayoutMode {
  if (meta?.formLayout) return meta.formLayout;

  const sections = new Set(fields.map((f) => f.section ?? ""));

  return sections.size >= 2 ? "tabs" : "single";
}

/**
 * Auto-derive one step per unique section when the manifest doesn't
 * declare `formSteps` explicitly. Section names become both the step
 * id (slug-cased) and label.
 */
function deriveStepsFromSections(fields: FieldSchema[]): FormStep[] {
  return groupFieldsBySection(fields)
    .filter((group) => group.section) // skip the unnamed bucket
    .map((group) => ({
      id: slugify(group.section),
      label: group.section,
      type: "fields" as const,
      sections: [group.section],
    }));
}

/** Case-insensitive, whitespace → dash slug helper for step ids. */
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Which sections belong to which step, indexed by step id. Used to
 * partition the field list at render time.
 */
function stepSectionsIndex(steps: FormStep[]): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};

  for (const step of steps) {
    out[step.id] = new Set(step.sections ?? []);
  }

  return out;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GenericFormPage({ action, resource, title }: GenericFormPageProps) {
  const { id: idParam } = useParams();
  const { list } = useNavigation();
  const meta = appResources.find((r) => r.name === resource)?.meta as AppResourceMeta | undefined;

  // Load current record for edit mode.
  const { result: existingRecord } = useShow<BaseRecord>({
    resource,
    id: action === "edit" ? idParam : undefined,
    queryOptions: { enabled: action === "edit" },
  });

  const { onFinish, mutation, formLoading } = useForm<BaseRecord>({
    action,
    resource,
    id: action === "edit" ? idParam : undefined,
    redirect: "list",
    successNotification: () => ({
      message: `${meta?.singularLabel ?? singularize(meta?.label ?? resource)} ${action === "create" ? "created" : "updated"}`,
      type: "success",
    }),
    errorNotification: () => ({
      message: `Couldn't ${action === "create" ? "create" : "update"} record`,
      type: "error",
    }),
  });

  const singular = meta?.singularLabel ?? singularize(meta?.label ?? resource);
  const heading = title ?? `${action === "create" ? "Create" : "Edit"} ${singular.toLowerCase()}`;

  // Ref to the underlying <form> element so `ProgressTabs`' submit
  // button (which lives outside the native form-submit chain) can
  // call `requestSubmit()` to fire browser validation + our own
  // `handleSubmit` handler.
  const formRef = useRef<HTMLFormElement | null>(null);
  const requestSubmit = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const fields: FieldSchema[] = useMemo(() => {
    if (meta?.formFields?.length) return meta.formFields;
    // Fallback: derive from the loaded record (edit) or resource fixture sample (create).
    if (action === "edit" && existingRecord)
      return inferFieldSchema(existingRecord as Record<string, unknown>);

    // For create with no schema, try to pull a sample from the datasets.
    return [];
  }, [meta?.formFields, action, existingRecord]);

  // -------------------------------------------------------------------------
  // Layout resolution
  // -------------------------------------------------------------------------
  const layoutMode: FormLayoutMode = useMemo(() => resolveLayoutMode(meta, fields), [meta, fields]);

  const steps: FormStep[] = useMemo(() => {
    if (meta?.formSteps?.length) return meta.formSteps;

    return deriveStepsFromSections(fields);
  }, [meta?.formSteps, fields]);

  const sections = useMemo(() => groupFieldsBySection(fields), [fields]);

  // -------------------------------------------------------------------------
  // Field value state — powers live step-completion tracking
  // -------------------------------------------------------------------------
  // Seed local state from the loaded record so edit forms show
  // realistic per-step status on first paint. We hold values as
  // `unknown` because the underlying controls own their input types;
  // this state is only used to drive the completion computation.
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};

    for (const field of fields) {
      const seed =
        readPath(existingRecord as Record<string, unknown> | undefined, field.name) ??
        field.defaultValue;

      if (seed !== undefined) initial[field.name] = seed;
    }

    return initial;
  });

  // Called on every input change so we can flip the step chip live.
  const handleFieldChange = useCallback((name: string, next: unknown) => {
    setValues((prev) => {
      // Skip identical writes so switch flips + rapid keystrokes don't
      // thrash re-renders across an entire step index.
      if (prev[name] === next) return prev;

      return { ...prev, [name]: next };
    });
  }, []);

  // -------------------------------------------------------------------------
  // Per-step completion status
  // -------------------------------------------------------------------------
  const stepStatusById: Record<string, ProgressStatus> = useMemo(() => {
    const out: Record<string, ProgressStatus> = {};
    const sectionsIdx = stepSectionsIndex(steps);

    for (const step of steps) {
      if (step.type === "review") {
        // Review steps are always considered complete for gating — the
        // form's own submit-time validation is the real safety net.
        out[step.id] = "complete";
        continue;
      }

      const stepSections = sectionsIdx[step.id] ?? new Set<string>();
      const stepFields = fields.filter(
        (f) => f.kind !== "hidden" && stepSections.has(f.section ?? ""),
      );
      const requiredFields = stepFields.filter((f) => f.isRequired);
      const touched = stepFields.some((f) => hasValue(values[f.name]));
      const allRequiredFilled = requiredFields.every((f) => hasValue(values[f.name]));

      if (requiredFields.length === 0 && !touched) {
        out[step.id] = "not-started";
      } else if (allRequiredFilled) {
        out[step.id] = "complete";
      } else if (touched) {
        out[step.id] = "in-progress";
      } else {
        out[step.id] = "not-started";
      }
    }

    return out;
  }, [fields, steps, values]);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {};

      for (const field of fields) {
        if (field.kind === "hidden") continue;
        const raw =
          field.kind === "switch" ? formData.get(field.name) === "on" : formData.get(field.name);
        const coerced = coerceValue(field, raw);

        if (coerced !== undefined) writePath(payload, field.name, coerced);
      }

      onFinish(payload);
    },
    [fields, onFinish],
  );

  // -------------------------------------------------------------------------
  // Renderers
  // -------------------------------------------------------------------------

  /**
   * Render a single field with change tracking wired in. Kept as a
   * memoised callback so each step's content array stays reference-
   * stable when unrelated fields update.
   */
  const renderField = useCallback(
    (field: FieldSchema) => {
      const defaultValue =
        readPath(existingRecord as Record<string, unknown> | undefined, field.name) ??
        field.defaultValue;

      return (
        <div key={field.name} className={field.colSpan === 2 ? "sm:col-span-2" : undefined}>
          <FieldControl
            defaultValue={defaultValue}
            field={field}
            onValueChange={handleFieldChange}
          />
        </div>
      );
    },
    [existingRecord, handleFieldChange],
  );

  /**
   * Render the fields that belong to a specific step. Fields keep
   * their original grid + column-span behaviour so a step with a
   * mixed 1-col / 2-col layout matches the single-page view.
   */
  const renderStepFields = useCallback(
    (step: FormStep): ReactNode => {
      if (step.type === "review") {
        return <ReviewSummary fields={fields} values={values} />;
      }

      const stepSections = new Set(step.sections ?? []);
      const stepFields = fields.filter((f) => stepSections.has(f.section ?? ""));

      if (stepFields.length === 0) {
        return <p className="text-sm text-muted">No fields configured for this step.</p>;
      }

      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{stepFields.map(renderField)}</div>
      );
    },
    [fields, renderField, values],
  );

  // -------------------------------------------------------------------------
  // Layout: tabs / accordion / single
  // -------------------------------------------------------------------------
  const useStepped = layoutMode === "tabs" || layoutMode === "accordion";
  const progressSteps: ProgressStep[] = useMemo(
    () =>
      steps.map((step) => ({
        id: step.id,
        label: step.label,
        icon: step.icon,
        content: renderStepFields(step),
        status: stepStatusById[step.id] ?? "not-started",
        isRequired: step.isRequired,
      })),
    [renderStepFields, stepStatusById, steps],
  );

  const showEmptyState = fields.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Button onPress={() => list(resource)} variant="ghost">
            <Iconify className="size-4" icon="xmark" />
            Cancel
          </Button>
        }
        description={
          action === "create"
            ? `Create a new ${singular.toLowerCase()}.`
            : `Update this ${singular.toLowerCase()}.`
        }
        title={heading}
      />

      <Form className="flex flex-col gap-8" onSubmit={handleSubmit} ref={formRef}>
        {showEmptyState ? (
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">
              No form fields are configured for this resource yet. Declare{" "}
              <code>meta.formFields</code> in the module manifest to render a full editor.
            </p>
          </div>
        ) : useStepped ? (
          layoutMode === "tabs" ? (
            <ProgressTabs
              isSubmitting={mutation.isPending || formLoading}
              onCancel={() => list(resource)}
              onSubmit={requestSubmit}
              steps={progressSteps}
              submitLabel={
                action === "create" ? `Create ${singular.toLowerCase()}` : "Save changes"
              }
            />
          ) : (
            <ProgressAccordion
              isSequential
              isSubmitting={mutation.isPending || formLoading}
              onCancel={() => list(resource)}
              onSubmit={requestSubmit}
              steps={progressSteps}
              submitLabel={
                action === "create" ? `Create ${singular.toLowerCase()}` : "Save changes"
              }
            />
          )
        ) : (
          <>
            {sections.map(({ section, items }) => (
              <section
                key={section || "default"}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
              >
                {section ? (
                  <h2 className="text-base font-semibold text-foreground">{section}</h2>
                ) : null}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {items.map(renderField)}
                </div>
              </section>
            ))}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button onPress={() => list(resource)} type="button" variant="ghost">
                Cancel
              </Button>
              <Button
                isDisabled={formLoading || mutation.isPending}
                type="submit"
                variant="primary"
              >
                <Iconify className="size-4" icon="check" />
                {action === "create" ? `Create ${singular.toLowerCase()}` : "Save changes"}
              </Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review summary — read-only recap for the final ProgressTabs step
// ---------------------------------------------------------------------------

/**
 * Renders the entered values as a set of dl-style pairs, grouped by
 * section. Fields without a value are hidden so the summary reads
 * like a natural recap rather than a form skeleton.
 *
 * Kept intentionally simple — no editing affordances inline. Users
 * jump back to prior tabs via the ProgressTabs Back button when they
 * spot something they want to change.
 */
function ReviewSummary({
  fields,
  values,
}: {
  fields: FieldSchema[];
  values: Record<string, unknown>;
}): ReactNode {
  const groups = useMemo(() => groupFieldsBySection(fields), [fields]);
  const hasAnyValue = fields.some((field) => hasValue(values[field.name]));

  if (!hasAnyValue) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm">
        <p className="text-muted">
          Nothing to review yet — fill in the earlier steps and this page will summarise the entered
          values.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups
        .filter((group) => group.section && group.items.some((f) => hasValue(values[f.name])))
        .map((group) => (
          <section key={group.section} className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{group.section}</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {group.items
                .filter((f) => f.kind !== "hidden" && hasValue(values[f.name]))
                .map((f) => (
                  <div key={f.name} className="flex flex-col">
                    <dt className="text-xs tracking-wide text-muted uppercase">{f.label}</dt>
                    <dd className="text-sm text-foreground">
                      {formatReviewValue(f, values[f.name])}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
    </div>
  );
}

/**
 * Turn a raw value into a display-friendly string for the review
 * step. Handles the common cases (`switch` → Yes / No,
 * `select` → option label, `file` → file names). Falls back to
 * `String(value)` for anything else.
 */
function formatReviewValue(field: FieldSchema, value: unknown): string {
  if (field.kind === "switch") return value ? "Yes" : "No";
  if (field.kind === "select" && field.options) {
    const opt = field.options.find((o) => o.id === value);

    return opt?.label ?? String(value);
  }
  if (field.kind === "file" && Array.isArray(value)) {
    const files = value as { name: string }[];

    return files.map((f) => f.name).join(", ") || "0 files";
  }
  if (field.kind === "richtext" && typeof value === "string") {
    // Strip tags for the review so the summary line stays legible.
    const stripped = value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return stripped.slice(0, 120) + (stripped.length > 120 ? "…" : "");
  }

  return String(value);
}

// ---------------------------------------------------------------------------
// FieldControl dispatch — the leaf render for one field
// ---------------------------------------------------------------------------

/**
 * The per-field control. Dispatches on `field.kind` to the right
 * concrete input primitive. Every branch renders the same label /
 * description / error scaffolding so the visual language stays
 * consistent across the form.
 *
 * `onValueChange` is invoked on every user edit so the enclosing
 * `GenericFormPage` can drive live step-completion status. It's
 * lightweight — we only touch state when the value actually changes.
 */
function FieldControl({
  defaultValue,
  field,
  onValueChange,
}: {
  defaultValue: unknown;
  field: FieldSchema;
  onValueChange: (name: string, value: unknown) => void;
}) {
  const { label, name, description, placeholder, isRequired } = field;
  const notify = (value: unknown) => onValueChange(name, value);

  if (field.kind === "hidden") {
    return (
      <input name={name} type="hidden" value={defaultValue == null ? "" : String(defaultValue)} />
    );
  }

  if (field.kind === "phone") {
    return (
      <PhoneInput
        defaultIso2={field.phone?.defaultIso2}
        defaultValue={defaultValue == null ? undefined : String(defaultValue)}
        description={description}
        isRequired={isRequired}
        label={label}
        name={name}
        onChange={notify}
        placeholder={placeholder}
      />
    );
  }

  if (field.kind === "richtext") {
    return (
      <RichTextEditorField
        defaultValue={defaultValue == null ? undefined : String(defaultValue)}
        description={description}
        isRequired={isRequired}
        isReadOnly={field.richtext?.isReadOnly}
        label={label}
        maxLength={field.richtext?.maxLength}
        name={name}
        placeholder={placeholder}
      />
    );
  }

  if (field.kind === "file") {
    return (
      <FileUploadField
        accept={field.file?.accept}
        defaultValue={defaultValue as never}
        description={description}
        isRequired={isRequired}
        label={label}
        maxFiles={field.file?.maxFiles}
        maxSize={field.file?.maxSize}
        multiple={field.file?.multiple}
        name={name}
      />
    );
  }

  if (field.kind === "switch") {
    return (
      <div className="flex items-center gap-3">
        <Switch
          defaultSelected={Boolean(defaultValue)}
          name={name}
          onChange={(isSelected) => notify(isSelected)}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
        <Label className="text-sm font-medium text-foreground">{label}</Label>
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <TextField isRequired={isRequired} name={name}>
        <Label>{label}</Label>
        <TextArea
          defaultValue={defaultValue == null ? "" : String(defaultValue)}
          onChange={(event) => notify(event.target.value)}
          placeholder={placeholder}
          variant="secondary"
        />
        {description ? <Description>{description}</Description> : null}
        <FieldError />
      </TextField>
    );
  }

  if (field.kind === "number" || field.kind === "currency" || field.kind === "percent") {
    const numericDefault =
      typeof defaultValue === "number" ? defaultValue : Number(defaultValue) || 0;
    const display = field.kind === "percent" ? numericDefault * 100 : numericDefault;

    return (
      <NumberField
        defaultValue={display}
        isRequired={isRequired}
        maxValue={field.maxValue}
        minValue={field.minValue}
        name={name}
        onChange={(next) => notify(next)}
      >
        <Label>{label}</Label>
        <NumberField.Group>
          <NumberField.DecrementButton />
          <NumberField.Input />
          <NumberField.IncrementButton />
        </NumberField.Group>
        {description ? <Description>{description}</Description> : null}
        <FieldError />
      </NumberField>
    );
  }

  if (field.kind === "select") {
    const options = field.options ?? [];
    // Auto-upgrade long option lists into a searchable ComboBox. The
    // threshold (>10) matches the settings renderer so behaviour is
    // consistent across the settings + entity form surfaces.
    const useCombo = field.searchable || options.length > 10;

    if (useCombo) {
      return (
        <ComboBox
          defaultSelectedKey={defaultValue == null ? undefined : String(defaultValue)}
          fullWidth
          isRequired={isRequired}
          name={name}
          onSelectionChange={(key) => notify(key)}
          variant="secondary"
        >
          <Label>{label}</Label>
          <ComboBox.InputGroup>
            <Input placeholder={placeholder ?? "Search…"} />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>
              {options.map((option) => (
                <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
          {description ? <Description>{description}</Description> : null}
          <FieldError />
        </ComboBox>
      );
    }

    return (
      <Select
        defaultValue={defaultValue == null ? undefined : String(defaultValue)}
        isRequired={isRequired}
        name={name}
        onChange={(next) => notify(next)}
        variant="secondary"
      >
        <Label>{label}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {options.map((option) => (
              <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                {option.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
        {description ? <Description>{description}</Description> : null}
        <FieldError />
      </Select>
    );
  }

  if (field.kind === "date") {
    const dateDefault = defaultValue ? String(defaultValue).slice(0, 10) : "";

    return (
      <TextField isRequired={isRequired} name={name} type="date">
        <Label>{label}</Label>
        <Input
          defaultValue={dateDefault}
          onChange={(event) => notify(event.target.value)}
          variant="secondary"
        />
        {description ? <Description>{description}</Description> : null}
        <FieldError />
      </TextField>
    );
  }

  // text | email
  return (
    <TextField isRequired={isRequired} name={name} type={field.kind === "email" ? "email" : "text"}>
      <Label>{label}</Label>
      <Input
        defaultValue={defaultValue == null ? "" : String(defaultValue)}
        onChange={(event) => notify(event.target.value)}
        placeholder={placeholder}
        variant="secondary"
      />
      {description ? <Description>{description}</Description> : null}
      <FieldError />
    </TextField>
  );
}

export default GenericFormPage;

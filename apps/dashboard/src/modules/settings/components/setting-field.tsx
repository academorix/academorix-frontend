/**
 * @file setting-field.tsx
 * @module modules/settings/components/setting-field
 *
 * @description
 * The single renderer used by every settings tab. Takes a declarative
 * `SettingField` from the schema, resolves its effective value through the
 * scope provider, and paints:
 *
 *   [ Label (?) ]                        [ 🔗/🔓 inheritance toggle ]
 *   [ input control (disabled when linked)                          ]
 *   [ description · effective scope chip                            ]
 *
 * Every type (`string` → `duration`) is handled by a dispatch table so
 * consumers just drop `<SettingFieldRenderer field={...}/>` inside a form.
 */

import {
  Button,
  Chip,
  ComboBox,
  Description,
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";
import { useCallback } from "react";

import type { SettingField, SettingOption } from "@/modules/settings/scope/types";

import { Iconify } from "@/icons/iconify";
import { useSetting, useSettingsScope } from "@/modules/settings/scope/settings-provider";
import { SCOPE_LABEL } from "@/modules/settings/scope/types";

import { ScopeCascadeTooltip } from "./scope-cascade-tooltip";

type SettingFieldRendererProps = {
  field: SettingField;
};

// -----------------------------------------------------------------------------
// Inheritance toggle
// -----------------------------------------------------------------------------

function InheritanceToggle({
  isOverridden,
  onOverride,
  onRevert,
  scopeLabel,
}: {
  isOverridden: boolean;
  onOverride: () => void;
  onRevert: () => void;
  scopeLabel: string;
}) {
  return (
    <button
      aria-label={isOverridden ? `Revert to inherited value` : `Override at ${scopeLabel}`}
      className={
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/60 " +
        (isOverridden
          ? "bg-accent/10 text-accent hover:bg-accent/15"
          : "bg-default/20 text-muted hover:text-foreground")
      }
      onClick={isOverridden ? onRevert : onOverride}
      type="button"
    >
      <Iconify className="size-3" icon={isOverridden ? "link-slash" : "link"} />
      <span className="hidden sm:inline">{isOverridden ? "Overridden" : "Inherited"}</span>
    </button>
  );
}

// -----------------------------------------------------------------------------
// The renderer
// -----------------------------------------------------------------------------

export function SettingFieldRenderer({ field }: SettingFieldRendererProps) {
  const { editingScope } = useSettingsScope();
  const { value, isOverridden, setValue, clearOverride, resolution } = useSetting(field);

  const canEditHere = editingScope !== "system";
  const isDisabled = !canEditHere;

  // When the user first types / toggles, if the value was inherited we
  // implicitly override at the editing scope (matches Notion's behaviour).
  const handleChange = useCallback((next: unknown) => setValue(next), [setValue]);

  const onExplicitOverride = () => {
    // Seed the override with the current effective value.
    setValue(value);
  };

  return (
    <div
      className={
        "flex flex-col gap-2 rounded-lg p-3 transition-colors " +
        (isOverridden ? "bg-accent/5 ring-1 ring-accent/20" : "hover:bg-surface-secondary/40")
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Label className="text-sm font-medium text-foreground">{field.label}</Label>
          <ScopeCascadeTooltip field={field} resolution={resolution} />
          {field.translatable ? (
            <Chip color="accent" size="sm" variant="soft">
              <Iconify className="size-3" icon="globe" />
              <Chip.Label>i18n</Chip.Label>
            </Chip>
          ) : null}
        </div>
        {canEditHere ? (
          <InheritanceToggle
            isOverridden={isOverridden}
            onOverride={onExplicitOverride}
            onRevert={clearOverride}
            scopeLabel={SCOPE_LABEL[editingScope]}
          />
        ) : null}
      </div>

      <FieldInput
        field={field}
        isDisabled={isDisabled || !isOverridden}
        onChange={handleChange}
        value={value}
      />

      {field.description ? (
        <p className="text-xs leading-relaxed text-muted">{field.description}</p>
      ) : null}

      {isOverridden ? (
        <p className="text-[11px] text-muted">
          <Iconify className="inline size-3 text-accent" icon="link-slash" /> Local override at{" "}
          <span className="font-medium text-foreground">{SCOPE_LABEL[editingScope]}</span>
        </p>
      ) : (
        <p className="text-[11px] text-muted">
          <Iconify className="inline size-3" icon="link" /> Inherited from{" "}
          <span className="font-medium text-foreground">
            {SCOPE_LABEL[resolution.effectiveScope]}
          </span>
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Per-type input dispatch table
// -----------------------------------------------------------------------------

type FieldInputProps = {
  field: SettingField;
  value: unknown;
  onChange: (next: unknown) => void;
  isDisabled: boolean;
};

function FieldInput({ field, value, onChange, isDisabled }: FieldInputProps) {
  const options: SettingOption[] = field.options ?? [];

  switch (field.type) {
    case "string":
    case "text":
      return field.type === "text" ? (
        <TextField isDisabled={isDisabled} value={String(value ?? "")} onChange={onChange}>
          <TextArea placeholder={field.placeholder} rows={field.rows ?? 3} variant="secondary" />
        </TextField>
      ) : (
        <TextField
          isDisabled={isDisabled}
          type={field.isSecret ? "password" : "text"}
          value={String(value ?? "")}
          onChange={onChange}
        >
          <Input placeholder={field.placeholder} variant="secondary" />
        </TextField>
      );

    case "number":
    case "currency":
    case "percent":
    case "duration": {
      const numeric = typeof value === "number" ? value : Number(value ?? field.defaultValue ?? 0);
      const display = field.type === "percent" ? numeric * 100 : numeric;
      const suffix =
        field.unit ??
        (field.type === "duration" ? "min" : field.type === "percent" ? "%" : undefined);

      return (
        <NumberField
          isDisabled={isDisabled}
          maxValue={field.max}
          minValue={field.min}
          step={field.step}
          value={display}
          onChange={(next) => {
            if (next === undefined) return onChange(undefined);
            onChange(field.type === "percent" ? next / 100 : next);
          }}
        >
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
          {suffix ? <Description>Unit: {suffix}</Description> : null}
        </NumberField>
      );
    }

    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Switch
            isDisabled={isDisabled}
            isSelected={Boolean(value)}
            onChange={(next) => onChange(next)}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
          <span className="text-xs text-muted">{value ? "Enabled" : "Disabled"}</span>
        </div>
      );

    case "select": {
      // Auto-upgrade to a searchable ComboBox when the option list is
      // large (>10) or the schema opts in explicitly. Small lists stay
      // as a plain Select — the ComboBox's input feels heavy at 2-4
      // options.
      const useCombo = field.searchable || options.length > 10;

      if (useCombo) {
        return (
          <ComboBox
            fullWidth
            isDisabled={isDisabled}
            onSelectionChange={(next) => onChange(next == null ? undefined : String(next))}
            selectedKey={value == null ? null : String(value)}
            variant="secondary"
          >
            <ComboBox.InputGroup>
              <Input placeholder={field.placeholder ?? "Search…"} />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox>
                {options.map((opt) => (
                  <ListBox.Item key={opt.id} id={opt.id} textValue={opt.label}>
                    {opt.icon ? <Iconify className="size-4" icon={opt.icon} /> : null}
                    {opt.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        );
      }

      return (
        <Select
          fullWidth
          isDisabled={isDisabled}
          value={value == null ? undefined : String(value)}
          variant="secondary"
          onChange={(next) => onChange(next)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {options.map((opt) => (
                <ListBox.Item key={opt.id} id={opt.id} textValue={opt.label}>
                  {opt.icon ? <Iconify className="size-4" icon={opt.icon} /> : null}
                  {opt.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      );
    }

    case "multiselect": {
      const arr = Array.isArray(value) ? (value as string[]) : [];

      return (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const on = arr.includes(opt.id);

            return (
              <button
                key={opt.id}
                aria-pressed={on}
                className={
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/60 " +
                  (on
                    ? "border-accent/40 bg-accent-soft text-accent-soft-foreground"
                    : "border-border text-muted hover:text-foreground")
                }
                disabled={isDisabled}
                onClick={() => {
                  const next = on ? arr.filter((k) => k !== opt.id) : [...arr, opt.id];

                  onChange(next);
                }}
                type="button"
              >
                {opt.icon ? <Iconify className="size-3" icon={opt.icon} /> : null}
                {opt.label}
                {on ? <Iconify className="size-3" icon="check" /> : null}
              </button>
            );
          })}
        </div>
      );
    }

    case "date":
    case "time":
      return (
        <TextField
          isDisabled={isDisabled}
          type={field.type === "time" ? "time" : "date"}
          value={value ? String(value).slice(0, field.type === "time" ? 5 : 10) : ""}
          onChange={onChange}
        >
          <Input variant="secondary" />
        </TextField>
      );

    case "color":
      return (
        <TextField
          isDisabled={isDisabled}
          type="color"
          value={String(value ?? "#000000")}
          onChange={onChange}
        >
          <Input variant="secondary" />
        </TextField>
      );

    case "json":
      return (
        <TextField
          isDisabled={isDisabled}
          value={typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)}
          onChange={onChange}
        >
          <TextArea
            className="font-mono text-xs"
            placeholder={field.placeholder ?? "{ }"}
            rows={field.rows ?? 6}
            variant="secondary"
          />
        </TextField>
      );

    case "file":
      return (
        <div className="flex items-center gap-3 rounded-md border border-dashed border-border p-4">
          <Iconify className="size-6 text-muted" icon="paperclip" />
          <div className="flex flex-col">
            <span className="text-sm text-foreground">
              {value ? (typeof value === "string" ? value : "Uploaded file") : "No file uploaded"}
            </span>
            <span className="text-xs text-muted">{field.placeholder ?? "Click to upload"}</span>
          </div>
          <Button className="ms-auto" isDisabled={isDisabled} size="sm" variant="secondary">
            <Iconify className="size-3.5" icon="upload" />
            Upload
          </Button>
        </div>
      );

    default:
      return null;
  }
}

/**
 * @file attribute-field.tsx
 * @module lib/attributes/attribute-field
 *
 * @description
 * Renders a **single** dynamic attribute as the HeroUI control indicated by its
 * `widget`, wiring value/onChange and validation. This is the leaf of the SDUI
 * renderer; {@link "@/lib/attributes/attribute-form".AttributeForm} composes many
 * of these from an attribute set.
 */

import {
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Slider,
  Switch,
  TextField,
} from "@stackra/ui/react";

import type { AttributeLocale } from "@/lib/attributes/attribute.types";
import type { Attribute } from "@/types";
import type { Key, ReactNode } from "react";

import { localize } from "@/lib/attributes/attribute-values";

/** Props for {@link AttributeField}. */
interface AttributeFieldProps {
  /** The attribute definition to render. */
  attribute: Attribute;
  /** The current value for this attribute. */
  value: unknown;
  /** Called with the new (type-coerced) value on change. */
  onChange: (value: unknown) => void;
  /** Validation error message, if any. */
  error?: string;
  /** Label locale (RTL-aware); defaults to English. */
  locale?: AttributeLocale;
  /** Whether the field is read-only. */
  isReadOnly?: boolean;
}

/**
 * Renders one attribute using the control mapped from its `widget`.
 *
 * @param props - The attribute, its value, and the change handler.
 */
export function AttributeField({
  attribute,
  value,
  onChange,
  error,
  locale = "en",
  isReadOnly = false,
}: AttributeFieldProps): ReactNode {
  const label = localize(attribute.label, locale);
  const { min, max, step, required } = attribute.validation;

  switch (attribute.widget) {
    case "switch":
      return (
        <div className="flex flex-col gap-1">
          <Switch
            isDisabled={isReadOnly}
            isSelected={Boolean(value)}
            onChange={(selected) => onChange(selected)}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              {label}
            </Switch.Content>
          </Switch>
          {error ? <span className="text-xs text-danger">{error}</span> : null}
        </div>
      );

    case "slider": {
      const numeric = typeof value === "number" ? value : (min ?? 0);

      return (
        <div className="flex flex-col gap-1">
          <Slider
            isDisabled={isReadOnly}
            maxValue={max ?? 100}
            minValue={min ?? 0}
            step={step ?? 1}
            value={numeric}
            onChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
          >
            <Label>{label}</Label>
            <Slider.Output />
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
          {error ? <span className="text-xs text-danger">{error}</span> : null}
        </div>
      );
    }

    case "select":
      return (
        <Select
          className="w-full"
          isInvalid={Boolean(error)}
          isRequired={required}
          placeholder={`Select ${label.toLowerCase()}`}
          value={(value as string | null) ?? null}
          variant="secondary"
          onChange={(key: Key | null) => onChange(key)}
        >
          <Label>{label}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {(attribute.options ?? []).map((option) => (
                <ListBox.Item
                  key={option.value}
                  id={option.value}
                  textValue={localize(option.label, locale)}
                >
                  {localize(option.label, locale)}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
          {error ? <FieldError>{error}</FieldError> : null}
        </Select>
      );

    case "number":
      return (
        <TextField
          isInvalid={Boolean(error)}
          isReadOnly={isReadOnly}
          isRequired={required}
          type="number"
          value={value == null ? "" : String(value)}
          variant="secondary"
          onChange={(raw) => onChange(raw === "" ? null : Number(raw))}
        >
          <Label>{label}</Label>
          <Input
            max={max === undefined ? undefined : String(max)}
            min={min === undefined ? undefined : String(min)}
            step={step === undefined ? undefined : String(step)}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </TextField>
      );

    case "date":
      return (
        <TextField
          isInvalid={Boolean(error)}
          isReadOnly={isReadOnly}
          isRequired={required}
          type="date"
          value={value == null ? "" : String(value)}
          variant="secondary"
          onChange={(raw) => onChange(raw === "" ? null : raw)}
        >
          <Label>{label}</Label>
          <Input />
          {error ? <FieldError>{error}</FieldError> : null}
        </TextField>
      );

    default:
      // "input" and any unmapped widget fall back to a plain text field.
      return (
        <TextField
          isInvalid={Boolean(error)}
          isReadOnly={isReadOnly}
          isRequired={required}
          value={value == null ? "" : String(value)}
          variant="secondary"
          onChange={(raw) => onChange(raw)}
        >
          <Label>{label}</Label>
          <Input />
          {error ? <FieldError>{error}</FieldError> : null}
        </TextField>
      );
  }
}

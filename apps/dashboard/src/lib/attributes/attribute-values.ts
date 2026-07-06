/**
 * @file attribute-values.ts
 * @module lib/attributes/attribute-values
 *
 * @description
 * Pure helpers for working with dynamic attribute values: localizing labels,
 * computing default values for a set, coercing raw input to the declared type,
 * and validating values against a set's rules. Kept framework-free so both the
 * form and view components (and tests) can reuse them.
 */

import type {
  AttributeErrors,
  AttributeLocale,
  AttributeValues,
} from "@/lib/attributes/attribute.types";
import type { Attribute, AttributeSet, LocalizedLabel } from "@/types";

/**
 * Resolves a bilingual label to a string for the given locale, falling back to
 * English then Arabic so a label is never blank.
 */
export function localize(label: LocalizedLabel, locale: AttributeLocale = "en"): string {
  return label[locale] || label.en || label.ar;
}

/** The sensible empty/default value for a single attribute. */
export function attributeDefault(attribute: Attribute): unknown {
  switch (attribute.type) {
    case "boolean":
      return false;
    case "integer":
    case "decimal":
      // Sliders need a concrete number; other numerics start empty (null).
      return attribute.widget === "slider" ? (attribute.validation.min ?? 0) : null;
    case "select":
      return null;
    default:
      return "";
  }
}

/**
 * Builds the default value bag for an attribute set (every attribute across all
 * groups seeded with {@link attributeDefault}).
 */
export function defaultAttributeValues(set: AttributeSet): AttributeValues {
  const values: AttributeValues = {};

  for (const group of set.groups) {
    for (const attribute of group.attributes) {
      values[attribute.code] = attributeDefault(attribute);
    }
  }

  return values;
}

/**
 * Coerces a raw widget value into the attribute's declared type (e.g. numeric
 * inputs arrive as strings). Empty values become `null` for optional fields.
 */
export function coerceAttributeValue(attribute: Attribute, raw: unknown): unknown {
  if (raw === "" || raw === undefined) {
    return null;
  }

  switch (attribute.type) {
    case "integer":
      return typeof raw === "number" ? Math.trunc(raw) : Number.parseInt(String(raw), 10);
    case "decimal":
      return typeof raw === "number" ? raw : Number.parseFloat(String(raw));
    case "boolean":
      return Boolean(raw);
    default:
      return raw;
  }
}

/**
 * Validates a single attribute value against its rules, returning an error
 * message or `null` when valid.
 */
export function validateAttribute(attribute: Attribute, value: unknown): string | null {
  const { required, min, max } = attribute.validation;
  const isEmpty = value === null || value === undefined || value === "";

  if (required && isEmpty) {
    return "This field is required.";
  }

  if (isEmpty) {
    return null;
  }

  if (attribute.type === "integer" || attribute.type === "decimal") {
    const numeric = Number(value);

    if (Number.isNaN(numeric)) {
      return "Must be a number.";
    }
    if (min !== undefined && numeric < min) {
      return `Must be at least ${min}.`;
    }
    if (max !== undefined && numeric > max) {
      return `Must be at most ${max}.`;
    }
  }

  return null;
}

/**
 * Validates an entire value bag against a set, returning a `code → message` map
 * of only the fields that failed (empty map = all valid).
 */
export function validateAttributeValues(
  set: AttributeSet,
  values: AttributeValues,
): AttributeErrors {
  const errors: AttributeErrors = {};

  for (const group of set.groups) {
    for (const attribute of group.attributes) {
      const error = validateAttribute(attribute, values[attribute.code]);

      if (error) {
        errors[attribute.code] = error;
      }
    }
  }

  return errors;
}

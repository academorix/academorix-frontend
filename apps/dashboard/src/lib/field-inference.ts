/**
 * @file field-inference.ts
 * @module lib/field-inference
 *
 * @description
 * When a module doesn't declare `meta.formFields`, we auto-derive a workable
 * schema from a sample row so create/edit still renders sane inputs. This is
 * a fallback — modules that need domain-specific fields (currency, phone,
 * date, select with options) should declare `formFields` explicitly.
 */

import type { FieldSchema } from "@/lib/module";

const HIDDEN_FIELDS = new Set(["id", "createdAt", "updatedAt", "created_at", "updated_at"]);

const OBJECT_TEXT_KEYS = ["text", "name", "title", "label"] as const;

function humanize(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function pickObjectDefault(value: Record<string, unknown>): unknown {
  for (const key of OBJECT_TEXT_KEYS) {
    if (key in value) return value[key];
  }

  return value;
}

/** Derive a field schema from a sample record. */
export function inferFieldSchema(sample: Record<string, unknown> | undefined): FieldSchema[] {
  if (!sample) return [];
  const fields: FieldSchema[] = [];

  for (const [key, value] of Object.entries(sample)) {
    if (HIDDEN_FIELDS.has(key)) continue;

    const label = humanize(key);

    if (typeof value === "boolean") {
      fields.push({ name: key, label, kind: "switch", defaultValue: value, colSpan: 1 });
      continue;
    }

    if (typeof value === "number") {
      fields.push({ name: key, label, kind: "number", defaultValue: value, colSpan: 1 });
      continue;
    }

    if (Array.isArray(value)) {
      // Skip arrays in the inferred form — the module should declare a proper editor.
      continue;
    }

    if (value && typeof value === "object") {
      // Flatten to the object's canonical text field.
      const derived = pickObjectDefault(value as Record<string, unknown>);

      fields.push({
        name: OBJECT_TEXT_KEYS.some((k) => k in (value as Record<string, unknown>))
          ? `${key}.${OBJECT_TEXT_KEYS.find((k) => k in (value as Record<string, unknown>))}`
          : key,
        label,
        kind: "text",
        defaultValue: derived,
        colSpan: 1,
      });
      continue;
    }

    if (typeof value === "string") {
      const isLong = value.length > 80;
      const isEmail = /@/.test(value) && /\./.test(value);
      const isDate = /^\d{4}-\d{2}-\d{2}/.test(value);

      fields.push({
        name: key,
        label,
        kind: isDate ? "date" : isEmail ? "email" : isLong ? "textarea" : "text",
        defaultValue: value,
        colSpan: isLong ? 2 : 1,
      });
      continue;
    }
  }

  return fields;
}

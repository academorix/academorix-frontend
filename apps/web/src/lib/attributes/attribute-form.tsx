/**
 * @file attribute-form.tsx
 * @module lib/attributes/attribute-form
 *
 * @description
 * Renders an entire {@link AttributeSet} as a controlled form: groups become
 * labelled sections and each attribute becomes an
 * {@link "@/lib/attributes/attribute-field".AttributeField}. The parent owns the
 * value bag (mirroring the host record's `attributes`); this component reports
 * changes and displays per-field validation errors.
 */

import type {
  AttributeErrors,
  AttributeLocale,
  AttributeValues,
} from "@/lib/attributes/attribute.types";
import type { AttributeSet } from "@/types";
import type { ReactNode } from "react";

import { AttributeField } from "@/lib/attributes/attribute-field";
import { localize } from "@/lib/attributes/attribute-values";

/** Props for {@link AttributeForm}. */
interface AttributeFormProps {
  /** The attribute set defining the fields to render. */
  set: AttributeSet;
  /** The current value bag (host record's `attributes`). */
  value: AttributeValues;
  /** Called with the next value bag when any field changes. */
  onChange: (next: AttributeValues) => void;
  /** Per-field validation errors keyed by attribute code. */
  errors?: AttributeErrors;
  /** Label locale (RTL-aware); defaults to English. */
  locale?: AttributeLocale;
  /** Whether the whole form is read-only. */
  isReadOnly?: boolean;
}

/**
 * Renders the set's groups and fields into a controlled attribute form.
 *
 * @param props - The set, value bag, change handler, and optional errors.
 */
export function AttributeForm({
  set,
  value,
  onChange,
  errors,
  locale = "en",
  isReadOnly = false,
}: AttributeFormProps): ReactNode {
  /** Updates one attribute and bubbles the new value bag up. */
  const setField = (code: string, next: unknown): void => {
    onChange({ ...value, [code]: next });
  };

  // Groups and attributes are rendered in their declared order.
  const groups = [...set.groups].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const attributes = [...group.attributes].sort((a, b) => a.order - b.order);

        return (
          <section key={group.code} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
              {localize(group.label, locale)}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {attributes.map((attribute) => (
                <AttributeField
                  key={attribute.code}
                  attribute={attribute}
                  error={errors?.[attribute.code]}
                  isReadOnly={isReadOnly}
                  locale={locale}
                  value={value[attribute.code]}
                  onChange={(next) => setField(attribute.code, next)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

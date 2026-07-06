/**
 * @file attribute-view.tsx
 * @module lib/attributes/attribute-view
 *
 * @description
 * Read-only rendering of an {@link AttributeSet}'s values for detail/show pages
 * and cards. Booleans render as Yes/No, selects render their option label, and
 * empty values render as an em dash.
 */

import type { AttributeLocale, AttributeValues } from "@/lib/attributes/attribute.types";
import type { Attribute, AttributeSet } from "@/types";
import type { ReactNode } from "react";

import { localize } from "@/lib/attributes/attribute-values";

/** Props for {@link AttributeView}. */
interface AttributeViewProps {
  /** The attribute set describing the values. */
  set: AttributeSet;
  /** The value bag to display (host record's `attributes`). */
  value: AttributeValues;
  /** Label locale (RTL-aware); defaults to English. */
  locale?: AttributeLocale;
}

/** Formats a single attribute value for display. */
function formatValue(attribute: Attribute, raw: unknown, locale: AttributeLocale): string {
  if (raw === null || raw === undefined || raw === "") {
    return "—";
  }

  if (attribute.type === "boolean") {
    return raw ? "Yes" : "No";
  }

  if (attribute.type === "select") {
    const option = attribute.options?.find((candidate) => candidate.value === raw);

    return option ? localize(option.label, locale) : String(raw);
  }

  return String(raw);
}

/**
 * Renders an attribute set's values as a read-only labelled grid, grouped.
 *
 * @param props - The set, the value bag, and optional locale.
 */
export function AttributeView({ set, value, locale = "en" }: AttributeViewProps): ReactNode {
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
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {attributes.map((attribute) => (
                <div key={attribute.code} className="flex flex-col gap-1">
                  <dt className="text-xs text-muted">{localize(attribute.label, locale)}</dt>
                  <dd className="text-sm text-foreground">
                    {formatValue(attribute, value[attribute.code], locale)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

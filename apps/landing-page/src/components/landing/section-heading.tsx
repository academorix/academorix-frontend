/**
 * @file section-heading.tsx
 * @module components/landing/section-heading
 *
 * @description
 * Shared, centered heading block used by the marketing sections. Standardises
 * the eyebrow → `<h2>` → description rhythm and wires the `<h2>` `id` used by
 * each section's `aria-labelledby`.
 */

import type { ReactNode } from "react";

/** Props for {@link SectionHeading}. */
interface SectionHeadingProps {
  /** DOM id applied to the `<h2>`; referenced by the section's `aria-labelledby`. */
  headingId: string;
  /** Small accent label rendered above the title. */
  eyebrow?: string;
  /** The section title (renders as `<h2>`). */
  title: string;
  /** Optional supporting sentence rendered below the title. */
  description?: string;
}

/** Renders a centered section heading (eyebrow, title, description). */
export function SectionHeading({
  headingId,
  eyebrow,
  title,
  description,
}: SectionHeadingProps): ReactNode {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-sm font-semibold tracking-wide text-accent uppercase">{eyebrow}</p>
      ) : null}
      <h2
        className="mt-3 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
        id={headingId}
      >
        {title}
      </h2>
      {description ? <p className="mt-4 text-lg text-pretty text-muted">{description}</p> : null}
    </div>
  );
}

/**
 * @file section-heading.tsx
 * @module components/marketing/section-heading
 *
 * @description
 * Compact `eyebrow / h2 / description` pattern that opens most
 * marketing sections. Rendering-only, server-safe.
 *
 * The eyebrow is uppercase and letter-spaced to feel like a category
 * label. The heading is balanced with `text-wrap: balance` so long
 * titles wrap cleanly on wide screens. The optional description sits
 * below in a muted tone.
 */

import clsx from "clsx";

import type { ReactNode } from "react";

/** Props for {@link SectionHeading}. */
export interface SectionHeadingProps {
  /** Small uppercase eyebrow ("Products", "Pricing", …). */
  eyebrow?: ReactNode;
  /** Main section heading. */
  title: ReactNode;
  /** Optional supporting sentence. */
  description?: ReactNode;
  /** Horizontal alignment. Defaults to centered. */
  align?: "left" | "center";
  /** Extra classes for the wrapper. */
  className?: string;
}

/** Common section header used across every marketing page. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={clsx(
        "flex max-w-3xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
        align === "left" && "items-start text-start",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-medium tracking-wider text-muted uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="text-base text-muted sm:text-lg">{description}</p> : null}
    </div>
  );
}

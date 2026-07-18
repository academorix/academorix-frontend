import type { ReactNode } from "react";

import { Button } from "@heroui/react";
import { Link as RouterLink } from "react-router";

import { useI18n } from "../../i18n";
import { Iconify } from "../../icons/iconify";

type SectionProps = {
  children: ReactNode;
  className?: string;
  muted?: boolean;
  id?: string;
  bordered?: boolean;
};

export function Section({ children, className, muted, id, bordered = true }: SectionProps) {
  return (
    <section
      id={id}
      className={
        (muted ? "bg-surface-secondary " : "") + (bordered ? "border-t border-border" : "")
      }
    >
      <div className={"mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-20 " + (className ?? "")}>
        {children}
      </div>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? (
        <p className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-lg text-muted">{description}</p> : null}
    </div>
  );
}

type CtaSectionProps = {
  title: string;
  description: string;
  /** Optional override — defaults to `common.startFreeTrial` from the dictionary. */
  primaryLabel?: string;
  primaryHref?: string;
  /** Optional override — defaults to `common.talkToSales` from the dictionary. */
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function CtaSection({
  title,
  description,
  primaryLabel,
  primaryHref = "/create-workspace",
  secondaryLabel,
  secondaryHref = "/contact-sales",
}: CtaSectionProps) {
  const { t } = useI18n();
  const primary = primaryLabel ?? t("common.startFreeTrial");
  const secondary = secondaryLabel ?? t("common.talkToSales");

  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-14 text-center text-background sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl"
        />
        <h2 className="font-display relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-lg text-background/70">{description}</p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            render={(props) => <RouterLink to={primaryHref} {...(props as object)} />}
            size="lg"
            variant="primary"
          >
            {primary}
            <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
          </Button>
          <Button
            className="border-background/30 text-background hover:bg-background/10"
            render={(props) => <RouterLink to={secondaryHref} {...(props as object)} />}
            size="lg"
            variant="outline"
          >
            {secondary}
          </Button>
        </div>
      </div>
    </Section>
  );
}

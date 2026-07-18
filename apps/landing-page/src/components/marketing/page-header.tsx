import type { ReactNode } from "react";

import { Breadcrumbs } from "@heroui/react";
import { Link as RouterLink } from "react-router";

export type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  align?: "left" | "center";
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs,
  align = "left",
  children,
}: PageHeaderProps) {
  const centered = align === "center";

  return (
    <section className="border-b border-border bg-surface-secondary/60">
      <div
        className={
          "mx-auto max-w-6xl px-5 pt-12 pb-14 sm:px-6 lg:pt-16 " + (centered ? "text-center" : "")
        }
      >
        {crumbs && crumbs.length > 0 ? (
          <Breadcrumbs className={"mb-6 text-sm " + (centered ? "justify-center" : "")}>
            {crumbs.map((crumb) =>
              crumb.href ? (
                <Breadcrumbs.Item
                  key={crumb.label}
                  render={(props) => <RouterLink to={crumb.href!} {...(props as object)} />}
                >
                  {crumb.label}
                </Breadcrumbs.Item>
              ) : (
                <Breadcrumbs.Item key={crumb.label}>{crumb.label}</Breadcrumbs.Item>
              ),
            )}
          </Breadcrumbs>
        ) : null}

        {eyebrow ? (
          <p
            className={
              "inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground " +
              (centered ? "mx-auto" : "")
            }
          >
            {eyebrow}
          </p>
        ) : null}

        <h1
          className={
            "font-display mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl " +
            (centered ? "mx-auto max-w-3xl" : "max-w-3xl")
          }
        >
          {title}
        </h1>

        {description ? (
          <p
            className={
              "mt-4 text-lg leading-relaxed text-muted " +
              (centered ? "mx-auto max-w-2xl" : "max-w-2xl")
            }
          >
            {description}
          </p>
        ) : null}

        {children ? (
          <div className={"mt-7 " + (centered ? "flex justify-center" : "")}>{children}</div>
        ) : null}
      </div>
    </section>
  );
}

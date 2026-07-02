/**
 * @file show.tsx
 * @module modules/public-site/pages/show
 *
 * @description
 * Public page detail — slug, template, publication status, home flag, and last
 * editor for a single CMS page.
 */

import { Card, Chip, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { PublicPage, PublicPageStatus } from "@/modules/public-site/public-site.types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { PUBLIC_PAGE_STATUS_LABELS } from "@/modules/public-site/public-site.types";

/** Maps page status to a semantic Chip color. */
const STATUS_COLOR: Record<PublicPageStatus, "success" | "warning" | "default"> = {
  published: "success",
  draft: "default",
  scheduled: "warning",
};

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The public page detail page. */
export default function PublicSiteShow(): ReactNode {
  const { result: page, query } = useShow<PublicPage>({ resource: "public-site" });

  if (query.isLoading || !page) {
    return (
      <ShowView resource="public-site">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="public-site">
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between gap-2">
            <Card.Title>{page.title}</Card.Title>
            <Chip color={STATUS_COLOR[page.status]} size="sm" variant="soft">
              {PUBLIC_PAGE_STATUS_LABELS[page.status]}
            </Chip>
          </div>
          <Card.Description>/{page.slug}</Card.Description>
        </Card.Header>
        <Card.Content>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Slug">/{page.slug}</Field>
            <Field label="Template">{page.template}</Field>
            <Field label="Status">{PUBLIC_PAGE_STATUS_LABELS[page.status]}</Field>
            <Field label="Home page">{page.is_home ? "Yes" : "No"}</Field>
            <Field label="Last edited by">{page.updated_by ?? "—"}</Field>
          </dl>
        </Card.Content>
      </Card>
    </ShowView>
  );
}

/**
 * @file list.tsx
 * @module modules/public-site/pages/list
 *
 * @description
 * Public-site CMS list — the marketing pages a tenant publishes, with title,
 * slug, template, and publication status.
 */

import { Chip } from "@academorix/ui/react";
import { useMemo } from "react";

import type { PublicPage, PublicPageStatus } from "@/modules/public-site/public-site.types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { PUBLIC_PAGE_STATUS_LABELS } from "@/modules/public-site/public-site.types";

/** Maps page status to a semantic Chip color. */
const STATUS_COLOR: Record<PublicPageStatus, "success" | "warning" | "default"> = {
  published: "success",
  draft: "default",
  scheduled: "warning",
};

/** The public-site CMS list page. */
export default function PublicSiteList(): ReactNode {
  const columns = useMemo<DataGridColumn<PublicPage>[]>(
    () => [
      {
        id: "title",
        header: "Page",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 200,
        cell: (page) => <span className="font-medium">{page.title}</span>,
      },
      { id: "slug", header: "Slug", cell: (page) => `/${page.slug}` },
      { id: "template", header: "Template", allowsSorting: true, cell: (page) => page.template },
      {
        id: "status",
        header: "Status",
        allowsSorting: true,
        cell: (page) => (
          <Chip color={STATUS_COLOR[page.status]} size="sm" variant="soft">
            {PUBLIC_PAGE_STATUS_LABELS[page.status]}
          </Chip>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (page) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View page"
              recordItemId={page.id}
              resource="public-site"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <ListView resource="public-site">
      <ResourceDataGrid<PublicPage>
        ariaLabel="Public site pages"
        columns={columns}
        contentClassName="min-w-[600px]"
        initialSorters={[{ field: "title", order: "asc" }]}
        resource="public-site"
      />
    </ListView>
  );
}

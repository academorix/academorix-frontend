/**
 * @file list.tsx
 * @module modules/announcements/pages/list
 *
 * @description
 * Announcements list (scoped by branch) — broadcasts with audience, status, and
 * publish date. Per-row show/edit/delete actions.
 */

import { Chip } from "@academorix/ui/react";

import type { Announcement } from "@/modules/announcements/announcements.types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { formatDate } from "@/lib/format";

/** DataGrid columns for the announcements list. */
const COLUMNS: DataGridColumn<Announcement>[] = [
  {
    id: "title",
    header: "Title",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 240,
    cell: (announcement) => <span className="font-medium">{announcement.title}</span>,
  },
  { id: "audience", header: "Audience", cell: (announcement) => announcement.audience },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (announcement) =>
      announcement.status === "published" ? (
        <Chip color="success" size="sm" variant="soft">
          Published
        </Chip>
      ) : (
        <Chip size="sm" variant="soft">
          Draft
        </Chip>
      ),
  },
  {
    id: "published_at",
    header: "Published",
    allowsSorting: true,
    cell: (announcement) => formatDate(announcement.published_at),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (announcement) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View announcement"
          recordItemId={announcement.id}
          resource="announcements"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit announcement"
          recordItemId={announcement.id}
          resource="announcements"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete announcement"
          recordItemId={announcement.id}
          resource="announcements"
          size="sm"
        />
      </div>
    ),
  },
];

/** The announcements list page. */
export default function AnnouncementList(): ReactNode {
  return (
    <ListView resource="announcements">
      <ResourceDataGrid<Announcement>
        ariaLabel="Announcements"
        columns={COLUMNS}
        contentClassName="min-w-[720px]"
        initialSorters={[{ field: "published_at", order: "desc" }]}
        resource="announcements"
      />
    </ListView>
  );
}

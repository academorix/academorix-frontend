/**
 * @file show-view.tsx
 * @module components/refine/views/show-view
 *
 * @description
 * Page scaffold for a resource's detail (show) screen: breadcrumbs, a back
 * button, a singular title, and `Edit` / `Clone` / `Delete` / `Refresh` / `List`
 * actions on the record. The action buttons default to the route's resource +
 * `:id`.
 */

import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import {
  CloneButton,
  DeleteButton,
  EditButton,
  ListButton,
  RefreshButton,
} from "@/components/refine/buttons";
import { useResourceTitle, ViewHeader } from "@/components/refine/views/view-header";

/** Props for {@link ShowView}. */
interface ShowViewProps {
  /** The record detail content. */
  children: ReactNode;
  /** Resource override; defaults to the route's resource. */
  resource?: string;
  /** Explicit title override; defaults to the singular resource label. */
  title?: string;
  /** Extra actions rendered before the built-in ones. */
  headerActions?: ReactNode;
}

/**
 * Wraps a record detail view in the standard header (breadcrumbs + back +
 * title + edit/clone/delete/refresh/list).
 *
 * @param props - Content, optional resource/title overrides, and extra actions.
 */
export function ShowView({ children, resource, title, headerActions }: ShowViewProps): ReactNode {
  const resolvedTitle = useResourceTitle(resource, title, "singular");

  return (
    <div className="flex flex-col gap-6 p-6">
      <ViewHeader
        showBack
        actions={
          <>
            {headerActions}
            <EditButton resource={resource} />
            <CloneButton resource={resource} />
            <DeleteButton resource={resource} />
            <RefreshButton resource={resource} />
            <ListButton resource={resource} />
          </>
        }
        title={resolvedTitle}
      />
      <ResourceAccessGuard action="show" resource={resource}>
        {children}
      </ResourceAccessGuard>
    </div>
  );
}

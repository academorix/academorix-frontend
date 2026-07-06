/**
 * @file list-view.tsx
 * @module components/refine/views/list-view
 *
 * @description
 * Page scaffold for a resource's list screen: breadcrumbs, a plural title, a
 * `CreateButton` action, and the caller's content (typically a
 * {@link "@/components/refine/resource-data-grid" ResourceDataGrid}).
 */

import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import { CreateButton } from "@/components/refine/buttons";
import { useResourceTitle, ViewHeader } from "@/components/refine/views/view-header";

/** Props for {@link ListView}. */
interface ListViewProps {
  /** The list content (table/grid, filters, etc.). */
  children: ReactNode;
  /** Resource override; defaults to the route's resource. */
  resource?: string;
  /** Explicit title override; defaults to the tenant/plural resource label. */
  title?: string;
  /** Extra actions rendered before the create button. */
  headerActions?: ReactNode;
}

/**
 * Wraps a resource list in the standard header (breadcrumbs + title + create).
 *
 * @param props - Content, optional resource/title overrides, and extra actions.
 */
export function ListView({ children, resource, title, headerActions }: ListViewProps): ReactNode {
  const resolvedTitle = useResourceTitle(resource, title, "plural");

  return (
    <div className="flex flex-col gap-6 p-6">
      <ViewHeader
        actions={
          <>
            {headerActions}
            <CreateButton resource={resource} />
          </>
        }
        title={resolvedTitle}
      />
      <ResourceAccessGuard action="list" resource={resource}>
        {children}
      </ResourceAccessGuard>
    </div>
  );
}

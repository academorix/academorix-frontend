/**
 * @file edit-view.tsx
 * @module components/refine/views/edit-view
 *
 * @description
 * Page scaffold for a resource's edit screen: breadcrumbs, a back button, a
 * singular title, and `Delete` / `Refresh` / `List` actions on the record.
 * The action buttons default to the route's resource + `:id`.
 */

import type { ReactNode } from "react";

import { DeleteButton, ListButton, RefreshButton } from "@/components/refine/buttons";
import { useResourceTitle, ViewHeader } from "@/components/refine/views/view-header";

/** Props for {@link EditView}. */
interface EditViewProps {
  /** The edit form content. */
  children: ReactNode;
  /** Resource override; defaults to the route's resource. */
  resource?: string;
  /** Explicit title override; defaults to `Edit <singular resource>`. */
  title?: string;
  /** Extra actions rendered before the built-in ones. */
  headerActions?: ReactNode;
}

/**
 * Wraps a resource edit form in the standard header (breadcrumbs + back +
 * title + delete/refresh/list).
 *
 * @param props - Content, optional resource/title overrides, and extra actions.
 */
export function EditView({ children, resource, title, headerActions }: EditViewProps): ReactNode {
  const singular = useResourceTitle(resource, undefined, "singular");
  const resolvedTitle = title ?? `Edit ${singular}`;

  return (
    <div className="flex flex-col gap-6 p-6">
      <ViewHeader
        showBack
        actions={
          <>
            {headerActions}
            <DeleteButton resource={resource} />
            <RefreshButton resource={resource} />
            <ListButton resource={resource} />
          </>
        }
        title={resolvedTitle}
      />
      {children}
    </div>
  );
}

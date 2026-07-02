/**
 * @file create-view.tsx
 * @module components/refine/views/create-view
 *
 * @description
 * Page scaffold for a resource's create screen: breadcrumbs, a back button, a
 * singular title, a `ListButton` action, and the caller's form content.
 */

import type { ReactNode } from "react";

import { ListButton } from "@/components/refine/buttons";
import { useResourceTitle, ViewHeader } from "@/components/refine/views/view-header";

/** Props for {@link CreateView}. */
interface CreateViewProps {
  /** The create form content. */
  children: ReactNode;
  /** Resource override; defaults to the route's resource. */
  resource?: string;
  /** Explicit title override; defaults to `Create <singular resource>`. */
  title?: string;
  /** Extra actions rendered before the list button. */
  headerActions?: ReactNode;
}

/**
 * Wraps a resource create form in the standard header (breadcrumbs + back +
 * title + list).
 *
 * @param props - Content, optional resource/title overrides, and extra actions.
 */
export function CreateView({
  children,
  resource,
  title,
  headerActions,
}: CreateViewProps): ReactNode {
  const singular = useResourceTitle(resource, undefined, "singular");
  const resolvedTitle = title ?? `Create ${singular}`;

  return (
    <div className="flex flex-col gap-6 p-6">
      <ViewHeader
        showBack
        actions={
          <>
            {headerActions}
            <ListButton resource={resource} />
          </>
        }
        title={resolvedTitle}
      />
      {children}
    </div>
  );
}

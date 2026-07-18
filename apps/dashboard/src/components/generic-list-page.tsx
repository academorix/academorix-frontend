/**
 * @file generic-list-page.tsx
 * @module components/generic-list-page
 *
 * @description
 * A drop-in listing page for any resource. Reads the resource's meta to
 * hydrate the header (label, description, singular label) and feeds
 * `ResourceGrid` with the default row / bulk actions merged with any
 * module-declared overrides — respecting the resource's declared CRUD level
 * so we don't show Edit / Delete on read-only surfaces.
 */

import { Button } from "@heroui/react";
import { useNavigation } from "@refinedev/core";

import type { AppResourceBulkAction, AppResourceRowAction } from "@/lib/module";
import type { BaseRecord } from "@refinedev/core";

import { PageHeader } from "@/components/page-header";
import { ResourceGrid } from "@/components/resource-grid";
import { Iconify } from "@/icons/iconify";
import { singularize } from "@/lib/singularize";
import { getResourceColumns } from "@/modules/columns";
import {
  defaultBulkActions,
  defaultRowActions,
  mergeBulkActions,
  mergeRowActions,
} from "@/modules/default-actions";
import { appResources } from "@/modules/registry";

type GenericListPageProps = {
  description?: string;
  icon?: string;
  resource: string;
  title: string;
};

/** Filter default row / bulk actions to the ones this CRUD level supports. */
function filterActionsByCrud<T extends { intent?: string }>(actions: T[], crud: string): T[] {
  return actions.filter((action) => {
    if (crud === "full") return true;
    if (crud === "read-only") return action.intent === "view" || action.intent === "export";
    // list-only / none — only export makes sense
    return action.intent === "export";
  });
}

export function GenericListPage({ description, icon, resource, title }: GenericListPageProps) {
  const { create: navCreate } = useNavigation();
  const { columns, contentClassName } = getResourceColumns(resource);
  const meta = appResources.find((r) => r.name === resource)?.meta;
  const singular = meta?.singularLabel ?? singularize(title);
  const crud = meta?.crud ?? "list-only";
  const canCreate = crud === "full";

  const rowActions = meta?.suppressDefaultActions
    ? ((meta?.rowActions ?? []) as AppResourceRowAction<BaseRecord>[])
    : (mergeRowActions(
        filterActionsByCrud(defaultRowActions(title), crud),
        meta?.rowActions,
      ) as AppResourceRowAction<BaseRecord>[]);

  const bulkActions = meta?.suppressDefaultActions
    ? ((meta?.bulkActions ?? []) as AppResourceBulkAction<BaseRecord>[])
    : (mergeBulkActions(
        filterActionsByCrud(defaultBulkActions(title), crud),
        meta?.bulkActions,
      ) as AppResourceBulkAction<BaseRecord>[]);

  const emptyState = meta?.emptyState;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          canCreate ? (
            <Button onPress={() => navCreate(resource)} variant="primary">
              <Iconify className="size-4" icon="plus" />
              New {singular.toLowerCase()}
            </Button>
          ) : null
        }
        description={description ?? meta?.description}
        title={title}
      />
      <ResourceGrid<BaseRecord>
        ariaLabel={title}
        bulkActions={bulkActions}
        columns={columns}
        contentClassName={contentClassName}
        emptyActionLabel={
          emptyState?.actionLabel ?? (canCreate ? `New ${singular.toLowerCase()}` : undefined)
        }
        emptyActionRoute={emptyState?.actionRoute}
        emptyDescription={emptyState?.description}
        emptyIcon={icon ?? "database"}
        emptyTitle={emptyState?.title ?? `No ${title.toLowerCase()} yet`}
        filterChips={meta?.filterChips}
        initialSorters={[{ field: "id", order: "desc" }]}
        resource={resource}
        rowActions={rowActions}
        savedViews={meta?.savedViews}
        searchFields={meta?.searchFields}
        searchPlaceholder={meta?.searchPlaceholder}
        virtualized={meta?.virtualized}
        virtualizedHeaderHeight={meta?.virtualizedHeaderHeight}
        virtualizedRowHeight={meta?.virtualizedRowHeight}
      />
    </div>
  );
}

export default GenericListPage;

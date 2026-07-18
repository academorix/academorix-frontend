/**
 * @file default-actions.ts
 * @module modules/default-actions
 *
 * @description
 * The canonical row + bulk action set every listing gets for free. Each
 * action is *declarative* (via an `intent`) — `ResourceGrid` dispatches them
 * through Refine hooks (`useDelete`, `useCreate`, `useUpdate`), so a module
 * gets full View / Edit / Duplicate / Delete / Export / Archive behaviour
 * without wiring any callbacks.
 *
 * Modules override or extend by declaring `meta.rowActions` /
 * `meta.bulkActions` on the resource. Set `meta.suppressDefaultActions: true`
 * to opt out of the defaults entirely.
 */

import type { AppResourceBulkAction, AppResourceRowAction } from "@/lib/module";

import { singularize } from "@/lib/singularize";

/** Default row overflow-menu items — View, Edit, Duplicate, Delete. */
export function defaultRowActions(pluralLabel: string): AppResourceRowAction[] {
  const singular = singularize(pluralLabel).toLowerCase();

  return [
    {
      id: "view",
      intent: "view",
      label: "View",
      icon: "eye",
    },
    {
      id: "edit",
      intent: "edit",
      label: "Edit",
      icon: "pencil",
    },
    {
      id: "duplicate",
      intent: "duplicate",
      label: "Duplicate",
      icon: "copy",
    },
    {
      id: "delete",
      intent: "delete",
      label: "Delete",
      icon: "trash-bin",
      variant: "danger",
      confirm: {
        title: `Delete ${singular}`,
        description: `This will permanently remove the ${singular} and detach any linked records. This action cannot be undone.`,
        confirmLabel: `Delete ${singular}`,
      },
    },
  ];
}

/** Default bulk ActionBar items — Edit, Export CSV, Archive, Delete. */
export function defaultBulkActions(pluralLabel: string): AppResourceBulkAction[] {
  const singular = singularize(pluralLabel).toLowerCase();

  return [
    {
      id: "edit",
      intent: "edit",
      label: "Edit",
      icon: "pencil",
    },
    {
      id: "export",
      intent: "export",
      label: "Export CSV",
      icon: "arrow-down-to-line",
    },
    {
      id: "archive",
      intent: "archive",
      label: "Archive",
      icon: "archive",
    },
    {
      id: "delete",
      intent: "delete",
      label: "Delete",
      icon: "trash-bin",
      variant: "danger",
      confirm: {
        title: `Delete selected ${pluralLabel.toLowerCase()}`,
        description: `This will permanently remove every selected ${singular}. Linked records will be detached. This action cannot be undone.`,
        confirmLabel: `Delete ${pluralLabel.toLowerCase()}`,
      },
    },
  ];
}

/**
 * Merge default actions with module-provided actions. Module actions win on
 * `id` collision — override the default `delete` verb by declaring one with
 * `id: "delete"` in your `meta.rowActions`.
 */
export function mergeRowActions(
  defaults: AppResourceRowAction[],
  overrides: AppResourceRowAction[] | undefined,
): AppResourceRowAction[] {
  if (!overrides?.length) return defaults;
  const seen = new Set<string>();
  const merged: AppResourceRowAction[] = [];

  for (const action of overrides) {
    merged.push(action);
    seen.add(action.id);
  }
  for (const action of defaults) {
    if (!seen.has(action.id)) merged.push(action);
  }

  return merged;
}

/** Merge default + module bulk actions. Same conflict-resolution as `mergeRowActions`. */
export function mergeBulkActions(
  defaults: AppResourceBulkAction[],
  overrides: AppResourceBulkAction[] | undefined,
): AppResourceBulkAction[] {
  if (!overrides?.length) return defaults;
  const seen = new Set<string>();
  const merged: AppResourceBulkAction[] = [];

  for (const action of overrides) {
    merged.push(action);
    seen.add(action.id);
  }
  for (const action of defaults) {
    if (!seen.has(action.id)) merged.push(action);
  }

  return merged;
}

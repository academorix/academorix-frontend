/**
 * @file view-header.tsx
 * @module components/refine/views/view-header
 *
 * @description
 * Shared header used by every CRUD view ({@link "@/components/refine/views"}):
 * a breadcrumb trail, an optional back button, the page title, and an actions
 * slot on the trailing edge. Also exports {@link useResourceTitle}, which
 * resolves a view's title from an explicit prop, the tenant's terminology, or a
 * user-friendly fallback derived from the resource name.
 */

import { ArrowLeftIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, Separator } from "@stackra/ui/react";
import { useBack, useResourceParams, useUserFriendlyName } from "@refinedev/core";

import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/refine/breadcrumbs";
import { useResourceLabel } from "@/lib/refine";

/** Grammatical number for a resolved resource title. */
type TitleForm = "singular" | "plural";

/**
 * Resolves the title for a CRUD view.
 *
 * Order of precedence: an explicit `title`, then the tenant terminology label
 * for the resource (e.g. an academy's "Students"), then a user-friendly name
 * derived from the resource identifier.
 *
 * @param resourceFromProps - Optional resource override.
 * @param titleFromProps - Optional explicit title (wins outright).
 * @param form - Whether to render the fallback as singular or plural.
 */
export function useResourceTitle(
  resourceFromProps: string | undefined,
  titleFromProps: string | undefined,
  form: TitleForm,
): string {
  const getUserFriendlyName = useUserFriendlyName();
  const { resource, identifier } = useResourceParams({ resource: resourceFromProps });

  const resourceName = identifier ?? resource?.name ?? "";
  const metaLabel = (resource?.meta?.label as string | undefined) ?? resourceName;
  const friendly = getUserFriendlyName(metaLabel, form);

  // Prefer an explicit title; otherwise the tenant terminology label, falling
  // back to the user-friendly resource name.
  const terminologyLabel = useResourceLabel(resourceName, friendly);

  return titleFromProps ?? terminologyLabel;
}

/** Props for {@link ViewHeader}. */
interface ViewHeaderProps {
  /** The resolved page title. */
  title: ReactNode;
  /** Whether to show a back button before the title. */
  showBack?: boolean;
  /** Action buttons rendered on the trailing edge. */
  actions?: ReactNode;
}

/**
 * Renders the breadcrumb row plus a title/actions bar shared by all CRUD views.
 *
 * @param props - Title, back-button toggle, and trailing actions.
 */
export function ViewHeader({ title, showBack = false, actions }: ViewHeaderProps): ReactNode {
  const back = useBack();

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs />
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              isIconOnly
              aria-label="Go back"
              size="sm"
              variant="ghost"
              onPress={() => back()}
            >
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

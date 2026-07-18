/**
 * @file refresh-button.tsx
 * @module components/refine/buttons/refresh-button
 *
 * @description
 * Re-fetches the current record via `useRefreshButton` (invalidates its query).
 * Not access-gated — refreshing data the user can already see is always safe.
 */

import { ArrowPathIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button } from "@stackra/ui/react";
import { useRefreshButton } from "@refinedev/core";

import type { ButtonPassthroughProps } from "@/components/refine/buttons/nav-button";
import type { BaseKey } from "@refinedev/core";
import type { ReactNode } from "react";

/** Props for {@link RefreshButton}. */
export interface RefreshButtonProps extends ButtonPassthroughProps {
  /** Resource name; defaults to the resource inferred from the route. */
  resource?: string;
  /** Record id to refresh; defaults to the `:id` route param. */
  recordItemId?: BaseKey;
  /** Target data provider name. */
  dataProviderName?: string;
  /** Extra params for the refetch. */
  meta?: Record<string, unknown>;
  /** Overrides the default icon + label content. */
  children?: ReactNode;
}

/**
 * A button that refetches the current record, spinning its icon while loading.
 *
 * @param props - Resource, record id, and HeroUI button passthrough props.
 */
export function RefreshButton({
  resource,
  recordItemId,
  dataProviderName,
  meta,
  children,
  ...buttonProps
}: RefreshButtonProps): ReactNode {
  const { onClick, label, loading } = useRefreshButton({
    resource,
    id: recordItemId,
    dataProviderName,
    meta,
  });

  return (
    <Button variant="secondary" {...buttonProps} onPress={() => onClick()}>
      {children ?? (
        <>
          <ArrowPathIcon
            aria-hidden="true"
            className={loading ? "size-4 animate-spin" : "size-4"}
          />
          {buttonProps.isIconOnly ? null : label}
        </>
      )}
    </Button>
  );
}

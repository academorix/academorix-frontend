/**
 * @file listing-toolbar.tsx
 * @module components/refine/listing-toolbar
 *
 * @description
 * Composite that renders the canonical listing toolbar defined in
 * `DASHBOARD_UX_PLAN.md` §5.1. Modules pass the search value, filter
 * dropdowns, sort trigger, and column-visibility trigger; the composite lays
 * them out in the standard order (search on the left, controls on the right,
 * with a middle divider on wider viewports).
 *
 * Every slot is optional so early-migration modules can adopt the pattern
 * incrementally.
 */

import { MagnifyingGlassIcon } from "@academorix/ui/icons/outline";
import { Input, SearchField } from "@academorix/ui/react";

import type { ReactNode } from "react";

/** Props for {@link ListingToolbar}. */
export interface ListingToolbarProps {
  /** Current search-input value. Passing `undefined` hides the search field. */
  searchValue?: string;
  /** Search-input placeholder. Defaults to `"Search..."`. */
  searchPlaceholder?: string;
  /** Called when the search input changes. Consumers debounce as needed. */
  onSearchChange?: (value: string) => void;
  /**
   * Filter trigger nodes (typically `<Dropdown>` groups with a `Button`
   * trigger). Rendered left-of-centre with a `Filter` icon inside each.
   */
  filters?: ReactNode;
  /** Optional sort dropdown trigger. */
  sort?: ReactNode;
  /** Optional column-visibility dropdown trigger. */
  columns?: ReactNode;
  /** Optional trailing slot (typically an "Export CSV" button). */
  trailing?: ReactNode;
}

/**
 * Renders the standard toolbar row above the DataGrid. The layout wraps on
 * narrow viewports so the search field stays usable on tablet.
 */
export function ListingToolbar({
  searchValue,
  searchPlaceholder = "Search...",
  onSearchChange,
  filters,
  sort,
  columns,
  trailing,
}: ListingToolbarProps): ReactNode {
  const hasSearch = typeof searchValue === "string" && typeof onSearchChange === "function";
  const hasTrailing = Boolean(trailing);
  const hasControls = Boolean(filters || sort || columns);

  if (!hasSearch && !hasControls && !hasTrailing) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2">
      {hasSearch ? (
        <SearchField
          aria-label="Search"
          className="w-full flex-1 sm:w-auto sm:min-w-[220px]"
          value={searchValue}
          onChange={onSearchChange}
        >
          <SearchField.Group>
            <MagnifyingGlassIcon aria-hidden="true" className="ms-2 size-4 shrink-0 text-muted" />
            <Input placeholder={searchPlaceholder} />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      ) : null}

      {hasControls ? (
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          {sort}
          {columns}
        </div>
      ) : null}

      {hasTrailing ? <div className="ms-auto flex items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

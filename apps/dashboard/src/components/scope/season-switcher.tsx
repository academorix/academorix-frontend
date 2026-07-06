/**
 * @file season-switcher.tsx
 * @module components/scope/season-switcher
 *
 * @description
 * Switches the active season. Season options carry a status; the label appends a
 * marker for the current season so operators can tell "this year" apart from
 * upcoming/closed ones. Renders read-only when only one season is available.
 */

import { CalendarDaysIcon } from "@academorix/ui/icons/outline";

import type { ReactNode } from "react";

import { ScopeSelect } from "@/components/scope/scope-select";
import { useScope } from "@/lib/scope";

/** The active-season switcher for the app shell. */
export function SeasonSwitcher(): ReactNode {
  const { scope, allowed, setSeason } = useScope();

  return (
    <ScopeSelect
      ariaLabel="Season"
      icon={CalendarDaysIcon}
      options={allowed.seasons.map((season) => ({
        id: season.id,
        // Mark the current season so it's distinguishable in the list.
        name: season.is_current ? `${season.name} (current)` : season.name,
      }))}
      value={scope.seasonId}
      onChange={setSeason}
    />
  );
}

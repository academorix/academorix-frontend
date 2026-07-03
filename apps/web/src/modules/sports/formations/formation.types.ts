/**
 * @file formation.types.ts
 * @module modules/sports/formations/formation.types
 *
 * @description
 * Module-local shapes for **tactical formations** — a named shape (e.g. 4-3-3)
 * with positioned player slots plotted on a normalized pitch. Kept local because
 * formations are a tactics-specific projection not yet in the shared domain layer.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.7 "Formations & Tactics"
 */

import type { BaseModel, TenantScoped } from "@/types";

/**
 * One player position within a {@link Formation}. Coordinates are normalized
 * percentages on a portrait pitch: `x` runs 0 (left touchline) → 100 (right),
 * `y` runs 0 (own goal line) → 100 (opponent goal line).
 */
export interface FormationSlot {
  /** Stable id within the formation. */
  id: string;
  /** Position label, e.g. `"GK"`, `"LB"`, `"ST"`. */
  label: string;
  /** Horizontal placement, 0–100 (left → right). */
  x: number;
  /** Vertical placement, 0–100 (own goal → attack). */
  y: number;
}

/**
 * A **Formation** — a reusable tactical shape a coach can assign to a team.
 * Sport-agnostic via `sport_key` (though slot geometry is football-oriented in
 * the demo fixtures).
 */
export interface Formation extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  sport_key: string;
  /** Team this formation is tied to, or `null` for a shared template. */
  team_id: string | null;
  name: string;
  /** Shorthand shape, e.g. `"4-3-3"`. */
  shape: string;
  /** Positioned player slots. */
  slots: FormationSlot[];
  /** Optional coaching note. */
  note: string | null;
}

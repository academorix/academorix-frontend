/**
 * @file sports.ts
 * @module types/sports
 *
 * @description
 * The **sport registry** shapes — the agnostic core that lets one codebase serve
 * every sport. A `Sport` is the platform-level definition (scoring strategy,
 * roster rules, terminology); a `TenantSport` is a tenant's opt-in overlay
 * (enable/disable + terminology/config overrides).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §11.1 "Sport Registry"
 */

import type { BaseModel, TenantScoped } from "@/types/base";
import type { EntityStatus, ScoringType } from "@/types/enums";

/** Broad classification of a sport, used for grouping and defaults. */
export type SportCategory = "team" | "individual" | "combat" | "racket" | "aquatic";

/**
 * A platform-level sport definition. The `key` (`sport_key`) is the
 * discriminator that selects scoring strategies and attribute sets throughout
 * the app.
 */
export interface Sport extends BaseModel {
  /** Stable discriminator, e.g. `"football"`. */
  key: string;
  /** Display name, e.g. `"Football"`. */
  name: string;
  category: SportCategory;
  /** Whether the sport is played in teams (vs individual). */
  is_team_sport: boolean;
  /** How results are computed and points awarded. */
  scoring_type: ScoringType;
  /** Default roster/squad size (0 for individual sports). */
  default_team_size: number;
  /**
   * Sport terminology overrides keyed by generic term, e.g.
   * `{ "athlete": "Player", "match": "Match" }`.
   */
  terminology: Record<string, string>;
  status: EntityStatus;
}

/**
 * A tenant's overlay on a platform {@link Sport}: whether it's enabled for the
 * tenant, plus tenant-specific terminology/config overrides.
 */
export interface TenantSport extends BaseModel, TenantScoped {
  /** The platform sport this overlay applies to. */
  sport_key: string;
  /** Whether the sport is offered by this tenant. */
  is_enabled: boolean;
  /** Tenant terminology overrides (merged over the sport's defaults). */
  terminology: Record<string, string>;
}

/**
 * @file development.ts
 * @module types/development
 *
 * @description
 * Athlete-development shapes: progress/skill cards, performance tests, medical
 * records, drills, and awards. Progress and performance are **attribute hosts**
 * (their fields vary per sport, SDUI-rendered); medical is sensitive and
 * access-restricted.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14 "Development"
 */

import type { AttributeHost, BaseModel, TenantScoped } from "@/types/base";
import type { SkillLevel } from "@/types/enums";

/**
 * A **Progress / skill card** snapshot for an athlete enrollment. The card face
 * and attributes (radar stats, FIFA-style values) are sport-/tenant-specific and
 * live in `attributes` (mechanism #3). Also hosts belt/grading results.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.1 "Progress & Skill Cards"
 */
export interface Progress extends BaseModel, TenantScoped, AttributeHost {
  athlete_id: string;
  enrollment_id: string;
  sport_key: string;
  /** Coaching staff who recorded the assessment. */
  assessor_id: string | null;
  /** Overall level at assessment time. */
  level: SkillLevel | null;
  /** ISO-8601 assessment date. */
  assessed_at: string;
  /** Attribute-set version this snapshot was recorded against (for replay). */
  attribute_set_version: number;
  /** Free-text coach note. */
  note: string | null;
}

/**
 * A **Performance / fitness test** result. Test batteries (40m sprint, VO2, …)
 * are tenant-defined attribute sets, so measured fields live in `attributes`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.2 "Performance & Fitness Testing"
 */
export interface PerformanceTest extends BaseModel, TenantScoped, AttributeHost {
  athlete_id: string;
  enrollment_id: string | null;
  sport_key: string;
  /** Battery/test name, e.g. `"Pre-season fitness"`. */
  battery: string;
  assessor_id: string | null;
  /** ISO-8601 test date. */
  tested_at: string;
  attribute_set_version: number;
}

/**
 * A **Medical & clearance** record for an athlete. Sensitive: gated behind the
 * `medical` role; access-restricted in the UI.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.3 "Medical & Clearance"
 */
export interface MedicalRecord extends BaseModel, TenantScoped {
  athlete_id: string;
  /** Record kind, e.g. `"clearance"`, `"injury"`, `"allergy"`. */
  type: string;
  /** Whether the athlete is currently medically cleared to participate. */
  is_cleared: boolean;
  /** ISO-8601 clearance expiry, or `null`. */
  cleared_until: string | null;
  /** Restricted clinical summary. */
  summary: string | null;
  /** Recording clinician/staff id. */
  recorded_by: string | null;
  /** ISO-8601 record date. */
  recorded_at: string;
}

/**
 * A reusable **Drill** in the curriculum library, tagged by sport and skills it
 * develops. Used to compose training sessions.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.5 "Drill Library & Curriculum"
 */
export interface Drill extends BaseModel, TenantScoped {
  sport_key: string;
  name: string;
  description: string;
  /** Skills/tags this drill develops, e.g. `["passing","control"]`. */
  tags: string[];
  level: SkillLevel;
  /** Suggested duration in minutes. */
  duration_minutes: number;
  /** Optional reference to a video/document in the Documents module. */
  media_document_id: string | null;
}

/**
 * An **Award / certificate** granted to an athlete (auto or manual).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.7 "Awards & Certificates"
 */
export interface Award extends BaseModel, TenantScoped {
  athlete_id: string;
  /** Award kind, e.g. `"player_of_the_month"`, `"belt_promotion"`. */
  type: string;
  title: string;
  description: string | null;
  /** ISO-8601 date the award was granted. */
  granted_at: string;
  /** Optional certificate document reference. */
  certificate_document_id: string | null;
}

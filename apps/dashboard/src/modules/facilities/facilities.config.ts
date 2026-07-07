/**
 * @file facilities.config.ts
 * @module modules/facilities/facilities.config
 *
 * @description
 * Visual + presentational config for the Facilities module: the icon glyph
 * shown for each {@link FacilityType}, the semantic HeroUI Chip color used by
 * the type-chip component, sensible per-type capacity defaults (used to seed a
 * new facility on the create form), and the semantic color used to render a
 * {@link BookingStatus} / {@link BookingPurpose}.
 *
 * Kept out of the `.types.ts` file because it depends on the icon component
 * type (a React runtime import) and the HeroUI Chip color union, whereas the
 * types file is intentionally runtime-free.
 */

import {
  AcademicCapIcon,
  BeakerIcon,
  ClockIcon,
  CubeIcon,
  FilmIcon,
  FlagIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
} from "@academorix/ui/icons/outline";

import type {
  BookingPurpose,
  BookingStatus,
  FacilityType,
} from "@/modules/facilities/facilities.types";
import type { IconType } from "@academorix/ui/icons";

/**
 * The semantic HeroUI Chip color palette the module renders against. Kept as
 * a named alias so the color record types below stay short and readable.
 */
export type ChipColor = "default" | "success" | "warning" | "danger";

/**
 * Icon component for each facility type. Chosen from the Heroicons outline set
 * shipped by `@academorix/ui/icons/outline`:
 *
 * - `pitch`  → `RectangleGroupIcon` (evokes a marked-out field grid)
 * - `pool`   → `BeakerIcon`         (water-container fallback; heroicons has
 *                                    no dedicated pool glyph)
 * - `court`  → `Squares2X2Icon`     (grid of quadrants)
 * - `gym`    → `CubeIcon`           (weight/equipment fallback)
 * - `studio` → `FilmIcon`           (reel — used for dance/gym/media studios)
 * - `classroom` → `AcademicCapIcon` (learning space)
 * - `track`  → `FlagIcon`           (finish-line fallback)
 * - `equipment` → `WrenchScrewdriverIcon` (tool/equipment glyph)
 * - `other`  → `ClockIcon`          (neutral fallback — never overloaded)
 */
export const FACILITY_TYPE_ICON: Record<FacilityType, IconType> = {
  pitch: RectangleGroupIcon,
  pool: BeakerIcon,
  court: Squares2X2Icon,
  gym: CubeIcon,
  studio: FilmIcon,
  classroom: AcademicCapIcon,
  track: FlagIcon,
  equipment: WrenchScrewdriverIcon,
  other: ClockIcon,
};

/** Semantic color for the {@link FacilityType} chip. */
export const FACILITY_TYPE_COLOR: Record<FacilityType, ChipColor> = {
  pitch: "success",
  pool: "success",
  court: "warning",
  gym: "warning",
  studio: "default",
  classroom: "default",
  track: "success",
  equipment: "default",
  other: "default",
};

/**
 * Sensible per-type capacity defaults used to seed a new facility on the create
 * form. Chosen to match the shape of the fixture ("22 for a full-size pitch",
 * "12 for an indoor court", "18 for a 3-lane pool") so a newly-created record
 * feels immediately familiar.
 */
export const FACILITY_DEFAULT_CAPACITY: Record<FacilityType, number> = {
  pitch: 22,
  pool: 18,
  court: 12,
  gym: 30,
  studio: 20,
  classroom: 25,
  track: 20,
  equipment: 1,
  other: 10,
};

/**
 * Sensible per-type capacity-unit defaults ("players", "swimmers", "seats",
 * …). Used to seed the create form's optional `unit_of_capacity` field.
 */
export const FACILITY_DEFAULT_UNIT_OF_CAPACITY: Record<FacilityType, string> = {
  pitch: "players",
  pool: "swimmers",
  court: "players",
  gym: "people",
  studio: "people",
  classroom: "seats",
  track: "athletes",
  equipment: "units",
  other: "people",
};

/** Semantic color for the {@link BookingStatus} chip. */
export const BOOKING_STATUS_COLOR: Record<BookingStatus, ChipColor> = {
  pending: "warning",
  confirmed: "success",
  cancelled: "danger",
  blocked: "danger",
};

/** Semantic color for the {@link BookingPurpose} chip. */
export const BOOKING_PURPOSE_COLOR: Record<BookingPurpose, ChipColor> = {
  training: "success",
  match: "warning",
  session: "default",
  event: "success",
  blackout: "danger",
  maintenance: "danger",
  private_hire: "default",
};

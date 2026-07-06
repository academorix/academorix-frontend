/**
 * @file icon-registry.ts
 * @module lib/icon-registry
 *
 * @description
 * String-keyed registry that maps icon names in JSON fixtures to the actual
 * React icon components from `@academorix/ui/icons/outline`. JSON files can't
 * carry React nodes, so we encode icons as stable string keys ("UserGroupIcon",
 * "CreditCardIcon", …) and resolve them here at render time.
 *
 * ## Adding a new icon
 *
 *   1. Import it from `@academorix/ui/icons/outline` (or `/solid`).
 *   2. Add it to `ICON_REGISTRY` under its exact export name.
 *   3. Reference it from any `public/data/*.json` file by that string key.
 *
 * The `resolveIcon()` helper returns a safe fallback (`InformationCircleIcon`)
 * when a JSON fixture references an unknown key — avoids runtime crashes if a
 * data file ships ahead of the registry.
 */

import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  BeakerIcon,
  BellAlertIcon,
  BookOpenIcon,
  BoltIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentTextIcon,
  FlagIcon,
  GlobeAltIcon,
  HeartIcon,
  IdentificationIcon,
  InboxStackIcon,
  InformationCircleIcon,
  KeyIcon,
  LanguageIcon,
  MapIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PhoneIcon,
  PuzzlePieceIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from "@academorix/ui/icons/outline";

import type { IconType } from "@academorix/ui/icons";

/**
 * Every icon that can appear in a JSON fixture. Keys are the exact export
 * names from `@academorix/ui/icons/outline` so contributors don't have to
 * memorise a mapping.
 */
export const ICON_REGISTRY: Readonly<Record<string, IconType>> = {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  BeakerIcon,
  BellAlertIcon,
  BookOpenIcon,
  BoltIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentTextIcon,
  FlagIcon,
  GlobeAltIcon,
  HeartIcon,
  IdentificationIcon,
  InboxStackIcon,
  InformationCircleIcon,
  KeyIcon,
  LanguageIcon,
  MapIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PhoneIcon,
  PuzzlePieceIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
};

/** All valid icon keys — useful for build-time validation. */
export type IconKey = keyof typeof ICON_REGISTRY;

/**
 * Resolves an icon key from JSON to its React component. Falls back to
 * `InformationCircleIcon` when the key is unknown so the UI never crashes
 * — the fallback surfaces the missing-icon during design review.
 *
 * @param key - Icon export name (e.g. `"UserGroupIcon"`).
 */
export function resolveIcon(key: string): IconType {
  return ICON_REGISTRY[key] ?? InformationCircleIcon;
}

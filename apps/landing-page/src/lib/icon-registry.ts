/**
 * @file icon-registry.ts
 * @module lib/icon-registry
 *
 * @description
 * String-keyed registry that maps icon names in JSON fixtures to the actual
 * React icon components from `@stackra/ui/icons/heroicon/outline`. JSON files can't
 * carry React nodes, so we encode icons as stable string keys ("UserGroupIcon",
 * "CreditCardIcon", …) and resolve them here at render time.
 *
 * ## Adding a new icon
 *
 *   1. Import it from `@stackra/ui/icons/heroicon/outline` (or `/solid`).
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
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BeakerIcon,
  BellAlertIcon,
  BookOpenIcon,
  BoltIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CloudArrowUpIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  CubeTransparentIcon,
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  FlagIcon,
  GlobeAltIcon,
  GlobeAmericasIcon,
  HeartIcon,
  IdentificationIcon,
  InboxStackIcon,
  InformationCircleIcon,
  KeyIcon,
  LanguageIcon,
  LifebuoyIcon,
  LockClosedIcon,
  MapIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PhoneIcon,
  PresentationChartLineIcon,
  PuzzlePieceIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  RectangleStackIcon,
  ScaleIcon,
  ServerIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
  TrophyIcon,
  UserCircleIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from "@stackra/ui/icons/heroicon/outline";

import type { IconType } from "@stackra/ui/icons";

/**
 * Every icon that can appear in a JSON fixture. Keys are the exact export
 * names from `@stackra/ui/icons/heroicon/outline` so contributors don't have to
 * memorise a mapping.
 */
export const ICON_REGISTRY: Readonly<Record<string, IconType>> = {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BeakerIcon,
  BellAlertIcon,
  BookOpenIcon,
  BoltIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CloudArrowUpIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  CubeTransparentIcon,
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  FlagIcon,
  GlobeAltIcon,
  GlobeAmericasIcon,
  HeartIcon,
  IdentificationIcon,
  InboxStackIcon,
  InformationCircleIcon,
  KeyIcon,
  LanguageIcon,
  LifebuoyIcon,
  LockClosedIcon,
  MapIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PhoneIcon,
  PresentationChartLineIcon,
  PuzzlePieceIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  RectangleStackIcon,
  ScaleIcon,
  ServerIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
  TrophyIcon,
  UserCircleIcon,
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

/**
 * @file settings.sections.ts
 * @module modules/settings/settings.sections
 *
 * @description
 * The full sixteen-section catalogue for the Settings module. Consumed by the
 * secondary sidebar to render grouped nav items, by every section page to
 * read its own descriptor (title, description, icon), and by the module
 * manifest to build the URL map. Keeping this list in one place makes adding
 * a new section a single-file change: add a descriptor here, add its page,
 * and the sidebar picks it up automatically.
 */

import {
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  BellIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  GlobeAltIcon,
  KeyIcon,
  LanguageIcon,
  PaintBrushIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  TrophyIcon,
  WrenchScrewdriverIcon,
} from "@academorix/ui/icons/outline";

import type { SettingsSectionDescriptor } from "@/modules/settings/settings.types";

/** The complete section catalogue in canonical sidebar order. */
export const settingsSections: readonly SettingsSectionDescriptor[] = [
  {
    id: "general",
    label: "General",
    description: "Workspace name, timezone, week start, and default landing surface.",
    icon: AdjustmentsHorizontalIcon,
    group: "workspace",
    isAvailable: true,
  },
  {
    id: "branding",
    label: "Branding",
    description: "Logo, favicon, accent colour, and custom domain.",
    icon: PaintBrushIcon,
    group: "workspace",
    isAvailable: false,
  },
  {
    id: "locale",
    label: "Locale and region",
    description: "Default language, enabled languages, default timezone, and region hierarchy.",
    icon: GlobeAltIcon,
    group: "workspace",
    isAvailable: false,
  },
  {
    id: "language",
    label: "Language",
    description: "Per-tenant terminology overrides and RTL preview.",
    icon: LanguageIcon,
    group: "workspace",
    isAvailable: false,
  },
  {
    id: "currency",
    label: "Currency and tax",
    description: "Default currency, exchange rate provider, tax profiles, and rounding rules.",
    icon: BanknotesIcon,
    group: "workspace",
    isAvailable: false,
  },
  {
    id: "sports",
    label: "Sports catalogue",
    description: "Enabled sports, age groups, formats, and default pricing per sport.",
    icon: TrophyIcon,
    group: "operations",
    isAvailable: false,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Channels, quiet hours, and default preferences per event type.",
    icon: BellIcon,
    group: "operations",
    requiredPermission: "notifications.viewAny",
    isAvailable: false,
  },
  {
    id: "safeguarding",
    label: "Safeguarding",
    description: "Policy URL, escalation contacts, training cadence, and evidence retention.",
    icon: ShieldCheckIcon,
    group: "operations",
    requiredPermission: "safeguarding.viewAny",
    isAvailable: false,
  },
  {
    id: "attributes",
    label: "Attributes",
    description: "Custom attribute definitions and the resources they extend.",
    icon: AdjustmentsHorizontalIcon,
    group: "operations",
    isAvailable: false,
  },
  {
    id: "billing",
    label: "Billing and subscription",
    description: "Plan, seat count, payment method, and invoice history.",
    icon: CreditCardIcon,
    group: "money",
    requiredPermission: "view_billing",
    isAvailable: false,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Third-party connectors and OAuth reauthentication.",
    icon: PuzzlePieceIcon,
    group: "extend",
    isAvailable: false,
  },
  {
    id: "api-keys",
    label: "API keys",
    description: "Personal access tokens and service-account keys.",
    icon: KeyIcon,
    group: "extend",
    isAvailable: false,
  },
  {
    id: "webhooks",
    label: "Webhooks",
    description: "Registered webhooks, event subscriptions, and delivery status.",
    icon: BuildingLibraryIcon,
    group: "extend",
    isAvailable: false,
  },
  {
    id: "feature-flags",
    label: "Feature flags",
    description: "Per-tenant feature toggles and per-branch overrides.",
    icon: FlagIcon,
    group: "extend",
    isAvailable: false,
  },
  {
    id: "data",
    label: "Data and retention",
    description: "Retention windows, export tools, and backup schedule.",
    icon: ArchiveBoxIcon,
    group: "advanced",
    isAvailable: false,
  },
  {
    id: "danger",
    label: "Danger zone",
    description: "Transfer ownership, close workspace, purge retention window.",
    icon: ExclamationTriangleIcon,
    group: "danger",
    isAvailable: false,
  },
] as const;

/** Fast lookup for the section descriptor by id. */
export const settingsSectionsById = new Map<string, SettingsSectionDescriptor>(
  settingsSections.map((section) => [section.id, section]),
);

/** Human-readable label for each group. Rendered in the sidebar. */
export const SETTINGS_GROUP_LABEL: Record<string, string> = {
  workspace: "Workspace",
  operations: "Operations",
  money: "Money",
  extend: "Extend",
  advanced: "Advanced",
  danger: "Danger",
};

/** Canonical sidebar group order. */
export const SETTINGS_GROUP_ORDER: readonly string[] = [
  "workspace",
  "operations",
  "money",
  "extend",
  "advanced",
  "danger",
];

// Silence "unused" tree-shaking hint: WrenchScrewdriverIcon reserved for the
// Danger zone's per-action buttons in Phase 4b.
void WrenchScrewdriverIcon;

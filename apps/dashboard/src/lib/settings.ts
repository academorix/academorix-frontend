/**
 * @file settings.ts
 * @module lib/settings
 *
 * @description
 * The public contract for a setting field, re-exported here so the module
 * registry (`registry.ts`) can aggregate `AppModule.settings` without
 * pulling the whole settings module into the boot graph. Keep this file
 * dependency-free — types only.
 */

import type { SettingField } from "@/modules/settings/scope/types";

/**
 * A setting field contributed by a module manifest. Same shape as the
 * canonical `SettingField`, but with `owner` metadata that identifies the
 * contributing module — the settings backend uses this to attribute changes
 * and to render "provided by <module>" chips in the UI.
 */
export type ModuleSettingField = SettingField & {
  /** Module name that contributed this field. Filled in automatically by the registry. */
  owner?: string;
};

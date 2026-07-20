/**
 * @fileoverview Default command types shipped with the kbd module.
 *
 * Apps inherit these unless they override them by registering a type
 * with the same id. Adding new types is done through
 * `KbdModule.forFeature({ types })`.
 *
 * Labels and descriptions store i18n keys (not resolved values) because
 * this constant is evaluated at import time — before the DI container
 * and i18n system are bootstrapped. Components resolve the keys at
 * render time via `__()`.
 *
 * @module @stackra/kbd
 * @category Constants
 */

import type { CommandType } from "../interfaces/command-type.interface";

/**
 * Built-in command types. Order is preserved when the catalog renders
 * groups (lower `order` first).
 *
 * The `label` and `description` fields contain i18n keys that must be
 * resolved at render time via `__()` from `@stackra/i18n`.
 */
export const DEFAULT_COMMAND_TYPES: readonly CommandType[] = Object.freeze([
  {
    id: "navigation",
    label: "kbd.command_types.navigation_label",
    order: 10,
    color: "primary",
    description: "kbd.command_types.navigation_description",
  },
  {
    id: "action",
    label: "kbd.command_types.action_label",
    order: 20,
    color: "secondary",
    description: "kbd.command_types.action_description",
  },
  {
    id: "entity",
    label: "kbd.command_types.entity_label",
    order: 30,
    color: "tertiary",
    description: "kbd.command_types.entity_description",
  },
  {
    id: "setting",
    label: "kbd.command_types.setting_label",
    order: 40,
    color: "default",
    description: "kbd.command_types.setting_description",
  },
  {
    id: "tool",
    label: "kbd.command_types.tool_label",
    order: 50,
    color: "default",
    description: "kbd.command_types.tool_description",
  },
  {
    id: "general",
    label: "kbd.command_types.general_label",
    order: 100,
    color: "default",
  },
]);

/**
 * Default type id used when a command / shortcut omits `type`.
 */
export const DEFAULT_TYPE_ID = "general";

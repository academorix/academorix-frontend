/**
 * @fileoverview CommandTypeRegistry — registry of command / shortcut types.
 *
 * Stores the categories used to group commands and shortcuts in the
 * help overlay and command palette. Apps add new types through
 * `KbdModule.forFeature({ types })`. Types with the same id replace
 * the previous registration (so apps can override built-in defaults).
 *
 * @module @stackra/kbd
 * @category Registries
 */

import { Injectable, Inject, Optional, type OnModuleInit } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import { KBD_CONFIG } from "../tokens";
import { DEFAULT_COMMAND_TYPES, DEFAULT_TYPE_ID } from "../constants";
import type { CommandType } from "../interfaces/command-type.interface";
import type { KbdModuleOptions } from "../interfaces/kbd-config.interface";

/**
 * Registry of {@link CommandType} entries.
 *
 * Pre-seeded with `DEFAULT_COMMAND_TYPES` on module init. Apps can
 * register additional types or override the defaults at any time.
 */
@Injectable()
export class CommandTypeRegistry extends BaseRegistry<string, CommandType> implements OnModuleInit {
  /**
   * Wire the registry.
   */
  public constructor(@Optional() @Inject(KBD_CONFIG) private readonly config?: KbdModuleOptions) {
    super();
  }

  /**
   * Seed the default types right after DI bootstrap.
   */
  public onModuleInit(): void {
    for (const type of DEFAULT_COMMAND_TYPES) {
      if (!this.has(type.id)) this.register(type.id, type);
    }
  }

  /**
   * Register or replace a type.
   */
  public registerType(type: CommandType): void {
    this.registerOrReplace(type.id, type);
  }

  /**
   * Resolve a type by id. Falls back to the default type when no
   * match is found.
   */
  public resolve(id: string): CommandType {
    const found = this.get(id);
    if (found) return found;
    const fallback = this.get(this.config?.defaultType ?? DEFAULT_TYPE_ID);
    if (fallback) return fallback;
    return { id: DEFAULT_TYPE_ID, label: "General", order: 100 };
  }

  /**
   * Sorted snapshot of every registered type (asc by `order`).
   */
  public getOrdered(): CommandType[] {
    return [...this.values()].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }

  /**
   * Read-only snapshot of every registered type. Ergonomic alias
   * for `values()`.
   */
  public getAll(): CommandType[] {
    return this.values();
  }
}

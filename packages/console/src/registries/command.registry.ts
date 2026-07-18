/**
 * @file command.registry.ts
 * @module @stackra/console/registries
 * @description Singleton registry that stores all discovered commands.
 *   Extends {@link BaseRegistry} from `@stackra/support` for the unified
 *   Map-backed storage and lifecycle hooks. Adds command-specific
 *   surface on top: namespace filtering, subcommand association, and
 *   fully-qualified name uniqueness with a domain-specific error type.
 */

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import { DuplicateCommandError } from "../errors";

import type { IRegisteredCommand } from "../interfaces";

/**
 * Central registry for all console commands.
 *
 * Manages the collection of discovered command entries. Provides
 * lookup operations by name, namespace filtering, and subcommand
 * association. Enforces that no two commands share the same
 * fully-qualified name via {@link DuplicateCommandError}.
 *
 * ## Registration semantics
 *
 * `register(entry)` takes a whole {@link IRegisteredCommand} object
 * (unlike BaseRegistry's `register(key, value)`) — the command's
 * fully-qualified name is used as the map key, and subcommand-parent
 * linking happens inside the `onRegister` hook so the map is always
 * consistent.
 *
 * @example
 * ```typescript
 * const registry = app.get(CommandRegistry);
 * const allCommands = registry.getAll();
 * const configCommands = registry.getByNamespace('config');
 * const publishCmd = registry.get('config:publish');
 * ```
 */
@Injectable()
export class CommandRegistry extends BaseRegistry<string, IRegisteredCommand> {
  /**
   * Track the "second offender" class name for the next thrown
   * {@link DuplicateCommandError}. Set inside {@link register} right
   * before delegating to the base's strict `register()`; consumed by
   * {@link makeDuplicateError}; always reset to `null` afterwards so
   * a later BaseRegistry-level `.register()` call can't leak stale
   * context into a duplicate error.
   */
  private pendingDuplicateSourceName: string | null = null;

  /**
   * Register a command entry.
   *
   * The subclass adds an entry-based overload on top of the base's
   * `(key, value)` signature — most call-sites use the entry-based
   * form (`registry.register(entry)`), which is idiomatic for a
   * command registry where the key is already carried inside the
   * value. The base signature is preserved so BaseRegistry's own
   * contract stays honoured.
   *
   * Both overloads delegate to `super.register(entry.name, entry)`
   * for the strict duplicate-check + Map insertion. Subcommand
   * → parent linking then happens in the {@link onRegister}
   * lifecycle hook, so the map is always consistent by the time we
   * touch parent.subcommands.
   *
   * @throws {DuplicateCommandError} When another command already owns
   *   the same fully-qualified name.
   */
  public override register(entry: IRegisteredCommand): this;
  public override register(key: string, value: IRegisteredCommand): this;
  public override register(...args: [IRegisteredCommand] | [string, IRegisteredCommand]): this {
    // Normalize both overloads to `(key, entry)` — the 1-arg form
    // pulls the key from `entry.name`; the 2-arg form is kept for
    // BaseRegistry contract compatibility (rare in practice).
    const [key, entry] = args.length === 1 ? [args[0].name, args[0]] : [args[0], args[1]];

    // Stash the incoming class-name so `makeDuplicateError` can weave
    // it into the thrown error alongside the existing entry's class
    // name (BaseRegistry only hands the KEY to the factory hook).
    this.pendingDuplicateSourceName = entry.classRef.name;
    try {
      return super.register(key, entry);
    } finally {
      // Belt-and-suspenders — never leak a "second source" into a
      // subsequent register call whose duplicate is unrelated.
      this.pendingDuplicateSourceName = null;
    }
  }

  /**
   * Get all registered commands.
   *
   * Domain-readable alias for {@link BaseRegistry.values}.
   *
   * @returns Array of all registered command entries in insertion
   *   order.
   */
  public getAll(): IRegisteredCommand[] {
    return this.values();
  }

  /**
   * Get all commands within a specific namespace.
   *
   * The namespace is the substring before the first colon in a
   * fully-qualified command name (e.g. `queue` in `queue:work`).
   * Top-level commands with no colon carry `namespace === ""`.
   *
   * @param namespace - The namespace to filter by.
   * @returns Array of commands in the given namespace (may be empty).
   */
  public getByNamespace(namespace: string): IRegisteredCommand[] {
    return this.getAll().filter((cmd) => cmd.namespace === namespace);
  }

  /**
   * Get all unique namespaces from registered commands.
   *
   * Skips the empty namespace (top-level commands) — callers who need
   * "all buckets including top-level" should compose this result with
   * `getByNamespace('').length > 0`.
   *
   * @returns Array of namespace strings, sorted alphabetically.
   */
  public getNamespaces(): string[] {
    const namespaces = new Set<string>();

    for (const cmd of this.values()) {
      if (cmd.namespace) {
        namespaces.add(cmd.namespace);
      }
    }

    return Array.from(namespaces).sort();
  }

  /**
   * Get all registered command names for fuzzy matching.
   *
   * Domain-readable alias for {@link BaseRegistry.keys}.
   *
   * @returns Array of all fully-qualified command names.
   */
  public getNames(): string[] {
    return this.keys();
  }

  /**
   * Get the total number of registered commands.
   *
   * Domain-readable alias for {@link BaseRegistry.count} — kept so
   * consumer call-sites can read `registry.size()` in a
   * "how many commands" context without knowing about BaseRegistry.
   *
   * @returns Count of registered commands.
   */
  public size(): number {
    return this.count();
  }

  /**
   * Extract the namespace from a command name.
   *
   * @param name - Fully qualified command name.
   * @returns The namespace (substring before first colon), or empty
   *   string when the name has no colon separator.
   */
  public static extractNamespace(name: string): string {
    const colonIndex = name.indexOf(":");

    return colonIndex > -1 ? name.substring(0, colonIndex) : "";
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BaseRegistry lifecycle overrides
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lifecycle hook — fires after the base successfully stored a new
   * entry. Handles the subcommand → parent linking so the parent's
   * `subcommands` array is always in sync with the map.
   *
   * @param _key - The command's fully-qualified name (unused; the
   *   value carries the same info via `entry.name`).
   * @param entry - The registered command entry.
   */
  protected override onRegister(_key: string, entry: IRegisteredCommand): void {
    if (!entry.parent) return;

    const parent = this.get(entry.parent);
    if (parent && !parent.subcommands.includes(entry.name)) {
      parent.subcommands.push(entry.name);
    }
  }

  /**
   * Factory hook — produces the domain-specific error thrown when a
   * command name collides. Reads the existing entry from the map to
   * name both offenders in the error message.
   *
   * @param key - The colliding fully-qualified command name.
   * @returns A ready-to-throw {@link DuplicateCommandError}.
   */
  protected override makeDuplicateError(key: string): Error {
    const existing = this.get(key);
    return new DuplicateCommandError(
      key,
      existing?.classRef.name ?? "an-unnamed-existing-command",
      this.pendingDuplicateSourceName ?? "an-unnamed-second-source",
    );
  }
}

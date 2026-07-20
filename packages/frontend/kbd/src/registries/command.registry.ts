/**
 * @fileoverview CommandRegistry — registers static + dynamic commands.
 *
 * Stores both static {@link Command} entries (added at boot) and
 * pluggable {@link CommandSource}s (queried per-keystroke for dynamic
 * results — e.g. recent pages, search-as-you-type for resources).
 *
 * @module @stackra/kbd
 * @category Registries
 */

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import type { Command, CommandSource } from "../interfaces/command.interface";

/**
 * Registry that aggregates command-palette entries.
 *
 * Static commands are stored in the underlying registry; sources are
 * kept in a separate list so the palette can iterate them on every
 * search.
 */
@Injectable()
export class CommandRegistry extends BaseRegistry<string, Command> {
  /**
   * Plug-in command sources. Kept ordered by priority ascending.
   */
  private readonly sources: CommandSource[] = [];

  /**
   * Construct an empty registry.
   */
  public constructor() {
    super();
  }

  /**
   * Register a static command. Uses `registerOrReplace` (overwrite
   * semantics) rather than the strict `register` so that HMR reloads
   * and per-feature `KbdModule.forFeature({ commands })` calls don't
   * throw when they land twice for the same id.
   *
   * @param command - The command definition.
   */
  public registerCommand(command: Command): void {
    this.registerOrReplace(command.id, command);
  }

  /**
   * Remove a static command.
   */
  public unregisterCommand(id: string): void {
    this.remove(id);
  }

  /**
   * Register a dynamic command source.
   *
   * @param source - The source to add.
   */
  public registerSource(source: CommandSource): void {
    if (this.sources.find((s) => s.id === source.id)) {
      // Replace existing source — keeps idempotency for HMR.
      const idx = this.sources.findIndex((s) => s.id === source.id);
      this.sources[idx] = source;
    } else {
      this.sources.push(source);
    }
    this.sources.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }

  /**
   * Remove a dynamic command source.
   */
  public unregisterSource(id: string): void {
    const idx = this.sources.findIndex((s) => s.id === id);
    if (idx !== -1) this.sources.splice(idx, 1);
  }

  /**
   * All registered sources (read-only snapshot).
   */
  public getSources(): readonly CommandSource[] {
    return this.sources;
  }

  /**
   * All registered static commands (read-only snapshot).
   */
  public getStaticCommands(): Command[] {
    return this.values();
  }

  /**
   * Read-only snapshot of every registered command. Kept as an
   * ergonomic alias for `values()` so callers reading a
   * "give-me-all-commands" pattern don't need to know about the
   * underlying `BaseRegistry` API surface.
   */
  public getAll(): Command[] {
    return this.values();
  }
}

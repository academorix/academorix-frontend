/**
 * @fileoverview ShortcutRegistry — global keyboard binding registry.
 *
 * Stores every keyboard shortcut registered through
 * `KbdModule.forFeature({ shortcuts })`, the `useShortcut` hook, or
 * imperatively via the registry itself. Maintains a stack of active
 * scopes so a single keystroke can resolve to different actions
 * depending on which UI surface owns focus.
 *
 * On registration, the registry checks the binding against the
 * curated reserved-combo list and emits a development warning when
 * the combo is known to be claimed by the browser / OS.
 *
 * @module @stackra/kbd
 * @category Registries
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import { KBD_CONFIG } from "../tokens";
import type { KbdModuleOptions } from "../interfaces/kbd-config.interface";
import type { Shortcut, ShortcutScope } from "../interfaces/shortcut.interface";
import { comboToCanonical, isReservedBrowserCombo } from "../utils/browser-shortcut-conflicts.util";
import { Logger } from "@stackra/logger";

/**
 * Global registry of keyboard shortcuts.
 *
 * Apps register bindings imperatively or through the `useShortcut`
 * hook (component-scoped). The {@link KbdProvider} wires a single
 * `keydown` listener that consults this registry.
 *
 * Scopes form a stack — `pushScope("modal")` makes scoped shortcuts
 * fire in addition to global ones. Pop the scope on unmount.
 */
@Injectable()
export class ShortcutRegistry extends BaseRegistry<string, Shortcut> {
  /**
   * Logger scoped to the registry — emits dev warnings when a shortcut
   * collides with a reserved browser / OS combo.
   */
  private readonly logger = new Logger(ShortcutRegistry.name);

  /**
   * Stack of active scopes. The topmost scope wins when multiple
   * shortcuts share the same combo.
   */
  private readonly scopeStack: string[] = [];

  /**
   * Wire the registry. Config is injected so the registry can read
   * the user-supplied `reservedKeys` list and `silenceReservedWarnings`
   * flag.
   */
  public constructor(@Optional() @Inject(KBD_CONFIG) private readonly config?: KbdModuleOptions) {
    super();
  }

  /**
   * Register or replace a shortcut.
   *
   * Logs a development warning when the combo is known to conflict
   * with a browser / OS shortcut (e.g. `mod+t`). Use
   * `KbdModuleOptions.silenceReservedWarnings` to suppress.
   */
  public registerShortcut(shortcut: Shortcut): void {
    if (!this.config?.silenceReservedWarnings) {
      const extra = this.config?.reservedKeys ?? [];
      const combos = Array.isArray(shortcut.combo) ? shortcut.combo : [shortcut.combo];
      for (const combo of combos) {
        if (isReservedBrowserCombo(combo, extra)) {
          this.logger.warn(
            `Shortcut "${shortcut.id}" binds the reserved browser combo "${comboToCanonical(combo)}". The browser may intercept it before the page sees the keystroke.`,
          );
        }
      }
    }
    // Register with overwrite semantics — HMR reloads, feature-module
    // seeding, and user overrides through the customization service
    // all re-register by the same id and should not throw.
    this.registerOrReplace(shortcut.id, shortcut);
  }

  /**
   * Remove a shortcut by id.
   */
  public unregisterShortcut(id: string): void {
    this.remove(id);
  }

  /**
   * Read-only snapshot of every registered shortcut. Ergonomic alias
   * for `values()` — most call-sites iterate the entire catalogue
   * for search / grouping / catalog rendering.
   */
  public getAll(): Shortcut[] {
    return this.values();
  }

  /**
   * Push a scope onto the active stack.
   */
  public pushScope(scope: ShortcutScope): void {
    this.scopeStack.push(scope);
  }

  /**
   * Pop the top scope.
   */
  public popScope(expected?: ShortcutScope): void {
    if (this.scopeStack.length === 0) return;
    if (expected !== undefined) {
      const top = this.scopeStack[this.scopeStack.length - 1];
      if (top !== expected) return;
    }
    this.scopeStack.pop();
  }

  /**
   * Snapshot of the active scope stack (top-most last).
   */
  public getActiveScopes(): readonly string[] {
    return this.scopeStack;
  }

  /**
   * Returns shortcuts that are currently eligible to fire.
   *
   * Scoped shortcuts (matching an active scope, top-most first) come
   * before global ones, so they shadow on conflict.
   */
  public getActiveShortcuts(): Shortcut[] {
    const active: Shortcut[] = [];
    const scopeOrder = [...this.scopeStack].reverse();

    for (const scope of scopeOrder) {
      for (const s of this.getAll()) {
        if (s.scope && s.scope !== "global" && s.scope === scope) {
          active.push(s);
        }
      }
    }

    for (const s of this.getAll()) {
      if (!s.scope || s.scope === "global") active.push(s);
    }

    return active;
  }

  /**
   * Group shortcuts by type id.
   *
   * @param scope - Optional scope filter; defaults to all visible shortcuts.
   */
  public groupByType(scope?: ShortcutScope): Map<string, Shortcut[]> {
    const map = new Map<string, Shortcut[]>();
    for (const s of this.getAll()) {
      if (s.hidden) continue;
      if (scope && s.scope && s.scope !== scope && s.scope !== "global") continue;
      const key = s.type ?? s.category ?? "general";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }
}

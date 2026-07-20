/**
 * @fileoverview CommandPaletteService — palette state + source aggregation.
 *
 * Owns the palette's open/close state, the current query, the
 * resolved command list, and the active theme id. Components
 * subscribe through a subscribe-style API (or via the
 * `useCommandPalette` hook) so the service can be reused outside
 * React (e.g. fired imperatively from anywhere in the app).
 *
 * @module @stackra/kbd
 * @category Services
 */

import { Inject, Injectable, Optional } from "@stackra/container";

import { KBD_CONFIG, COMMAND_PALETTE_STORE } from "../tokens";
import type { Command, CommandSource } from "../interfaces/command.interface";
import type { KbdModuleOptions } from "../interfaces/kbd-config.interface";
import type { CommandPaletteState } from "../interfaces/command-palette-state.interface";
import type { PaletteNavigate } from "../types/palette-navigate.type";
import { CommandRegistry } from "../registries/command.registry";
import { PaletteThemeRegistry } from "../registries/palette-theme.registry";

import { Str } from "@stackra/support";
import type { Store } from "@tanstack/store";

/**
 * Service for the command palette.
 *
 * Uses a DI-managed TanStack Store (`COMMAND_PALETTE_STORE`) for reactive
 * state. Components subscribe via `useStoreValue()` — no manual subscribe
 * pattern needed.
 */
@Injectable()
export class CommandPaletteService {
  private currentAbort: AbortController | null = null;
  private navigate: PaletteNavigate | null = null;

  /**
   * Wire the service.
   */
  public constructor(
    private readonly registry: CommandRegistry,
    private readonly themes: PaletteThemeRegistry,
    @Inject(COMMAND_PALETTE_STORE) private readonly store: Store<CommandPaletteState>,
    @Optional() @Inject(KBD_CONFIG) private readonly config?: KbdModuleOptions,
  ) {}

  /**
   * Inject a navigate function for route-style command handling.
   */
  public setNavigate(navigate: PaletteNavigate | null): void {
    this.navigate = navigate;
  }

  /**
   * Snapshot of the current palette state.
   */
  public getState(): CommandPaletteState {
    return this.store.state;
  }

  /**
   * Open the palette.
   *
   * Resets the query to `initialQuery` and kicks off command resolution.
   * Safe to call when already open — the new query just replaces the
   * current one.
   *
   * @param initialQuery - Pre-filled query, defaults to empty.
   */
  public open(initialQuery: string = ""): void {
    this.update({ isOpen: true, query: initialQuery });
    void this.resolve(initialQuery);
  }

  /**
   * Close the palette.
   *
   * Cancels any in-flight source resolution and resets query/commands
   * so the next `open()` starts clean.
   */
  public close(): void {
    this.cancelInflight();
    this.update({ isOpen: false, query: "", commands: [], isLoading: false });
  }

  /**
   * Toggle the palette open/closed.
   *
   * @param initialQuery - Query to pre-fill when opening (ignored when
   *   the palette is already open and is being closed).
   */
  public toggle(initialQuery: string = ""): void {
    if (this.state.isOpen) this.close();
    else this.open(initialQuery);
  }

  /**
   * Update the search query and re-resolve commands.
   *
   * Source resolution is debounced via abort signals — calling this
   * rapidly cancels the previous in-flight resolution and starts a new
   * one with the latest query.
   *
   * @param query - The new search query.
   */
  public setQuery(query: string): void {
    this.update({ query });
    void this.resolve(query);
  }

  /**
   * Switch the active palette theme.
   *
   * No-op when the requested theme id isn't registered — keeps the
   * current theme to avoid an inconsistent UI state.
   *
   * @param themeId - The theme id to activate.
   */
  public setTheme(themeId: string): void {
    if (!this.themes.has(themeId)) return;
    this.update({ themeId });
  }

  /**
   * Invoke a command. Routes use the injected navigate fn; handlers
   * are awaited and then the palette closes.
   */
  public async invoke(command: Command, params?: Record<string, unknown>): Promise<void> {
    if (command.disabled) return;
    if ("handler" in command && command.handler) {
      await command.handler({ params, close: () => this.close() });
      return;
    }
    if ("to" in command && command.to && this.navigate) {
      this.navigate(command.to);
      this.close();
    }
  }

  /* ── Internal ───────────────────────────────────────────────── */

  private get state(): CommandPaletteState {
    return this.store.state;
  }

  private async resolve(query: string): Promise<void> {
    this.cancelInflight();
    const abort = new AbortController();
    this.currentAbort = abort;
    this.update({ isLoading: true });

    const trimmed = Str.trim(query);
    const limit = this.config?.maxResultsPerCategory ?? 50;

    try {
      const staticMatches = filterStatic(this.registry.getStaticCommands(), trimmed);
      const dynamicResults: Command[] = [];

      await Promise.all(
        this.registry.getSources().map(async (source: CommandSource) => {
          try {
            const result = await source.resolve(trimmed, { signal: abort.signal });
            if (!abort.signal.aborted) dynamicResults.push(...result);
          } catch {
            // Sources may fail; ignore.
          }
        }),
      );

      if (abort.signal.aborted) return;

      const merged = [...staticMatches, ...dynamicResults];
      const deduped = dedupeById(merged);
      const ranked = rankCommands(deduped, trimmed, limit);
      this.update({ commands: ranked, isLoading: false });
    } catch {
      this.update({ commands: [], isLoading: false });
    }
  }

  private cancelInflight(): void {
    if (this.currentAbort) {
      this.currentAbort.abort();
      this.currentAbort = null;
    }
  }

  private update(partial: Partial<CommandPaletteState>): void {
    this.store.setState((s) => ({ ...s, ...partial }));
  }
}

/* ── Helpers ───────────────────────────────────────────────────── */

function filterStatic(commands: Command[], query: string): Command[] {
  if (!query) return commands.filter((c) => !c.hidden);
  const lower = Str.lower(query);
  return commands.filter((c) => {
    if (c.hidden) return false;
    const haystack = [c.label, c.description, ...(c.keywords ?? [])]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase())
      .join(" ");
    return haystack.includes(lower);
  });
}

function dedupeById(commands: Command[]): Command[] {
  const seen = new Set<string>();
  const out: Command[] = [];
  for (const c of commands) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

function rankCommands(commands: Command[], query: string, perCategoryLimit: number): Command[] {
  const lower = Str.lower(query);
  const scored = commands.map((c) => ({ command: c, score: scoreCommand(c, lower) }));
  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return (a.command.order ?? 0) - (b.command.order ?? 0);
  });

  const counts = new Map<string, number>();
  const limited: Command[] = [];
  for (const { command } of scored) {
    const cat = command.type ?? command.category ?? "general";
    const count = counts.get(cat) ?? 0;
    if (count >= perCategoryLimit) continue;
    counts.set(cat, count + 1);
    limited.push(command);
  }
  return limited;
}

function scoreCommand(command: Command, query: string): number {
  if (!query) return 0;
  const label = Str.lower(command.label);
  if (label === query) return 100;
  if (Str.startsWith(label, query)) return 80;
  if (label.includes(query)) return 50;
  for (const kw of command.keywords ?? []) {
    if (Str.lower(kw).includes(query)) return 30;
  }
  if (command.description?.toLowerCase().includes(query)) return 20;
  return 10;
}

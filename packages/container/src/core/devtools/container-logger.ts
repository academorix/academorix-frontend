/**
 * Container Logger — DI Resolution Graph Logging
 *
 * Provides detailed logging of the DI container's bootstrap process:
 * - Module registration (which modules, in what order)
 * - Provider instantiation (class, scope, dependencies, timing)
 * - Lifecycle hook execution (onModuleInit, onApplicationBootstrap)
 * - Discovery results (@OnEvent listeners, @Reporter, @Configuration)
 *
 * Inspired by inversify-logger-middleware but adapted for our NestJS-style
 * container where resolution happens at bootstrap (not on-demand).
 *
 * ## Usage
 *
 * ```typescript
 * import { ApplicationFactory } from "@stackra/container";
 *
 * const app = await ApplicationFactory.create(AppModule, {
 *   logging: {
 *     enabled: true,
 *     resolution: true,
 *     lifecycle: true,
 *     timing: true,
 *     graph: true,
 *   },
 * });
 * ```
 *
 * ## Output Example
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 🚀 Application Bootstrap                                    2.4ms  │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ ✅ AppModule                                                        │
 * │ ├── 📦 EventEmitterModule (global)                          0.3ms  │
 * │ │   ├── ✓ EventEmitter [singleton]                                  │
 * │ │   └── ✓ EventSubscribersLoader [singleton]                        │
 * │ │       └── deps: DiscoveryService, EventEmitter                    │
 * │ ├── 📦 LoggerModule (global)                                0.2ms  │
 * │ │   └── ✓ LoggerManager [singleton]                                 │
 * │ └── ✓ CounterService [singleton]                                    │
 * │                                                                     │
 * │ 🔗 Lifecycle: onModuleInit                                  0.8ms  │
 * │ ├── LoggerManager.onModuleInit()                                    │
 * │ └── CacheManager.onModuleInit()                                     │
 * │                                                                     │
 * │ 📊 Summary: 5 modules, 18 providers                        2.4ms  │
 * └─────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * @module @stackra/container/devtools
 */

// ── ANSI Color Helpers ────────────────────────────────────────────────────────

import { colorize } from "./colorize.util";
import type { IContainerLoggerOptions } from "@/core/interfaces/container-logger-options.interface";
import type { IResolutionEntry } from "@/core/interfaces/resolution-entry.interface";
import type { ILifecycleEntry } from "@/core/interfaces/lifecycle-entry.interface";
import type { IBootstrapLog } from "@/core/interfaces/bootstrap-log.interface";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContainerLoggerOptions = IContainerLoggerOptions;
type ResolutionEntry = IResolutionEntry;
type LifecycleEntry = ILifecycleEntry;
type BootstrapLog = IBootstrapLog;

// ── Container Logger Class ────────────────────────────────────────────────────

/**
 * ContainerLogger — collects and renders the DI bootstrap graph.
 *
 * Instantiated by `ApplicationFactory.create()` when `logging.enabled` is true.
 * Collects entries during bootstrap, then renders the full graph at the end.
 */
export class ContainerLogger {
  /** Collected resolution entries. */
  private readonly resolutions: ResolutionEntry[] = [];

  /** Collected lifecycle entries. */
  private readonly lifecycleEntries: LifecycleEntry[] = [];

  /** Collected module entries. */
  private readonly modules: BootstrapLog["modules"] = [];

  /** Bootstrap start time. */
  private startTime = 0;

  /** Logger options. */
  private readonly options: Required<ContainerLoggerOptions>;

  /**
   * Create a new ContainerLogger.
   *
   * @param options - Logging configuration
   */
  public constructor(options: ContainerLoggerOptions = {}) {
    this.options = {
      enabled: options.enabled ?? false,
      resolution: options.resolution ?? true,
      lifecycle: options.lifecycle ?? true,
      timing: options.timing ?? true,
      graph: options.graph ?? true,
      colors: options.colors ?? true,
      renderer: options.renderer ?? ((output: string) => console.log(output)),
    };
  }

  /** Whether logging is enabled. */
  public get enabled(): boolean {
    return this.options.enabled;
  }

  // ── Collection Methods (called during bootstrap) ────────────────────────

  /** Mark the start of bootstrap. */
  public start(): void {
    this.startTime = performance.now();
  }

  /** Record a module registration. */
  public logModule(name: string, isGlobal: boolean, providers: string[], imports: string[]): void {
    if (!this.options.enabled) return;
    this.modules.push({ name, isGlobal, providers, imports });
  }

  /** Record a provider resolution. */
  public logResolution(entry: ResolutionEntry): void {
    if (!this.options.enabled || !this.options.resolution) return;
    this.resolutions.push(entry);
  }

  /** Record a lifecycle hook execution. */
  public logLifecycle(entry: LifecycleEntry): void {
    if (!this.options.enabled || !this.options.lifecycle) return;
    this.lifecycleEntries.push(entry);
  }

  // ── Rendering ───────────────────────────────────────────────────────────

  /** Render the full bootstrap graph to the configured renderer. */
  public render(): void {
    if (!this.options.enabled || !this.options.graph) return;

    const totalTime = performance.now() - this.startTime;
    const isBrowser = typeof window !== "undefined";

    // ── Browser: use console.groupCollapsed for expandable modules ─────
    if (isBrowser) {
      this.renderBrowser(totalTime);
      return;
    }

    // ── Node/SSR: use the tree format ─────────────────────────────────
    this.renderTree(totalTime);
  }

  /**
   * Browser renderer — compact summary + collapsed groups per module.
   *
   * Shows a clean summary header, then each module as a collapsed group
   * that developers can expand to see providers and dependencies.
   */
  private renderBrowser(totalTime: number): void {
    const moduleCount = this.modules.length;
    const providerCount = this.resolutions.length;
    const hookCount = this.lifecycleEntries.length;

    // ── Summary Header ────────────────────────────────────────────────
    console.log(
      `%c🚀 Application Bootstrap %c${totalTime.toFixed(1)}ms%c — ${moduleCount} modules · ${providerCount} providers · ${hookCount} hooks`,
      "font-weight: bold; font-size: 13px;",
      "color: #06b6d4; font-weight: bold; font-size: 13px;",
      "color: inherit; font-size: 12px;",
    );

    // ── Modules (collapsed groups) ────────────────────────────────────
    for (const mod of this.modules) {
      const globalTag = mod.isGlobal ? " (global)" : "";
      const providers = mod.providers ?? [];
      const provCount = providers.length;

      console.groupCollapsed(
        `%c📦 ${mod.name}${globalTag}%c — ${provCount} provider${provCount !== 1 ? "s" : ""}`,
        "font-weight: bold;",
        "color: #6b7280; font-weight: normal;",
      );

      for (const providerName of providers) {
        const resolution = this.resolutions.find((r) => r.name === providerName);
        const scope = resolution?.scope ?? "singleton";
        const time = resolution?.time;
        const timeStr = time ? ` (${time.toFixed(1)}ms)` : "";

        console.log(`  ✓ ${providerName} [${scope}]${timeStr}`);
      }

      console.groupEnd();
    }

    // ── Lifecycle Hooks (collapsed) ───────────────────────────────────
    if (this.lifecycleEntries.length > 0) {
      // Find the slowest hooks for the summary line
      const sorted = [...this.lifecycleEntries]
        .filter((e) => (e.time ?? 0) > 0.5)
        .sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
      const slowest = sorted.slice(0, 3);
      const slowestStr =
        slowest.length > 0
          ? ` — Slowest: ${slowest.map((e) => `${e.provider} (${(e.time ?? 0).toFixed(1)}ms)`).join(", ")}`
          : "";

      console.groupCollapsed(
        `%c🔗 Lifecycle Hooks%c — ${this.lifecycleEntries.length} hooks${slowestStr}`,
        "font-weight: bold;",
        "color: #6b7280; font-weight: normal;",
      );

      for (const entry of this.lifecycleEntries) {
        const status = entry.success !== false ? "✓" : "✗";
        const time = entry.time ? ` ${entry.time.toFixed(1)}ms` : "";
        console.log(`  ${status} ${entry.provider}.${entry.hook}()${time}`);
      }

      console.groupEnd();
    }
  }

  /**
   * Tree renderer — for Node.js / SSR environments.
   *
   * Produces the classic box-drawing tree format for terminal output.
   */
  private renderTree(totalTime: number): void {
    const c = this.options.colors;
    const lines: string[] = [];

    // Header
    lines.push("");
    lines.push(
      colorize("┌─────────────────────────────────────────────────────────────────────┐", "dim", c),
    );
    lines.push(
      `│ ${colorize("🚀 Application Bootstrap", "bold", c)}${" ".repeat(30)}${colorize(`${totalTime.toFixed(1)}ms`, "cyan", c)} │`,
    );
    lines.push(
      colorize("├─────────────────────────────────────────────────────────────────────┤", "dim", c),
    );

    // Modules + Providers
    if (this.modules.length > 0) {
      lines.push("│");
      for (const mod of this.modules) {
        const globalTag = mod.isGlobal ? colorize(" (global)", "dim", c) : "";
        lines.push(`│ ${colorize("📦", "yellow", c)} ${colorize(mod.name, "bold", c)}${globalTag}`);

        for (const providerName of mod.providers ?? []) {
          const resolution = this.resolutions.find((r) => r.name === providerName);
          const scope = resolution?.scope ?? "singleton";
          const time = resolution?.time;

          const scopeTag = colorize(`[${scope}]`, "dim", c);
          const timeTag =
            time && this.options.timing ? colorize(` ${time.toFixed(1)}ms`, "cyan", c) : "";
          const status =
            resolution?.success !== false ? colorize("✓", "green", c) : colorize("✗", "red", c);

          lines.push(`│   ├── ${status} ${providerName} ${scopeTag}${timeTag}`);
        }
      }
    }

    // Lifecycle hooks
    if (this.lifecycleEntries.length > 0) {
      lines.push("│");
      lines.push(`│ ${colorize("🔗 Lifecycle Hooks", "magenta", c)}`);

      for (const entry of this.lifecycleEntries) {
        const status =
          entry.success !== false ? colorize("✓", "green", c) : colorize("✗", "red", c);
        const time =
          entry.time && this.options.timing
            ? colorize(` ${entry.time.toFixed(1)}ms`, "cyan", c)
            : "";
        lines.push(`│   ${status} ${entry.provider}.${entry.hook}()${time}`);
        if (entry.error) {
          lines.push(`│     ${colorize(`└── Error: ${entry.error}`, "red", c)}`);
        }
      }
    }

    // Summary
    lines.push("│");
    lines.push(
      `│ ${colorize("📊", "cyan", c)} Summary: ${this.modules.length} modules, ${this.resolutions.length} providers, ${this.lifecycleEntries.length} hooks ${colorize(`${totalTime.toFixed(1)}ms`, "cyan", c)}`,
    );
    lines.push(
      colorize("└─────────────────────────────────────────────────────────────────────┘", "dim", c),
    );
    lines.push("");

    // Output
    if (typeof this.options.renderer === "function") {
      this.options.renderer(lines.join("\n"));
    } else {
      console.log(lines.join("\n"));
    }
  }

  /** Get the raw bootstrap log data (for programmatic access). */
  public getLog(): BootstrapLog {
    return {
      totalTime: performance.now() - this.startTime,
      modules: [...this.modules],
      resolutions: [...this.resolutions],
      lifecycle: [...this.lifecycleEntries],
      totalDurationMs: performance.now() - this.startTime,
      summary: JSON.stringify({
        moduleCount: this.modules.length,
        providerCount: this.resolutions.length,
        globalModuleCount: this.modules.filter((m) => m.isGlobal).length,
        lifecycleHookCount: this.lifecycleEntries.length,
      }),
    };
  }
}

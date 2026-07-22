/**
 * @file devtools-panels-loader.service.ts
 * @module @stackra/devtools/core/services
 * @description Auto-discovery loader for `@DevtoolsPanel()`-decorated
 *   classes.
 *
 *   Scans the container after all modules have wired
 *   (`onApplicationBootstrap`) and registers every discovered
 *   provider whose class carries the
 *   `DEVTOOLS_PANEL_METADATA_KEY` metadata.
 *
 *   Uses `discovery.getProvidersByMetadata(...)` — the canonical
 *   scan surface per `.kiro/steering/package-conventions.md` — so
 *   we never walk the entire provider list by hand.
 */

import { Inject, Injectable, Optional, type OnApplicationBootstrap } from "@stackra/container";
import {
  DEVTOOLS_PANEL_METADATA_KEY,
  DEVTOOLS_REGISTRY,
  DISCOVERY_SERVICE,
  type IDevtoolsPanel,
  type IDevtoolsPanelsRegistry,
  type IDiscoveryService,
} from "@stackra/contracts";

/**
 * Structural type-guard for the `IDevtoolsPanel` shape. Runs on the
 * resolved instance of every provider stamped with the metadata key.
 *
 * The check is intentionally loose — we only require the fields the
 * shell actually reads. The decorator author is free to keep richer
 * state on the instance.
 */
function isPanel(value: unknown): value is IDevtoolsPanel {
  if (!value || typeof value !== "object") return false;
  const cast = value as Partial<IDevtoolsPanel>;
  return (
    typeof cast.id === "string" &&
    typeof cast.title === "string" &&
    typeof cast.view === "object" &&
    cast.view !== null &&
    "type" in cast.view
  );
}

/**
 * Discovers `@DevtoolsPanel()`-decorated providers and registers
 * them on the panels registry at bootstrap.
 */
@Injectable()
export class DevtoolsPanelsLoader implements OnApplicationBootstrap {
  /**
   * @param registry - The panels registry to register discovered
   *   panels into.
   * @param discovery - Optional discovery service — when the
   *   `@stackra/container/discovery` module isn't imported, the
   *   loader is a no-op (panels registered via
   *   `DevtoolsModule.forFeature([...])` still land through the
   *   shared seed loader).
   */
  public constructor(
    @Inject(DEVTOOLS_REGISTRY) private readonly registry: IDevtoolsPanelsRegistry,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discovery?: IDiscoveryService,
  ) {}

  /**
   * Scan the container and register every discovered panel after
   * every module has finished `onModuleInit`.
   */
  public onApplicationBootstrap(): void {
    // Discovery module is optional across the workspace — if the
    // caller didn't wire it, we still function; feature packages
    // then rely exclusively on `DevtoolsModule.forFeature` for
    // registration.
    if (!this.discovery) return;

    const wrappers = this.discovery.getProvidersByMetadata(DEVTOOLS_PANEL_METADATA_KEY);
    for (const wrapper of wrappers) {
      const instance = wrapper.instance;
      if (!isPanel(instance)) {
        // Metadata was stamped on a class that doesn't implement
        // the panel shape — silently skip rather than throw. This
        // handles the (rare) case of a class being marked with the
        // decorator but never fully implementing the contract
        // (e.g. mid-refactor).
        continue;
      }
      // Last-wins on the registry side — safe to call for every
      // discovered wrapper even if a companion `forFeature` seed
      // loader has already registered the same panel.
      this.registry.register(instance);
    }
  }
}

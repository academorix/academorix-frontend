/**
 * @file devtools-inspector-loader.service.ts
 * @module @stackra/devtools/core/services
 * @description Auto-discovery loader for `@DevtoolsInspectorSource()`
 *   classes.
 */

import { Inject, Injectable, Optional, type OnApplicationBootstrap } from "@stackra/container";
import {
  DEVTOOLS_INSPECTOR_REGISTRY,
  DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY,
  DISCOVERY_SERVICE,
  type IDevtoolsInspectorRegionSource,
  type IDevtoolsInspectorRegistry,
  type IDiscoveryService,
} from "@stackra/contracts";

/**
 * Structural type-guard for the `IDevtoolsInspectorRegionSource`
 * shape.
 */
function isInspectorSource(value: unknown): value is IDevtoolsInspectorRegionSource {
  if (!value || typeof value !== "object") return false;
  const cast = value as Partial<IDevtoolsInspectorRegionSource>;
  return (
    typeof cast.id === "string" &&
    typeof cast.label === "string" &&
    typeof cast.panelId === "string" &&
    typeof cast.collect === "function"
  );
}

/**
 * Discovers `@DevtoolsInspectorSource()`-decorated providers and
 * registers them on the inspector registry at bootstrap.
 */
@Injectable()
export class DevtoolsInspectorLoader implements OnApplicationBootstrap {
  public constructor(
    @Inject(DEVTOOLS_INSPECTOR_REGISTRY)
    private readonly registry: IDevtoolsInspectorRegistry,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discovery?: IDiscoveryService,
  ) {}

  /** Scan + register after every module has initialised. */
  public onApplicationBootstrap(): void {
    if (!this.discovery) return;

    const wrappers = this.discovery.getProvidersByMetadata(DEVTOOLS_INSPECTOR_SOURCE_METADATA_KEY);
    for (const wrapper of wrappers) {
      const instance = wrapper.instance;
      if (!isInspectorSource(instance)) continue;
      this.registry.register(instance);
    }
  }
}

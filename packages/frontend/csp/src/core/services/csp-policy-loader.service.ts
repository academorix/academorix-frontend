/**
 * @file csp-policy-loader.service.ts
 * @module @stackra/csp/core/services
 * @description Auto-discovery of `@CspPolicy()`-decorated classes.
 *
 *   At application bootstrap, walks every DI provider carrying
 *   `CSP_POLICY_METADATA`, reads the metadata, and registers each policy
 *   with the `CspRegistry`. Requires the `DISCOVERY_SERVICE` peer —
 *   fail-soft when the discovery package isn't wired.
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import { DISCOVERY_SERVICE } from "@stackra/contracts";
import type { IDiscoveryService, OnApplicationBootstrap } from "@stackra/contracts";
import { getMetadata } from "@vivtel/metadata";

import { CSP_POLICY_METADATA } from "../constants";
import { CspRegistry } from "../registries/csp.registry";
import type { CspFeaturePolicy } from "../interfaces/csp-feature-policy.interface";

/**
 * Discovers and registers all `@CspPolicy()`-decorated classes with the
 * `CspRegistry`. Internal to `CspModule` — runs automatically during
 * application bootstrap.
 */
@Injectable()
export class CspPolicyLoader implements OnApplicationBootstrap {
  public constructor(
    private readonly registry: CspRegistry,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discovery?: IDiscoveryService,
  ) {}

  /**
   * Runs after every module has finished `onModuleInit` — ensures every
   * `@CspPolicy()` provider is materialised before we scan. Fail-soft when
   * discovery isn't available.
   */
  public onApplicationBootstrap(): void {
    if (!this.discovery) return;

    const providers = this.discovery.getProvidersByMetadata(CSP_POLICY_METADATA);
    for (const wrapper of providers) {
      const instance = wrapper.instance as object | null;
      if (!instance) continue;

      const ctor = (instance as { constructor?: Function }).constructor;
      if (!ctor) continue;

      const policy = getMetadata<CspFeaturePolicy>(CSP_POLICY_METADATA, ctor as object);
      if (!policy) continue;

      this.registry.registerPolicy(policy);
    }
  }
}

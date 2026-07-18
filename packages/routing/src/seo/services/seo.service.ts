/**
 * @file seo.service.ts
 * @module @stackra/routing/seo/services
 * @description The SEO service — merges route descriptors and produces
 *   the flat `ISeoTag[]` consumed by the client renderer (F.2).
 *
 *   Framework-neutral. Both the F.2 React `<SeoHead />` and the F.3
 *   build-time prerender walk consume the same tag list.
 *
 *   NOTE: the site-wide `seo` config lives on `IRoutingModuleOptions.seo`
 *   — the SEO service reads it via `IRoutingModuleOptions` (through
 *   `ROUTING_CONFIG`), not via a separate `SEO_CONFIG` binding. This
 *   keeps the module tree flat and avoids duplicating config in
 *   `RoutingModule.forRoot(...)`.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { ILoggerManager, IRoutingModuleOptions } from "@stackra/contracts";
import { LOGGER_MANAGER, ROUTING_CONFIG } from "@stackra/contracts";

import type { ISeoConfig } from "../interfaces/seo-config.interface";
import type { ISeoDescriptor } from "../interfaces/seo-descriptor.interface";
import type { ISeoTag } from "../interfaces/seo-tag.interface";
import { buildSeoTags } from "../utils/build-seo-tags.util";
import { mergeDescriptors } from "../utils/merge-descriptors.util";

/**
 * SEO service — pure transformer over the descriptor chain.
 */
@Injectable()
export class SeoService {
  /** Resolved site-wide SEO config. */
  private readonly config: ISeoConfig;

  public constructor(
    @Optional() @Inject(ROUTING_CONFIG) routingConfig?: IRoutingModuleOptions,
    @Optional()
    @Inject(LOGGER_MANAGER)
    // Optional logger — the transformer never throws, but the
    // logger is wired so future work (e.g. absolutise() failures
    // on a broken canonical URL) can trace via the standard
    // routing channel.
    private readonly loggerManager?: ILoggerManager,
  ) {
    // Extract the site-wide SEO block from the routing config. The
    // block is typed `unknown` at the contract level (§F.1 scope), so
    // narrow through a runtime shape check before adopting the value.
    const seo = routingConfig?.seo as ISeoConfig | undefined;
    this.config = seo ?? {};
    if (!seo && routingConfig?.seo !== undefined) {
      // The config carried a non-object value under `seo` — log and
      // fall back to an empty config so downstream renders still
      // work.
      this.warn(
        `ROUTING_CONFIG.seo is set but is not an ISeoConfig object; falling back to defaults.`,
      );
    }
  }

  // ── Public API ─────────────────────────────────────────────────

  /**
   * Merge a chain of route descriptors (outermost first) on top of the
   * site-wide defaults.
   *
   * @param chain - Descriptors in outer-to-inner order.
   * @returns Resolved descriptor.
   */
  public resolve(chain: readonly ISeoDescriptor[]): ISeoDescriptor {
    // Prepend the site-wide defaults so route descriptors override
    // outward-in.
    const base = this.config.defaults ?? {};
    return mergeDescriptors([base, ...chain]);
  }

  /**
   * Produce the flat `ISeoTag[]` for a descriptor chain. Consumed by
   * the F.2 `<SeoHead />` component and the F.3 prerender walker.
   *
   * @param chain - Descriptors in outer-to-inner order.
   * @returns Flat tag list ready for React or HTML rendering.
   */
  public collect(chain: readonly ISeoDescriptor[]): ISeoTag[] {
    const resolved = this.resolve(chain);
    return buildSeoTags(resolved, this.config.baseUrl);
  }

  /**
   * Expose the merged base URL — used by the F.3 prerender walker
   * to absolutise the shell links it emits.
   *
   * @returns Base URL (or `undefined` when unset).
   */
  public getBaseUrl(): string | undefined {
    return this.config.baseUrl;
  }

  // ── Private ────────────────────────────────────────────────────

  /**
   * Emit a warning through the optional logger. Fail-soft — the SEO
   * service must survive without a logger wired.
   */
  private warn(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.seo").warn(message);
    } catch {
      // fail-soft — logger failures never block rendering.
    }
  }
}

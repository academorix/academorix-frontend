/**
 * @file csp.service.ts
 * @module @stackra/csp/core/services
 * @description Builds Content-Security-Policy headers.
 *
 *   Resolves directives from the injected configuration, merges in
 *   feature-scoped registry contributions, replaces `'nonce'` placeholders
 *   with a fresh cryptographic nonce, and produces the full header string.
 */

import { Injectable, Inject } from "@stackra/container";
import { CSP_CONFIG, CSP_REGISTRY } from "@stackra/contracts";
import type { ICspService, ICspPolicyResult } from "@stackra/contracts";

import { NonceGenerator } from "./nonce-generator.service";
import { CspRegistry } from "../registries/csp.registry";
import type { CspModuleOptions } from "../interfaces/csp-module-options.interface";
import type { CspSource } from "../types/csp-source.type";

/**
 * Internal directive map type.
 */
type DirectiveMap = Array<[string, CspSource[]]>;

/**
 * CspService — generates Content-Security-Policy headers.
 *
 * @example
 * ```typescript
 * const policy = cspService.generatePolicy();
 * response.headers.set(policy.headerName, policy.header);
 * ```
 */
@Injectable()
export class CspService implements ICspService {
  /**
   * Cached policy for SPA mode (generated once, reused).
   */
  private cachedPolicy: ICspPolicyResult | null = null;

  /**
   * @param config - CSP module configuration injected via DI.
   * @param nonceGenerator - Cryptographic nonce generator.
   * @param registry - Feature-scoped CSP contributions registry.
   */
  public constructor(
    @Inject(CSP_CONFIG) private readonly config: CspModuleOptions,
    private readonly nonceGenerator: NonceGenerator,
    @Inject(CSP_REGISTRY) private readonly registry: CspRegistry,
  ) {}

  /**
   * Generate a fresh CSP policy with a new nonce. Each call produces a
   * unique nonce — use `getPolicy()` for stable SPA-mode reuse.
   *
   * @returns The generated policy with nonce and header string.
   */
  public generatePolicy(): ICspPolicyResult {
    const nonce = this.config.nonce !== false ? this.nonceGenerator.generate() : "";
    const directives = this.buildDirectives(nonce);
    const header = this.serializeDirectives(directives);
    const headerName = this.config.reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";

    return { nonce, header, headerName };
  }

  /**
   * Get a cached policy (generates once, returns the same instance). Use
   * in SPA mode where the nonce is stable for the page lifetime.
   *
   * @returns The cached policy.
   */
  public getPolicy(): ICspPolicyResult {
    if (!this.cachedPolicy) {
      this.cachedPolicy = this.generatePolicy();
    }

    return this.cachedPolicy;
  }

  /**
   * Reset the cached policy. Forces regeneration on the next `getPolicy()`.
   */
  public resetPolicy(): void {
    this.cachedPolicy = null;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  /**
   * Build the directive map from configuration + registry contributions.
   * Merges root config sources with feature-scoped registry sources,
   * de-duplicates, then resolves nonce placeholders.
   *
   * @param nonce - The generated nonce value.
   * @returns Array of [directive-name, sources] tuples.
   */
  private buildDirectives(nonce: string): DirectiveMap {
    const directives: DirectiveMap = [];
    const registrySources = this.registry.merge();

    const add = (
      name: string,
      configSources: CspSource[] | undefined,
      registryKey: keyof typeof registrySources,
      defaults: CspSource[],
    ): void => {
      const base = configSources ?? defaults;
      const extra = registrySources[registryKey] ?? [];

      // Merge and de-duplicate.
      const combined: CspSource[] = [...base];
      for (const source of extra) {
        if (!combined.includes(source)) {
          combined.push(source);
        }
      }

      // Resolve nonce placeholders.
      const resolved = nonce
        ? combined.map((v) => (v === "'nonce'" ? `'nonce-${nonce}'` : v))
        : combined.filter((v) => v !== "'nonce'");

      directives.push([name, resolved]);
    };

    add("default-src", this.config.defaultSrc, "defaultSrc", ["'self'"]);
    add("script-src", this.config.scriptSrc, "scriptSrc", ["'self'", "'nonce'"]);
    add("style-src", this.config.styleSrc, "styleSrc", ["'self'", "'unsafe-inline'"]);
    add("img-src", this.config.imgSrc, "imgSrc", ["'self'", "data:"]);
    add("connect-src", this.config.connectSrc, "connectSrc", ["'self'"]);
    add("font-src", this.config.fontSrc, "fontSrc", ["'self'"]);
    add("frame-src", this.config.frameSrc, "frameSrc", ["'none'"]);
    add("object-src", this.config.objectSrc, "objectSrc", ["'none'"]);
    add("worker-src", this.config.workerSrc, "workerSrc", ["'self'"]);
    add("media-src", this.config.mediaSrc, "mediaSrc", ["'self'"]);
    add("base-uri", this.config.baseUri, "baseUri", ["'self'"]);
    add("form-action", this.config.formAction, "formAction", ["'self'"]);

    if (this.config.upgradeInsecureRequests) {
      directives.push(["upgrade-insecure-requests", []]);
    }

    if (this.config.reportUri) {
      directives.push(["report-uri", [this.config.reportUri]]);
    }

    return directives;
  }

  /**
   * Serialize directives into a CSP header string.
   *
   * @param directives - The directive map.
   * @returns The serialized header value.
   */
  private serializeDirectives(directives: DirectiveMap): string {
    return directives
      .map(([name, sources]) => {
        if (sources.length === 0) return name;
        return `${name} ${sources.join(" ")}`;
      })
      .join("; ");
  }
}

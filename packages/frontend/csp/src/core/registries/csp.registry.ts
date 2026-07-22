/**
 * @file csp.registry.ts
 * @module @stackra/csp/core/registries
 * @description Registry for feature-scoped CSP source contributions.
 *
 *   Each `CspModule.forFeature()` call — or `@CspPolicy()`-decorated class
 *   discovered at bootstrap — registers one `CspFeaturePolicy` entry keyed
 *   by its `name`. The `CspService` reads the merged sources from this
 *   registry when building the policy header, so feature modules can
 *   declare the external origins they need without the app having to track
 *   them centrally.
 *
 *   Standalone — backed by a plain internal `Map<string, CspFeaturePolicy>`.
 */

import { Injectable } from "@stackra/container";
import { Str } from "@stackra/support";

import type { CspFeaturePolicy } from "../interfaces/csp-feature-policy.interface";
import type { MergedCspSources } from "../types/merged-csp-sources.type";

/**
 * Internal directive key list — kept in sync with `CspFeaturePolicy`.
 */
type DirectiveKey =
  | "defaultSrc"
  | "scriptSrc"
  | "styleSrc"
  | "imgSrc"
  | "connectSrc"
  | "fontSrc"
  | "frameSrc"
  | "objectSrc"
  | "workerSrc"
  | "mediaSrc"
  | "baseUri"
  | "formAction";

/**
 * All directive keys for iteration.
 */
const DIRECTIVE_KEYS: DirectiveKey[] = [
  "defaultSrc",
  "scriptSrc",
  "styleSrc",
  "imgSrc",
  "connectSrc",
  "fontSrc",
  "frameSrc",
  "objectSrc",
  "workerSrc",
  "mediaSrc",
  "baseUri",
  "formAction",
];

/**
 * CspRegistry — manages feature-scoped CSP contributions.
 *
 * Each feature registers its required external origins under a unique
 * name. The `CspService` calls `merge()` to combine all contributions
 * into a single sources map that gets merged with the root config.
 *
 * @example
 * ```typescript
 * registry.register('stripe', {
 *   name: 'stripe',
 *   scriptSrc: ['https://js.stripe.com'],
 *   frameSrc: ['https://hooks.stripe.com'],
 * });
 * ```
 */
@Injectable()
export class CspRegistry {
  /** Feature policies keyed by their `name`. */
  private readonly policies = new Map<string, CspFeaturePolicy>();

  /**
   * Register a feature-scoped CSP contribution. Adds (or replaces) the
   * contribution under its `name`. Entries with an empty name are ignored.
   *
   * @param name - The unique contribution name.
   * @param policy - The feature's CSP contribution.
   */
  public register(name: string, policy: CspFeaturePolicy): void {
    if (!name || Str.isEmpty(name)) return;
    this.policies.set(name, policy);
  }

  /**
   * Register a policy using its internal `name` field as the key.
   * Convenience for `forFeature()` seed loaders and discovery.
   *
   * @param policy - The feature's CSP contribution (must have a `name`).
   */
  public registerPolicy(policy: CspFeaturePolicy): void {
    this.register(policy.name, policy);
  }

  /**
   * Get all registered contribution names.
   *
   * @returns Array of registered names.
   */
  public getNames(): string[] {
    return [...this.policies.keys()];
  }

  /**
   * Get all registered contributions.
   *
   * @returns Array of policy contributions.
   */
  public getAll(): CspFeaturePolicy[] {
    return [...this.policies.values()];
  }

  /**
   * Merge all registered contributions into a single sources map.
   *
   * Returns a map keyed by directive name (e.g. `scriptSrc`) with the
   * combined source list across every registered contribution. Sources
   * are de-duplicated while preserving first-seen order.
   *
   * @returns Map of directive key → unique sources.
   */
  public merge(): MergedCspSources {
    const merged: MergedCspSources = {
      defaultSrc: [],
      scriptSrc: [],
      styleSrc: [],
      imgSrc: [],
      connectSrc: [],
      fontSrc: [],
      frameSrc: [],
      objectSrc: [],
      workerSrc: [],
      mediaSrc: [],
      baseUri: [],
      formAction: [],
    };

    for (const policy of this.policies.values()) {
      for (const directive of DIRECTIVE_KEYS) {
        const sources = policy[directive];
        if (!sources || sources.length === 0) continue;

        for (const source of sources) {
          if (!merged[directive].includes(source)) {
            merged[directive].push(source);
          }
        }
      }
    }

    return merged;
  }
}

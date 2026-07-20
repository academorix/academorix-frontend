/**
 * @file consent-registry.service.ts
 * @module @stackra/consent/core/services
 * @description Registry for consent category definitions.
 *
 *   Owns its own state and population: implements `OnModuleInit` and
 *   seeds the categories from the injected `CONSENT_CONFIG` during the
 *   module-init lifecycle phase (no bootstrap class, no side-effect
 *   factory).
 */

import { Injectable, Inject } from '@stackra/container';
import type { OnModuleInit } from '@stackra/contracts';

import { CONSENT_CONFIG } from '@stackra/contracts';
import type { IConsentCategory } from '@stackra/contracts';
import type { IConsentModuleOptions } from '../types';

/**
 * Consent category registry.
 *
 * Maintains the complete set of consent categories configured for the
 * application and provides lookup / filtering helpers. Populated in
 * `onModuleInit()` from the merged module configuration.
 *
 * @example
 * ```typescript
 * const registry = container.get(ConsentRegistry);
 * const required = registry.getRequired();
 * const marketing = registry.getCategory('marketing');
 * ```
 */
@Injectable()
export class ConsentRegistry implements OnModuleInit {
  /** Internal store of registered consent categories. */
  private categories: IConsentCategory[] = [];

  /**
   * @param config - Merged consent module configuration.
   */
  public constructor(@Inject(CONSENT_CONFIG) private readonly config: IConsentModuleOptions) {}

  /** Seed the registry from configuration during module init. */
  public onModuleInit(): void {
    this.populate(this.config.categories ?? []);
  }

  /**
   * Populate the registry with consent categories (replaces existing).
   *
   * @param categories - Array of consent category definitions to register.
   */
  public populate(categories: IConsentCategory[]): void {
    this.categories = [...categories];
  }

  /**
   * Get all registered consent categories.
   *
   * @returns Array of all consent category definitions.
   */
  public getCategories(): IConsentCategory[] {
    return this.categories;
  }

  /**
   * Get a single category by its slug.
   *
   * @param slug - Category slug identifier (e.g. `'analytics'`).
   * @returns The category definition, or `undefined` if not found.
   */
  public getCategory(slug: string): IConsentCategory | undefined {
    return this.categories.find((c) => c.slug === slug);
  }

  /**
   * Get all categories marked as required (always granted, cannot revoke).
   *
   * @returns Array of required category definitions.
   */
  public getRequired(): IConsentCategory[] {
    return this.categories.filter((c) => c.required);
  }

  /**
   * Get all categories that are not required (user can toggle).
   *
   * @returns Array of non-required category definitions.
   */
  public getNonRequired(): IConsentCategory[] {
    return this.categories.filter((c) => !c.required);
  }
}

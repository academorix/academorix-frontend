/**
 * @file organization-input.interface.ts
 * @module @stackra/routing/seo/interfaces
 * @description Input shape for the `organization(...)` JSON-LD
 *   builder — Schema.org `Organization` node fields.
 */

/**
 * Input shape for the `organization(...)` builder.
 */
export interface IOrganizationInput {
  /** Organization display name. */
  readonly name: string;
  /** Canonical organization URL. */
  readonly url: string;
  /** URL of the organization logo. */
  readonly logo?: string;
  /** Social profile URLs (`sameAs` links). */
  readonly sameAs?: readonly string[];
  /** Contact point for direct outreach. */
  readonly contactPoint?: {
    readonly telephone: string;
    readonly contactType: string;
  };
}

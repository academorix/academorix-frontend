/**
 * @file organization.util.ts
 * @module @stackra/routing/seo/json-ld
 * @description Schema.org `Organization` JSON-LD builder.
 *
 *   Represents a brand / company. Search engines display this in
 *   knowledge panels and rich results. Provides the sitelinks and
 *   sameAs cross-linking for social profiles.
 */

import type { IJsonLd } from "../interfaces/json-ld.interface";
import type { IOrganizationInput } from "../interfaces/organization-input.interface";

const CONTEXT = "https://schema.org" as const;

/**
 * Build a Schema.org `Organization` node.
 *
 * @param input - Organization fields.
 * @returns Well-formed JSON-LD node.
 *
 * @example
 * ```typescript
 * import { organization } from '@stackra/routing/seo';
 *
 * organization({ name: 'Acme', url: 'https://acme.com' });
 * ```
 */
export function organization(input: IOrganizationInput): IJsonLd {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    name: input.name,
    url: input.url,
    // Optional fields are conditionally spread so the emitted JSON is
    // minimal — Google's rich-result validator penalises empty keys.
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.sameAs ? { sameAs: input.sameAs } : {}),
    ...(input.contactPoint
      ? {
          contactPoint: { "@type": "ContactPoint", ...input.contactPoint },
        }
      : {}),
  };
}

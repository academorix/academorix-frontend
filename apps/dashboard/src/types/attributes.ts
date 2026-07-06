/**
 * @file attributes.ts
 * @module types/attributes
 *
 * @description
 * The dynamic-attribute (SDUI) definition types. These describe **attribute
 * sets** — named collections of typed fields bound to an entity type and
 * selected by a discriminator (`sport_key`) — that let records carry sport- and
 * tenant-specific fields without schema changes. The frontend renders/validates
 * these at runtime; the values live on the host record's `attributes` object.
 *
 * This is the frontend contract for the backend **Attributes** module.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §6 "Do we need attributes?", §10.9 "Attributes"
 */

import type { BaseModel } from "@/types/base";

/**
 * The data type of an attribute value. Drives coercion and default widget.
 */
export type AttributeType = "integer" | "decimal" | "boolean" | "string" | "select" | "date";

/**
 * The UI control used to edit an attribute. Maps to a HeroUI component in the
 * attribute renderer (`lib/attributes/attribute-field.tsx`).
 */
export type AttributeWidget = "input" | "number" | "slider" | "select" | "switch" | "date";

/**
 * Bilingual label for an attribute/group (en/ar), supporting RTL tenants.
 */
export interface LocalizedLabel {
  en: string;
  ar: string;
}

/**
 * An option for a `select`-type attribute.
 */
export interface AttributeOption {
  /** Stored value. */
  value: string;
  /** Display label (bilingual). */
  label: LocalizedLabel;
}

/**
 * Validation rules for an attribute value, enforced by the renderer.
 */
export interface AttributeValidation {
  required?: boolean;
  /** Minimum numeric value / string length. */
  min?: number;
  /** Maximum numeric value / string length. */
  max?: number;
  /** Step for numeric/slider widgets. */
  step?: number;
}

/**
 * A single dynamic attribute definition.
 */
export interface Attribute {
  /** Stable machine code stored as the key in the host's `attributes` object. */
  code: string;
  /** Bilingual field label. */
  label: LocalizedLabel;
  type: AttributeType;
  widget: AttributeWidget;
  validation: AttributeValidation;
  /** Options for `select` attributes; omitted otherwise. */
  options?: AttributeOption[];
  /** Sort order within its group. */
  order: number;
}

/**
 * A visual group of attributes (e.g. "Primary Stats", "Physical Profile").
 */
export interface AttributeGroup {
  code: string;
  label: LocalizedLabel;
  /** Optional icon name for the group header. */
  icon?: string;
  /** Whether the group can be collapsed in the form. */
  collapsible: boolean;
  order: number;
  attributes: Attribute[];
}

/**
 * A versioned **Attribute Set** — the collection of groups/fields bound to an
 * entity type and selected by a discriminator value (e.g. `sport_key`
 * = `"football"`). Historic records render against the version they were
 * recorded with.
 */
export interface AttributeSet extends BaseModel {
  /** Stable set code, e.g. `"athlete_enrollment.football"`. */
  code: string;
  /** The host entity type, e.g. `"athlete_enrollment"`. */
  entity_type: string;
  /** Discriminator field name, e.g. `"sport_key"`. */
  discriminator_field: string;
  /** Discriminator value that selects this set, e.g. `"football"`. */
  discriminator_value: string;
  /** Monotonic version; bumped on breaking change. */
  version: number;
  groups: AttributeGroup[];
}

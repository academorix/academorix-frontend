/**
 * @file attribute.types.ts
 * @module lib/attributes/attribute.types
 *
 * @description
 * Runtime-facing types for the attribute (SDUI) renderer. The *definition*
 * shapes (`AttributeSet`, `AttributeGroup`, `Attribute`) live in
 * {@link "@/types/attributes"}; this module adds the value-bag and locale types
 * the renderer works with.
 */

/**
 * A bag of dynamic attribute values keyed by attribute `code`. This is exactly
 * the shape stored on a host record's `attributes` field.
 */
export type AttributeValues = Record<string, unknown>;

/** The locales attribute labels are authored in (RTL-aware). */
export type AttributeLocale = "en" | "ar";

/** A map of attribute `code` → validation error message (empty when valid). */
export type AttributeErrors = Record<string, string>;

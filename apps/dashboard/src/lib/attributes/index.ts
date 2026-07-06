/**
 * @file index.ts
 * @module lib/attributes
 *
 * @description
 * Public barrel for the attribute (SDUI) engine: the value/locale types, the
 * value helpers, the {@link useAttributeSet} loader, and the field/form/view
 * renderers. Import SDUI infrastructure from `@/lib/attributes`.
 */

export * from "@/lib/attributes/attribute.types";
export {
  attributeDefault,
  coerceAttributeValue,
  defaultAttributeValues,
  localize,
  validateAttribute,
  validateAttributeValues,
} from "@/lib/attributes/attribute-values";
export { useAttributeSet } from "@/lib/attributes/use-attribute-set";
export { AttributeField } from "@/lib/attributes/attribute-field";
export { AttributeForm } from "@/lib/attributes/attribute-form";
export { AttributeView } from "@/lib/attributes/attribute-view";

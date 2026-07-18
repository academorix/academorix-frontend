/**
 * @file singularize.ts
 * @module lib/singularize
 *
 * @description
 * Tiny English singulariser used for auto-deriving `"Athlete"` from
 * `"Athletes"` when a module manifest doesn't declare `meta.singularLabel`.
 * Not perfect, but covers the resource labels in the app today.
 */

const IRREGULAR: Record<string, string> = {
  people: "Person",
  children: "Child",
  data: "Datum",
};

export function singularize(label: string): string {
  const lower = label.toLowerCase();

  if (IRREGULAR[lower]) return IRREGULAR[lower];
  if (lower.endsWith("ies")) return label.slice(0, -3) + "y";
  if (
    lower.endsWith("sses") ||
    lower.endsWith("shes") ||
    lower.endsWith("ches") ||
    lower.endsWith("xes")
  ) {
    return label.slice(0, -2);
  }
  if (lower.endsWith("s") && !lower.endsWith("ss")) return label.slice(0, -1);

  return label;
}

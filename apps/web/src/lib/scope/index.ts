/**
 * @file index.ts
 * @module lib/scope
 *
 * @description
 * Public barrel for the working-scope layer: the {@link ScopeProvider} + context,
 * the {@link useScope} / {@link useTenant} hooks, the scope types, and the
 * {@link buildScopeFilters} helper that turns the active scope into Refine
 * filters. Import scope infrastructure from `@/lib/scope`.
 */

export * from "@/lib/scope/scope.types";
export { ScopeProvider, ScopeContext } from "@/lib/scope/scope-context";
export { useScope } from "@/lib/scope/use-scope";
export { useTenant } from "@/lib/scope/use-tenant";
export { buildScopeFilters } from "@/lib/scope/scope-filters";

/**
 * @file require-any.decorator.ts
 * @module @stackra/decorators/routing
 *
 * @description
 * `@RequireAny(clauses)` — stamps a disjunctive access-requirement on
 * a route component. Any single clause the caller satisfies grants
 * access.
 */

import { REQUIRE_ANY_METADATA_KEY } from "@stackra/contracts";

import { createMetadataClassDecorator, createMetadataReader } from "../core";

/**
 * A single disjunctive clause — the caller passes if it satisfies EITHER
 * the role OR the permission field (one or both may be set).
 */
export interface IRequireAnyClause {
  /** Role that grants access when present. */
  readonly role?: string;
  /** Permission that grants access when present. */
  readonly permission?: string;
}

/** Options for `@RequireAny(...)`. */
export interface IRequireAnyOptions {
  /** Ordered clauses — any single satisfied clause grants access. */
  readonly clauses: readonly IRequireAnyClause[];
}

/** Base decorator — stamps the metadata bag. */
const stamp = createMetadataClassDecorator<IRequireAnyOptions>(REQUIRE_ANY_METADATA_KEY);

/**
 * Stamp a disjunctive access requirement on the target class.
 *
 * @param clauses - Array of role / permission clauses.
 * @returns A `ClassDecorator` that stamps the requirement.
 *
 * @example
 * ```typescript
 * @RequireAny([{ role: 'admin' }, { permission: 'users.override' }])
 * export class AdminUsersPage { ... }
 * ```
 */
export function RequireAny(clauses: ReadonlyArray<IRequireAnyClause>): ClassDecorator {
  return stamp({ clauses });
}

/** Reader for `@RequireAny(...)` metadata. */
export const requireAnyMetadata =
  createMetadataReader<IRequireAnyOptions>(REQUIRE_ANY_METADATA_KEY);

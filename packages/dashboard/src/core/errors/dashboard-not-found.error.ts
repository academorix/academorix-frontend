/**
 * @file dashboard-not-found.error.ts
 * @module @stackra/dashboard/core/errors
 * @description Error thrown by the storage adapter when a dashboard id
 *   doesn't resolve (deleted, wrong tenant, wrong user).
 */

/**
 * Thrown when {@link IDashboardStorageAdapter.get} or
 * {@link IDashboardStorageAdapter.getBySlug} can't resolve the target.
 * Callers surface a 404 page or a toast.
 */
export class DashboardNotFoundError extends Error {
  /**
   * @param idOrSlug Identifier — either a UUID or a URL slug.
   */
  public constructor(idOrSlug: string) {
    super(`Dashboard "${idOrSlug}" not found.`);
    this.name = "DashboardNotFoundError";
  }
}

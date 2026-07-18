/**
 * @file duplicate-widget-cohort.error.ts
 * @module @stackra/dashboard/core/errors
 * @description Thrown by {@link WidgetCohortRegistry.register} when two
 *   cohort entries claim the same `key`. Same fail-loud rationale as
 *   {@link DuplicateWidgetKeyError} — two disagreeing cohorts silently
 *   merged is worse than one clean crash at boot.
 */

/**
 * Two cohort entries collided on the same `key`. Rename one — cohort
 * keys must be unique across the container.
 */
export class DuplicateWidgetCohortError extends Error {
  /** The colliding cohort key. */
  public readonly cohortKey: string;

  /**
   * @param cohortKey - The colliding cohort key.
   */
  public constructor(cohortKey: string) {
    super(
      `Duplicate widget-cohort key "${cohortKey}". Cohort keys must be unique across ` +
        `every module — rename one of the two and retry.`,
    );
    this.name = "DuplicateWidgetCohortError";
    this.cohortKey = cohortKey;
  }
}

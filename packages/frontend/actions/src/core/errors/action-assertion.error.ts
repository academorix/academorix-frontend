/**
 * @file action-assertion.error.ts
 * @module @stackra/actions/core/errors
 * @description ActionAssertionError — raised by the `@stackra/actions`
 *   test doubles (`assertActionDispatched`, mock dispatcher) when an
 *   expectation fails. Kept distinct from {@link ActionError} so
 *   production code can `instanceof`-narrow to real failures without
 *   catching test-only signals by accident.
 */

import { ActionError } from "./action.error";

/** Raised by test doubles when an assertion fails. */
export class ActionAssertionError extends ActionError {
  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, "ACTION_ASSERTION_ERROR", context);
    this.name = "ActionAssertionError";
  }
}

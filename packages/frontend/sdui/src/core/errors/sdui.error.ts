/**
 * @file sdui.error.ts
 * @module @stackra/sdui/core/errors
 * @description Base SDUI error and subclasses for version + validation
 *   failures.
 */

/**
 * Base SDUI error class.
 */
export class SduiError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  public constructor(message: string, code = "SDUI_ERROR", context?: Record<string, unknown>) {
    super(message);
    this.name = "SduiError";
    this.code = code;
    this.context = context;
  }
}

/** Raised when a screen carries an unsupported `schemaVersion`. */
export class SduiSchemaVersionError extends SduiError {
  public constructor(actual: number, supported: { min: number; max: number }) {
    super(
      `SDUI schema version ${actual} is out of range (supported ${supported.min}-${supported.max})`,
      "SDUI_SCHEMA_VERSION",
      { actual, supported },
    );
    this.name = "SduiSchemaVersionError";
  }
}

/** Raised when `assertValidScreen` finds structural issues. */
export class SduiValidationError extends SduiError {
  public readonly issues: readonly { path: string; message: string }[];
  public constructor(issues: readonly { path: string; message: string }[]) {
    super(`SDUI screen validation failed (${issues.length} issue(s))`, "SDUI_VALIDATION", {
      issues,
    });
    this.name = "SduiValidationError";
    this.issues = issues;
  }
}

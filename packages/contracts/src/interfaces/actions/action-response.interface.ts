/**
 * @file action-response.interface.ts
 * @module @stackra/contracts/interfaces/actions
 * @description Standardized return shape of every action handler.
 */

/**
 * Standardized return shape of every action handler.
 *
 * Handlers never throw — they return an `IActionResponse` with
 * `success: false` on failure, so the dispatcher's outer `try/catch`
 * remains defense-in-depth.
 */
export interface IActionResponse<T = unknown> {
  /** Whether the handler considers the action successful. */
  success: boolean;

  /** Data payload returned by the handler on success. */
  data?: T;

  /** Human-readable message describing success or failure. */
  message?: string;

  /** Field-level validation errors, when applicable. */
  errors?: Record<string, string[]>;

  /** Optional redirect URL surfaced to the caller. */
  redirectUrl?: string;

  /** Optional notification the caller should surface to the user. */
  notification?: {
    status: "info" | "success" | "warning" | "danger";
    title?: string;
    message: string;
  };
}

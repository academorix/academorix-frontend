<?php

declare(strict_types=1);

namespace Academorix\Application\Exceptions;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;

/**
 * Raised when a caller attempts to mutate a system-marked row
 * (`is_system = true`) on Application or BusinessType outside the
 * sanctioned mutation-allowed scope.
 *
 * The mutation-allowed scope is opened by the seeder (via
 * `BusinessType::allowSystemMutation(...)` closure) and by tests
 * that fixture system state. Every other write path — HTTP admin
 * mutations, Tinker one-liners, ad-hoc migrations — is refused by
 * the model's observer.
 *
 * ## Classification
 *
 *   - **HTTP status 422** — client sent a shape the domain refuses.
 *     Not a not-found (the row exists), not an auth failure (the
 *     actor may hold the permission bit) — the business rule
 *     `is_system = true → immutable` is what forbids the write.
 *   - **Severity `Warning`** — refused writes are noteworthy but not
 *     alertable. Reported to Sentry as warning-level; PSR-3 logs at
 *     `warning`.
 *   - **Category `Business`** — a domain invariant, not an
 *     infrastructure / integration / auth failure.
 *
 * @category Application
 *
 * @since    0.1.0
 */
final class SystemRowImmutableException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'application.system_row_immutable';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'application::errors.system_row_immutable';

    /**
     * HTTP status override — 422 (unprocessable entity). The row
     * exists and the actor may hold the permission bit; the write
     * is refused because the row's `is_system = true` invariant
     * forbids it.
     */
    protected int $httpStatus = 422;

    /**
     * Log-level severity override — a refused write on a locked row
     * is noteworthy but not error-grade. Reporters emit at
     * PSR-3 `warning`.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Warning;

    /**
     * Category override — business-rule violation, not infrastructure.
     */
    protected ErrorCategory $category = ErrorCategory::Business;

    /**
     * Convenience factory used by the observer's raise path.
     *
     * @param  string  $model   Model class (`Application`, `BusinessType`).
     * @param  string  $action  `update` / `delete` — the attempted operation.
     * @param  string  $rowId   The primary key of the row that refused the write.
     */
    public static function forAction(string $model, string $action, string $rowId): self
    {
        return (new self(sprintf(
            'Cannot %s the system %s row "%s" — use ::allowSystemMutation() from the seeder or tests.',
            $action,
            $model,
            $rowId,
        )))->withContext([
            'model'  => $model,
            'action' => $action,
            'row_id' => $rowId,
        ]);
    }
}

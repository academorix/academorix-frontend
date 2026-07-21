<?php

/**
 * @file packages/exceptions/src/Domain/InvariantViolationException.php
 *
 * @description
 * The application reached a state that should be impossible — an
 * invariant was broken. These are bugs, not user errors:
 *
 *   - Response is 500.
 *   - Severity is `Critical` so the reporter alerts on-call.
 *   - User message is deliberately generic so no internal detail
 *     leaks.
 *
 * ## Typical triggers
 *
 *   - A "one and only one" invariant returned zero or two rows.
 *   - A polymorphic association's `type` column no longer resolves
 *     to a class.
 *   - A state machine transitioned into a state absent from its
 *     enum.
 *   - An in-transaction unique constraint fired despite a
 *     `SELECT FOR UPDATE` guard.
 *
 * ## Translation key
 *
 *   exceptions::domain.invariant_violation
 *
 * @see \Stackra\Exceptions\StackraException  Base class.
 * @see DomainException  Preferred when the failure is a recoverable
 *                       business-rule outcome rather than a
 *                       "should never happen" state.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Domain;

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class InvariantViolationException extends StackraException
{
    /**
     * Machine-readable code — reporters use this literal to route
     * to the "please investigate" Sentry channel rather than the
     * expected-error dashboard. Treat as public API.
     */
    public const CODE = 'domain.invariant_violation';

    /**
     * Class-level translation key pointing at
     * `lang/en/domain.php → invariant_violation`. The copy is
     * intentionally generic in every locale — we don't want the
     * assertion text leaking to end users.
     */
    public const TRANSLATION_KEY = 'exceptions::domain.invariant_violation';

    /**
     * `Critical` severity — invariant failures are always
     * page-worthy. The JSON renderer will also mask the raw
     * `getMessage()` from clients in production because of this
     * severity level.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Critical;

    /**
     * `Business` category — kept adjacent to other domain-layer
     * failures on dashboards, but the `Critical` severity ensures
     * it can still be filtered separately from expected traffic.
     */
    protected ErrorCategory $category = ErrorCategory::Business;

    /**
     * 500 — invariant failures are always server bugs. Never map
     * one to 4xx; a client shouldn't need to know or care.
     */
    protected int $httpStatus = Response::HTTP_INTERNAL_SERVER_ERROR;

    /**
     * Named factory: describe which invariant broke.
     *
     * `$description` should be a short developer-facing statement
     * — this ends up in logs and Sentry, never in the user
     * response.
     *
     * @param  string  $description  Free-form developer-facing
     *                               assertion (e.g. "expected
     *                               exactly one primary_owner,
     *                               found 2"). Stored in
     *                               `context.assertion` and echoed
     *                               into `Throwable::getMessage()`
     *                               for stack traces.
     * @return static The fluent instance carrying the assertion in
     *                context.
     */
    public static function assertionFailed(string $description): static
    {
        return static::make("Invariant violation: {$description}")
            ->withContext(['assertion' => $description]);
    }
}

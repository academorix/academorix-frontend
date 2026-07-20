<?php

declare(strict_types=1);

namespace Academorix\Exceptions\Contracts;

use Throwable;

/**
 * Contract for classes that emit a side-effect for every reportable
 * exception — a log line, a Sentry event, a metric increment, a
 * webhook. Multiple reporters can be registered; all eligible
 * reporters run per exception with error isolation (one failing
 * reporter never blocks the others).
 *
 * Reporters must be idempotent. Laravel's handler may call `report()`
 * more than once on the same throwable when exceptions cascade
 * through multiple middleware layers.
 *
 * Shipped implementations:
 *
 *   - {@see \Academorix\Exceptions\Reporters\LogReporter}
 *     — Writes a structured, masked, PSR-3-aware log line.
 *   - {@see \Academorix\Exceptions\Reporters\SentryReporter}
 *     — Enriches Sentry scope with structured error metadata.
 *
 * Applications can register their own by tagging them
 * `academorix.exception.reporters` in the container.
 */
interface ExceptionReporterInterface
{
    /**
     * Whether this reporter should fire for the given throwable.
     * Return `false` when the exception isn't in scope for this
     * reporter (e.g. Sentry reporter skipping 404s that Laravel
     * already marked `dontReport`).
     */
    public function shouldReport(Throwable $throwable): bool;

    /**
     * Emit the side-effect. Called only when
     * {@see shouldReport()} returned `true`. Any exception thrown
     * from here is caught by the handler and swallowed —
     * reporters must never propagate their own failures.
     */
    public function report(Throwable $throwable): void;

    /**
     * Priority used to sort reporters. Higher runs first. Log
     * reporters should generally run before external reporters
     * (Sentry, Slack, PagerDuty) so a broken external service
     * doesn't cost us a local log line.
     */
    public function priority(): int;
}

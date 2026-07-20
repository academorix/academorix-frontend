<?php

/**
 * @file packages/exceptions/src/Http/ConflictException.php
 *
 * @description
 * HTTP 409 — the request cannot be completed because the current
 * state of the resource is incompatible. Covers three distinct
 * scenarios, each with its own named factory + translation key:
 *
 *   1. **Duplicate resource** on create (unique constraint hit).
 *      `exceptions::http.conflict_duplicate`
 *   2. **Optimistic-lock mismatch** — the client's `If-Match` ETag
 *      or `_version` field is stale.
 *      `exceptions::http.conflict_optimistic_lock`
 *   3. **Invalid state transition** — a state-machine edge doesn't
 *      exist.
 *      `exceptions::http.conflict_invalid_transition`
 *
 * Prefer these named factories over calling `make()` directly. They
 * populate `context` with the schema-friendly keys that dashboards
 * expect.
 *
 * ## Category vs. Severity
 *
 * Category is `Conflict` (not `Business`) so on-call dashboards can
 * separate optimistic-lock retries from actual rule violations.
 *
 * Severity is `Info` — a 409 is expected traffic in any concurrent
 * system.
 *
 * ## Translation keys
 *
 *   exceptions::http.conflict                     (class default)
 *   exceptions::http.conflict_duplicate           ({@see duplicate()})
 *   exceptions::http.conflict_optimistic_lock     ({@see optimisticLock()})
 *   exceptions::http.conflict_invalid_transition  ({@see invalidTransition()})
 *
 * @see \Academorix\Exceptions\AcademorixException  Base class.
 * @see \Academorix\Exceptions\Concerns\TranslatesMessages  Trait powering the translation setters.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Http;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class ConflictException extends AcademorixException
{
    /**
     * Stable machine-readable code exposed on the wire as
     * `error.code`. Clients branch on this literal — treat as
     * public API.
     */
    public const CODE = 'http.conflict';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → conflict`. Named factories override with
     * more specific keys.
     */
    public const TRANSLATION_KEY = 'exceptions::http.conflict';

    /**
     * `Info` severity — 409s are expected traffic under concurrent
     * load. Alerts should fire only on unusual volume, not per
     * throw.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * Dedicated `Conflict` category so dashboards separate
     * "state-shape conflict" (this class) from `Business`
     * (semantics), `Validation` (input shape), and `NotFound`.
     */
    protected ErrorCategory $category = ErrorCategory::Conflict;

    /**
     * Standard 409 status. Renderers map straight into the response
     * status; clients that implement retry-with-fresh-ETag flows
     * key off this literal.
     */
    protected int $httpStatus = Response::HTTP_CONFLICT;

    /**
     * Named factory: a unique constraint (DB or domain) was hit on
     * create.
     *
     * `$resource` is the domain noun ("email", "invoice_number"),
     * `$key` is the value the client tried to create — do NOT pass
     * anything sensitive here (passwords, tokens); the masker will
     * catch obvious ones but callers own the responsibility.
     *
     * @param  string  $resource  Domain-noun label for the resource
     *                            that collided ("email",
     *                            "workspace_slug"). Ends up in
     *                            both context and translation
     *                            parameters.
     * @param  string  $key       The specific value that already
     *                            exists. Callers MUST NOT pass
     *                            secrets here.
     * @return static The fluent instance with the more specific
     *                `conflict_duplicate` translation key applied.
     */
    public static function duplicate(string $resource, string $key): static
    {
        return static::make("Duplicate {$resource} for key {$key}.")
            ->withContext(['resource' => $resource, 'key' => $key])
            ->withTranslationParameters(['resource' => $resource, 'key' => $key])
            ->withTranslationKey('exceptions::http.conflict_duplicate');
    }

    /**
     * Named factory: the client's version marker (ETag / `_version`)
     * doesn't match the current server state.
     *
     * Populates context with `expected_version` (what the client
     * sent) and `actual_version` (what the server currently has),
     * plus the resource noun for grouping.
     *
     * @param  string      $resource  Domain-noun label of the
     *                                resource being edited.
     * @param  int|string  $expected  Version marker the client
     *                                submitted (ETag value, integer
     *                                `_version`, etc.).
     * @param  int|string  $actual    The current server-side value.
     * @return static The fluent instance with all three fields in
     *                context and the resource noun as a translation
     *                parameter.
     */
    public static function optimisticLock(string $resource, int|string $expected, int|string $actual): static
    {
        return static::make("Optimistic lock mismatch on {$resource}.")
            ->withContext([
                'resource' => $resource,
                'expected_version' => $expected,
                'actual_version' => $actual,
            ])
            ->withTranslationParameters(['resource' => $resource])
            ->withTranslationKey('exceptions::http.conflict_optimistic_lock');
    }

    /**
     * Named factory: state machine can't move `$from` → `$to`.
     *
     * Both endpoints are exposed to the client via translation
     * placeholders because state names ARE part of the public API
     * for state-machine resources (bookings, orders, drafts).
     *
     * @param  string  $from  Current state label — the state the
     *                        resource is actually in.
     * @param  string  $to    Attempted target state label — the
     *                        state the client tried to move to.
     * @return static The fluent instance with the transition
     *                endpoints in both context and translation
     *                parameters.
     */
    public static function invalidTransition(string $from, string $to): static
    {
        return static::make("State transition {$from} -> {$to} is not allowed.")
            ->withContext(['from' => $from, 'to' => $to])
            ->withTranslationParameters(['from' => $from, 'to' => $to])
            ->withTranslationKey('exceptions::http.conflict_invalid_transition');
    }
}

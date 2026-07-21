<?php

/**
 * @file packages/exceptions/src/Domain/TenantException.php
 *
 * @description
 * Tenancy scope violation. 400 by default because the caller sent
 * a request that spans tenants or lacks a tenant context — that's a
 * client-side wiring problem, not a permission or auth issue.
 *
 * ## Distinct from `ForbiddenException`
 *
 *   - `ForbiddenException` → "you're the wrong user for this
 *     resource" (403).
 *   - `TenantException`    → "there is no resource on your tenant at
 *     that path" (400).
 *
 * ## Cross-tenant access escalation
 *
 * When `crossTenantAccess()` is used, the severity is bumped to
 * `Alert` and the category to `Security` — this is a genuine
 * incident signal (a request tried to read a resource on a tenant
 * it doesn't belong to). The audit logger and Sentry security
 * channel should both see it.
 *
 * ## Translation keys
 *
 *   exceptions::domain.tenancy                (class default)
 *   exceptions::domain.tenancy_missing        ({@see missingTenant()})
 *   exceptions::domain.tenancy_cross_tenant   ({@see crossTenantAccess()})
 *
 * @see \Stackra\Exceptions\Exception  Base class.
 * @see \Stackra\Exceptions\Auth\ForbiddenException  For same-tenant permission denials.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Domain;

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class TenantException extends Exception
{
    /**
     * Machine-readable code — clients that recover from
     * missing-tenant scenarios (e.g. re-select workspace) branch on
     * this literal. Treat as public API.
     */
    public const CODE = 'tenancy.violation';

    /**
     * Class-level translation key pointing at
     * `lang/en/domain.php → tenancy`. Named factories override with
     * more specific keys.
     */
    public const TRANSLATION_KEY = 'exceptions::domain.tenancy';

    /**
     * `Warning` severity for the class default (missing tenant is
     * usually a client bug). The {@see crossTenantAccess()} factory
     * bumps severity to `Alert` per-instance.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Warning;

    /**
     * `Tenancy` category for the class default. The
     * {@see crossTenantAccess()} factory switches to `Security` so
     * audit channels pick it up.
     */
    protected ErrorCategory $category = ErrorCategory::Tenancy;

    /**
     * 400 — a request without valid tenant context is a shape /
     * routing problem, not an auth failure. Clients that redirect
     * on 401/403 must NOT redirect on this literal.
     */
    protected int $httpStatus = Response::HTTP_BAD_REQUEST;

    /**
     * Named factory: no tenant context was resolved for the request.
     *
     * Typically fired by tenancy middleware when a subdomain,
     * header, or JWT claim can't be found.
     *
     * @return static The fluent instance with the more specific
     *                `tenancy_missing` translation key applied.
     */
    public static function missingTenant(): static
    {
        return static::make('No tenant context was resolved for the request.')
            ->withTranslationKey('exceptions::domain.tenancy_missing');
    }

    /**
     * Named factory: a request tried to touch a resource on a
     * different tenant than the caller belongs to.
     *
     * This is a security-relevant event, so we bump severity to
     * `Alert` and category to `Security` — the reporter will route
     * it accordingly, and the audit logger will pick it up because
     * of the category shift.
     *
     * @param  int|string  $requestedTenant  Tenant identifier the
     *                                       request tried to reach.
     * @param  int|string  $actualTenant     Tenant identifier the
     *                                       caller actually belongs
     *                                       to.
     * @return static The fluent instance carrying both tenant ids
     *                in context, with severity elevated to `Alert`
     *                and category to `Security`.
     */
    public static function crossTenantAccess(int|string $requestedTenant, int|string $actualTenant): static
    {
        return static::make("Cross-tenant access attempt: requested={$requestedTenant} actual={$actualTenant}")
            ->withContext([
                'requested_tenant' => $requestedTenant,
                'actual_tenant' => $actualTenant,
            ])
            ->withSeverity(ErrorSeverity::Alert)
            ->withCategory(ErrorCategory::Security)
            ->withTranslationKey('exceptions::domain.tenancy_cross_tenant');
    }
}

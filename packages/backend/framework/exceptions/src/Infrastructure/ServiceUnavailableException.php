<?php

/**
 * @file packages/exceptions/src/Infrastructure/ServiceUnavailableException.php
 *
 * @description
 * HTTP 503 — an internal dependency (DB, Redis, queue broker) is
 * unhealthy. Distinct from {@see IntegrationException} which covers
 * external third-party providers.
 *
 * Dashboards use this distinction to separate "our infra is down"
 * from "a vendor is down" — very different alerting playbooks.
 *
 * ## Severity
 *
 * `Critical` — internal-dependency outages are always page-worthy.
 *
 * ## Translation keys
 *
 *   exceptions::infrastructure.unavailable             (class default)
 *   exceptions::infrastructure.unavailable_dependency  ({@see dependency()})
 *
 * @see \Stackra\Exceptions\StackraException  Base class.
 * @see IntegrationException  For third-party (vendor) outages.
 * @see MaintenanceModeException  Subclass for the "planned downtime" flavour.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Infrastructure;

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class ServiceUnavailableException extends StackraException
{
    /**
     * Machine-readable code — treat as public API. Distinct from
     * `integration.upstream_error` so dashboards can chart internal
     * outages separately from vendor outages.
     */
    public const CODE = 'infrastructure.unavailable';

    /**
     * Class-level translation key pointing at
     * `lang/en/infrastructure.php → unavailable`. The
     * {@see dependency()} factory overrides with a more specific
     * key that includes the dependency name.
     */
    public const TRANSLATION_KEY = 'exceptions::infrastructure.unavailable';

    /**
     * `Critical` severity — internal dependency outages page
     * on-call. Never downgrade at the class level; if a specific
     * dependency is optional, override at the callsite.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Critical;

    /**
     * `Infrastructure` category — dedicated bucket separate from
     * `Integration` so dashboards and alerting playbooks can route
     * each set of alerts to the right team.
     */
    protected ErrorCategory $category = ErrorCategory::Infrastructure;

    /**
     * 503 — the standard "service unavailable" status. Paired with
     * a `Retry-After:` header by the renderer, sourced from
     * {@see StackraException::retryAfter()}.
     */
    protected int $httpStatus = Response::HTTP_SERVICE_UNAVAILABLE;

    /**
     * Named factory: identify the dependency that's unhealthy.
     *
     * Also sets a default `retryAfter` of 30 seconds — enough time
     * for a health checker to have marked the node dead and load
     * balancer to route away from it.
     *
     * @param  string  $name  Dependency identifier ("mysql",
     *                        "redis-cache", "sqs"). Stable across
     *                        releases — dashboards group by this
     *                        literal.
     * @return static The fluent instance with `context.dependency`
     *                populated, a default 30s `retryAfter`, and the
     *                `unavailable_dependency` translation key
     *                applied.
     */
    public static function dependency(string $name): static
    {
        return static::make("Dependency [{$name}] is unavailable.")
            ->withContext(['dependency' => $name])
            ->withRetryAfter(30)
            ->withTranslationParameters(['dependency' => $name])
            ->withTranslationKey('exceptions::infrastructure.unavailable_dependency');
    }
}

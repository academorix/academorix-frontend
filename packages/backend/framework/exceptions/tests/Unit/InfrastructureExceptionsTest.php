<?php

/**
 * @file packages/exceptions/tests/Unit/InfrastructureExceptionsTest.php
 *
 * @description
 * Unit coverage for the infrastructure exception family:
 *
 *   - {@see \Stackra\Exceptions\Infrastructure\IntegrationException}
 *     — third-party service returned an error / bad payload.
 *   - {@see \Stackra\Exceptions\Infrastructure\TimeoutException}
 *     — upstream call exceeded its time budget.
 *   - {@see \Stackra\Exceptions\Infrastructure\ServiceUnavailableException}
 *     — an internal dependency (DB, cache, queue) is down.
 *   - {@see \Stackra\Exceptions\Infrastructure\MaintenanceModeException}
 *     — planned downtime.
 *   - {@see \Stackra\Exceptions\Infrastructure\ConfigurationException}
 *     — the app can't boot because config is missing / invalid.
 *
 * ## What each test locks in
 *
 *   - Class-level metadata (code / status / severity / category /
 *     translationKey) is the public API surface — every field
 *     assertion is deliberate.
 *   - Named factories populate structured `context` for dashboards
 *     and structured `translationParameters` for localised copy.
 *   - The severity tier per class encodes on-call escalation:
 *
 *       ConfigurationException::class     → Emergency (page)
 *       ServiceUnavailableException::class → Critical (page)
 *       IntegrationException::class       → Error (alert)
 *       TimeoutException::class           → Warning (dashboard)
 */

declare(strict_types=1);

use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Stackra\Exceptions\Infrastructure\ConfigurationException;
use Stackra\Exceptions\Infrastructure\IntegrationException;
use Stackra\Exceptions\Infrastructure\MaintenanceModeException;
use Stackra\Exceptions\Infrastructure\ServiceUnavailableException;
use Stackra\Exceptions\Infrastructure\TimeoutException;
use Stackra\Foundation\Support\CorrelationId;

afterEach(function (): void {
    CorrelationId::forget();
});

// -----------------------------------------------------------------
// IntegrationException::upstream
// -----------------------------------------------------------------

it('IntegrationException carries Integration + Error + 502 metadata', function (): void {
    $e = IntegrationException::make();

    // 502 Bad Gateway — the standard status for "we called an
    // upstream and it broke". Error severity: alert but don't page.
    expect($e->errorCode())->toBe('integration.upstream_error')
        ->and($e->httpStatus())->toBe(502)
        ->and($e->severity())->toBe(ErrorSeverity::Error)
        ->and($e->category())->toBe(ErrorCategory::Integration)
        ->and($e->translationKey())->toBe('exceptions::infrastructure.upstream_error');
});

it('IntegrationException::upstream captures service + status + payload context', function (): void {
    // The named factory captures three orthogonal signals: which
    // service, what status it returned, and the payload (bounded
    // and masked downstream, but stored raw here).
    $e = IntegrationException::upstream('stripe', 502, ['x' => 'y']);

    expect($e)->toBeInstanceOf(IntegrationException::class)
        ->and($e->context())->toMatchArray([
            'service' => 'stripe',
            'upstream_status' => 502,
            'payload' => ['x' => 'y'],
        ])
        // Named factory swaps to a more specific key that carries
        // the service name.
        ->and($e->translationKey())->toBe('exceptions::infrastructure.upstream_error_named')
        ->and($e->translationParameters())->toMatchArray(['service' => 'stripe']);
});

it('IntegrationException::upstream chains a previous throwable', function (): void {
    // `$previous` is critical — Sentry needs the original stack,
    // not the wrapper's.
    $cause = new RuntimeException('network unreachable');
    $e = IntegrationException::upstream('stripe', null, [], $cause);

    expect($e->getPrevious())->toBe($cause)
        ->and($e->context())->toMatchArray([
            'service' => 'stripe',
            // Null status is meaningful — it means "call didn't even
            // reach the upstream" (DNS failure, connection refused).
            'upstream_status' => null,
            'payload' => [],
        ]);
});

// -----------------------------------------------------------------
// TimeoutException::afterSeconds
// -----------------------------------------------------------------

it('TimeoutException carries Warning + 504 metadata but inherits Integration category', function (): void {
    $e = TimeoutException::make();

    // Timeout is a specialisation of upstream failure — inherits
    // category `Integration` so dashboards can chart total upstream
    // issues, but has its own code + status so a "timeout" event
    // is distinguishable from a "502 with a body".
    expect($e)->toBeInstanceOf(IntegrationException::class)
        ->and($e->errorCode())->toBe('integration.timeout')
        ->and($e->httpStatus())->toBe(504)
        ->and($e->severity())->toBe(ErrorSeverity::Warning)
        ->and($e->category())->toBe(ErrorCategory::Integration)
        ->and($e->translationKey())->toBe('exceptions::infrastructure.timeout');
});

it('TimeoutException::afterSeconds records service + timeout budget', function (): void {
    $e = TimeoutException::afterSeconds('openai', 8.5);

    expect($e)->toBeInstanceOf(TimeoutException::class)
        ->and($e->context())->toMatchArray([
            'service' => 'openai',
            'timeout_seconds' => 8.5,
        ])
        ->and($e->translationKey())->toBe('exceptions::infrastructure.timeout_named')
        ->and($e->translationParameters())->toMatchArray([
            'service' => 'openai',
            'seconds' => 8.5,
        ]);
});

// -----------------------------------------------------------------
// ServiceUnavailableException::dependency
// -----------------------------------------------------------------

it('ServiceUnavailableException carries Infrastructure + Critical + 503 metadata', function (): void {
    $e = ServiceUnavailableException::make();

    // 503 with Critical severity — DB / cache / queue outages page
    // on-call because the app can't serve.
    expect($e->errorCode())->toBe('infrastructure.unavailable')
        ->and($e->httpStatus())->toBe(503)
        ->and($e->severity())->toBe(ErrorSeverity::Critical)
        ->and($e->category())->toBe(ErrorCategory::Infrastructure)
        ->and($e->translationKey())->toBe('exceptions::infrastructure.unavailable');
});

it('ServiceUnavailableException::dependency defaults retryAfter to 30 seconds', function (): void {
    // 30s is a reasonable default retry budget — enough time for a
    // typical dep to recover from a hiccup without hammering it.
    $e = ServiceUnavailableException::dependency('redis');

    expect($e)->toBeInstanceOf(ServiceUnavailableException::class)
        ->and($e->retryAfter())->toBe(30)
        ->and($e->context())->toMatchArray(['dependency' => 'redis'])
        ->and($e->translationKey())->toBe('exceptions::infrastructure.unavailable_dependency')
        ->and($e->translationParameters())->toMatchArray(['dependency' => 'redis']);
});

// -----------------------------------------------------------------
// MaintenanceModeException::scheduled
// -----------------------------------------------------------------

it('MaintenanceModeException inherits Critical + 503 but overrides code + translation key', function (): void {
    $e = MaintenanceModeException::make();

    // Same status / severity as its parent but a distinct code so
    // dashboards can chart "planned downtime" separately from
    // "unplanned outage".
    expect($e)->toBeInstanceOf(ServiceUnavailableException::class)
        ->and($e->errorCode())->toBe('infrastructure.maintenance')
        ->and($e->translationKey())->toBe('exceptions::infrastructure.maintenance')
        ->and($e->httpStatus())->toBe(503);
});

it('MaintenanceModeException::scheduled with an explicit retryAfter overrides the default', function (): void {
    $e = MaintenanceModeException::scheduled(120);

    expect($e)->toBeInstanceOf(MaintenanceModeException::class)
        ->and($e->retryAfter())->toBe(120);
});

it('MaintenanceModeException::scheduled(null) leaves retryAfter unset', function (): void {
    // The named factory does NOT invoke the parent's `dependency()`
    // default — it only wires retryAfter when the caller passes one.
    $e = MaintenanceModeException::scheduled(null);

    expect($e->retryAfter())->toBeNull();
});

// -----------------------------------------------------------------
// ConfigurationException::missing / invalid
// -----------------------------------------------------------------

it('ConfigurationException carries Infrastructure + Emergency + 500 metadata', function (): void {
    $e = ConfigurationException::make();

    // Emergency severity: config errors mean the app can't function.
    // Every one pages on-call because production shouldn't ever
    // reach this state.
    expect($e->errorCode())->toBe('infrastructure.configuration')
        ->and($e->httpStatus())->toBe(500)
        ->and($e->severity())->toBe(ErrorSeverity::Emergency)
        ->and($e->category())->toBe(ErrorCategory::Infrastructure)
        ->and($e->translationKey())->toBe('exceptions::infrastructure.configuration');
});

it('ConfigurationException::missing records the config key path', function (): void {
    $e = ConfigurationException::missing('services.stripe.secret');

    // Key path in context AND in the developer message — the
    // former for grouping, the latter for grep-ability in logs.
    expect($e)->toBeInstanceOf(ConfigurationException::class)
        ->and($e->context())->toMatchArray(['config_key' => 'services.stripe.secret'])
        ->and($e->getMessage())->toContain('services.stripe.secret');
});

it('ConfigurationException::invalid records config key + reason', function (): void {
    $e = ConfigurationException::invalid('services.openai.model', 'model not on allow-list');

    expect($e->context())->toMatchArray([
        'config_key' => 'services.openai.model',
        'reason' => 'model not on allow-list',
    ])
        // Reason surfaces in the dev message for immediate debug
        // without a Sentry dive.
        ->and($e->getMessage())->toContain('model not on allow-list');
});

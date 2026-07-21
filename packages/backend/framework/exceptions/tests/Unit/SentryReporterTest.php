<?php

/**
 * @file packages/exceptions/tests/Unit/SentryReporterTest.php
 *
 * @description
 * Unit coverage for {@see \Stackra\Exceptions\Reporters\SentryReporter},
 * the reporter that enriches Sentry scope with Stackra-structured
 * metadata BEFORE Sentry's own SDK ships the event.
 *
 * ## What these tests protect
 *
 *   1. **SDK-optional shape** — the reporter is safe to instantiate
 *      even when `sentry/sentry-laravel` is absent from the runtime.
 *      `shouldReport()` returns `false` in that case so `report()`
 *      is never called — every internal-only app pays no cost.
 *
 *   2. **Tag construction** — for `Exception` instances,
 *      the reporter builds tags like `error.code`, `error.category`,
 *      `error.severity`, `correlation_id`, plus request-derived
 *      tags like `tenant_id` / `route`. These are the fields
 *      Sentry indexes for search + alerting; a regression that
 *      drops them means dashboards silently lose grouping signal.
 *
 *   3. **Priority** — Sentry runs at priority 50, AFTER the local
 *      log reporter (100), so a broken Sentry SDK never robs us of
 *      the local log line.
 *
 * ## Why we don't boot Sentry
 *
 * We test the reporter's *inputs* to the SDK (tags + contexts) via
 * reflection into its own build helpers. Booting Sentry's runtime
 * would couple the tests to their SDK internals; keeping to the
 * reporter's own methods gives us stability against Sentry version
 * bumps.
 */

declare(strict_types=1);

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Auth\ForbiddenException;
use Stackra\Exceptions\Reporters\SentryReporter;
use Stackra\Exceptions\Support\Redactor;
use Orchestra\Testbench\TestCase;

uses(TestCase::class);

function makeSentryReporter(): SentryReporter
{
    return new SentryReporter(
        container: app(),
        redactor: new Redactor,
    );
}

// -----------------------------------------------------------------
// SDK availability probe
// -----------------------------------------------------------------

it('shouldReport returns false when the Sentry SDK is not loaded', function (): void {
    // The reporter guards with `function_exists('\Sentry\configureScope')`.
    // In our test runtime the Sentry SDK is a dev dependency — if
    // it's loaded, this test skips itself so we're not depending on
    // absence. If it's absent, we assert `shouldReport === false`.
    if (function_exists('Sentry\\configureScope')) {
        $this->markTestSkipped('Sentry SDK is present in this runtime; probe would return true.');
    }

    $reporter = makeSentryReporter();

    // Even for a bona-fide Stackra exception, `shouldReport`
    // returns false — the SDK is the gate.
    expect($reporter->shouldReport(ForbiddenException::make()))->toBeFalse();
});

// -----------------------------------------------------------------
// Tag construction (peek via reflection)
// -----------------------------------------------------------------

/**
 * Invoke the private `tags()` helper via reflection so we can
 * assert on the exact tag set without needing Sentry's SDK to be
 * loaded.
 *
 * @param  array<string, mixed>  $requestContext
 * @return array<string, string|null>
 */
function invokeSentryReporterTags(
    SentryReporter $reporter,
    Throwable $e,
    array $requestContext,
): array {
    $method = new ReflectionMethod(SentryReporter::class, 'tags');
    $method->setAccessible(true);

    /** @var array<string, string|null> $tags */
    $tags = $method->invoke($reporter, $e, $requestContext);

    return $tags;
}

it('builds tags with error.code, error.category, error.severity for an Exception', function (): void {
    // The three tags Sentry indexes hardest for search + alerting.
    $reporter = makeSentryReporter();

    $tags = invokeSentryReporterTags(
        $reporter,
        ForbiddenException::missingPermission('billing.write'),
        [],
    );

    expect($tags)->toMatchArray([
        'error.code' => 'auth.forbidden',
        'error.category' => 'authorization',
        'error.severity' => 'warning',
    ]);
});

it('omits Stackra-specific tags when the throwable is a bare framework exception', function (): void {
    // Non-Stackra exception → no `error.*` tags. Sentry still
    // captures it via the framework path; we just don't attach
    // metadata we don't have.
    $reporter = makeSentryReporter();

    $tags = invokeSentryReporterTags(
        $reporter,
        new RuntimeException('framework-level'),
        [],
    );

    expect($tags)->not->toHaveKey('error.code')
        ->and($tags)->not->toHaveKey('error.category')
        ->and($tags)->not->toHaveKey('error.severity');
});

it('includes tenant_id + route when the request context provides them', function (): void {
    // The exception-context middleware stashes these on the
    // request; the reporter pulls them into tags for grouping.
    $reporter = makeSentryReporter();

    $tags = invokeSentryReporterTags(
        $reporter,
        ForbiddenException::make(),
        [
            'tenant_id' => 'acme',
            'route' => 'invoices.show',
        ],
    );

    expect($tags)->toMatchArray([
        'tenant_id' => 'acme',
        'route' => 'invoices.show',
    ]);
});

it('omits tenant_id and route when the request context does not carry them', function (): void {
    // Absent keys must NOT become empty-string tags — the reporter
    // just leaves them out so Sentry doesn't index blanks.
    $reporter = makeSentryReporter();

    $tags = invokeSentryReporterTags(
        $reporter,
        ForbiddenException::make(),
        [],
    );

    expect($tags)->not->toHaveKey('tenant_id')
        ->and($tags)->not->toHaveKey('route');
});

// -----------------------------------------------------------------
// Concrete tag values for every Stackra subclass shape
// -----------------------------------------------------------------

it('tags include the anonymous subclass severity as a string', function (): void {
    // Severity coming from a custom subclass with `Emergency`
    // severity — the tag value MUST be the enum's `->value` string.
    $reporter = makeSentryReporter();

    $exception = new class extends Exception
    {
        public const CODE = 'test.pagable';

        protected \Stackra\Exceptions\Enums\ErrorSeverity $severity
            = \Stackra\Exceptions\Enums\ErrorSeverity::Emergency;
    };

    $tags = invokeSentryReporterTags($reporter, $exception, []);

    expect($tags['error.severity'])->toBe('emergency');
});

// -----------------------------------------------------------------
// Priority
// -----------------------------------------------------------------

it('priority is 50 so Sentry runs after the local log reporter', function (): void {
    // Log (100) → Sentry (50) → any custom (lower). A broken Sentry
    // SDK never robs us of the local log line.
    $reporter = makeSentryReporter();

    expect($reporter->priority())->toBe(50);
});

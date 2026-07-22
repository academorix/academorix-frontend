<?php

/**
 * @file packages/exceptions/tests/Unit/JsonErrorFormatterTest.php
 *
 * @description
 * Locks in the wire-shape contract of {@see \Stackra\Exceptions\Formatters\JsonErrorFormatter}.
 * The formatter replaces the older `JsonErrorRenderer` and is the
 * primary path every API client sees.
 *
 * ## What these tests protect
 *
 *   1. **`canFormat()` gating** — the formatter must fire for JSON /
 *      API / XHR clients. Since the removal of the shipped Blade
 *      views on 2026-07-21 (Phase C1) it is the sole formatter
 *      in the workspace's default chain; the workspace is
 *      headless per ADR-0021.
 *
 *   2. **Envelope shape** — every top-level key documented in
 *      `ErrorEnvelope::jsonSerialize()` is present; masked fields
 *      appear or disappear based on the current
 *      {@see \Stackra\Exceptions\Support\MaskingPolicy}.
 *
 *   3. **Debug gating** — the `debug` block ships in local /
 *      development / testing envs and disappears in staging /
 *      production. This is the single most important security
 *      invariant of the whole formatter.
 *
 *   4. **`Retry-After` echo** — the exception's `retryAfter` MUST
 *      appear both as an HTTP response header and inside the body
 *      envelope. Two sources of truth on purpose — JS clients don't
 *      always parse headers.
 *
 * ## Why Testbench
 *
 * The formatter depends on {@see \Stackra\Foundation\Enums\AppEnvironment::current()}
 * which reads `config('app.env')`, and on the container-bound docs
 * URL from `config('exceptions.docs_url')`. Testbench boots a
 * minimal container so both are resolvable.
 */

declare(strict_types=1);

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Formatters\JsonErrorFormatter;
use Stackra\Exceptions\Http\TooManyRequestsException;
use Stackra\Exceptions\Support\ExceptionMapper;
use Stackra\Exceptions\Support\Redactor;
use Stackra\Exceptions\Support\TraceCleaner;
use Stackra\Foundation\Support\CorrelationId;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Orchestra\Testbench\TestCase;

uses(TestCase::class);

/**
 * A minimal concrete exception used by shape / masking cases. Keeps
 * the tests decoupled from any shipping subclass's defaults.
 */
if (! class_exists('JsonFormatterFixtureException', false)) {
    final class JsonFormatterFixtureException extends Exception
    {
        public const CODE = 'fixture.simple';

        public const TRANSLATION_KEY = 'exceptions::test.fixture_simple';

        // Deliberately unusual so the status echo is visibly wrong
        // when a regression hits.
        protected int $httpStatus = 418;
    }
}

beforeEach(function (): void {
    // Every test starts in local env so debug is on by default.
    // Individual tests override to `production` when they need the
    // masked branch.
    $this->app['config']->set('app.env', 'local');
    $this->app['config']->set('exceptions.docs_url', '');
    CorrelationId::forget();
});

afterEach(function (): void {
    CorrelationId::forget();
});

/**
 * Build a formatter with real support services. All three
 * dependencies are pure — no external I/O — so we don't need to
 * mock them.
 */
function makeJsonFormatter(): JsonErrorFormatter
{
    return new JsonErrorFormatter(
        mapper: new ExceptionMapper,
        redactor: new Redactor,
        traceCleaner: new TraceCleaner(stripPaths: false),
    );
}

// -----------------------------------------------------------------
// canFormat() — the four fire conditions
// -----------------------------------------------------------------

it('canFormat returns true for requests that expect JSON', function (): void {
    $formatter = makeJsonFormatter();

    $request = Request::create('/anything', 'GET');
    // Standard `Accept: application/json` — the primary fire signal.
    $request->headers->set('Accept', 'application/json');

    expect($formatter->canFormat($request))->toBeTrue();
});

it('canFormat returns true for requests under the /api/* prefix', function (): void {
    $formatter = makeJsonFormatter();

    // Bearer-token clients that omit the Accept header still get
    // JSON when they hit `/api/*`.
    $request = Request::create('/api/orders/1', 'GET');

    expect($formatter->canFormat($request))->toBeTrue();
});

it('canFormat returns true for XHR / ajax requests', function (): void {
    $formatter = makeJsonFormatter();

    $request = Request::create('/anywhere', 'POST');
    $request->headers->set('X-Requested-With', 'XMLHttpRequest');

    expect($formatter->canFormat($request))->toBeTrue();
});

it('canFormat returns false for browser HTML requests', function (): void {
    $formatter = makeJsonFormatter();

    // Bare browser navigation — Accept: text/html, no /api prefix,
    // no XHR header. HTML formatter should win.
    $request = Request::create('/orders/1', 'GET');
    $request->headers->set('Accept', 'text/html,application/xhtml+xml');

    expect($formatter->canFormat($request))->toBeFalse();
});

// -----------------------------------------------------------------
// format() — envelope shape
// -----------------------------------------------------------------

it('format returns a JsonResponse with the mapped HTTP status', function (): void {
    // Non-Stackra throwable → mapper wraps → renderer honours
    // the mapped `httpStatus`.
    $formatter = makeJsonFormatter();

    $response = $formatter->format(
        Request::create('/'),
        new JsonFormatterFixtureException('boom'),
    );

    expect($response)->toBeInstanceOf(JsonResponse::class)
        ->and($response->getStatusCode())->toBe(418);
});

it('format emits every documented top-level key of the error envelope', function (): void {
    CorrelationId::set('req_shape');

    $formatter = makeJsonFormatter();
    $response = $formatter->format(
        Request::create('/'),
        new JsonFormatterFixtureException('boom'),
    );

    $body = $response->getData(assoc: true);

    // Envelope invariant: everything nests under `error`.
    expect($body)->toHaveKey('error')
        ->and($body['error'])->toHaveKeys(['type', 'code', 'title', 'status'])
        ->and($body['error']['code'])->toBe('fixture.simple')
        ->and($body['error']['status'])->toBe(418)
        ->and($body['error']['correlationId'])->toBe('req_shape')
        // Default `type` uses the URN scheme so responses stay
        // parseable even when no docs URL is configured.
        ->and($body['error']['type'])->toBe('urn:stackra:error:fixture.simple');
});

it('format uses config(exceptions.docs_url) to build the type URI when set', function (): void {
    $this->app['config']->set('exceptions.docs_url', 'https://docs.example.com/errors/');

    $formatter = makeJsonFormatter();
    $body = $formatter
        ->format(Request::create('/'), new JsonFormatterFixtureException('boom'))
        ->getData(assoc: true);

    // Trailing slash on the config value must be normalised — we
    // don't want `.../errors//code`.
    expect($body['error']['type'])->toBe('https://docs.example.com/errors/fixture.simple');
});

// -----------------------------------------------------------------
// Debug block gating — the security-critical branch
// -----------------------------------------------------------------

it('includes error.debug in local env', function (): void {
    $this->app['config']->set('app.env', 'local');

    $formatter = makeJsonFormatter();
    $body = $formatter
        ->format(Request::create('/'), new JsonFormatterFixtureException('boom'))
        ->getData(assoc: true);

    // Debug block MUST carry class / file / line / trace so local
    // devs can diagnose without an external tool.
    expect($body['error'])->toHaveKey('debug')
        ->and($body['error']['debug'])->toHaveKeys(['class', 'file', 'line', 'trace']);
});

it('omits error.debug in production env', function (): void {
    // This is the security-critical branch — every prod deploy
    // depends on it. Any regression that flips this ships an
    // internal stack trace to public clients.
    $this->app['config']->set('app.env', 'production');

    $formatter = makeJsonFormatter();
    $body = $formatter
        ->format(Request::create('/'), new JsonFormatterFixtureException('boom'))
        ->getData(assoc: true);

    expect($body['error'])->not->toHaveKey('debug');
});

// -----------------------------------------------------------------
// Retry-After — body + header pair
// -----------------------------------------------------------------

it('populates both error.retryAfter (body) and Retry-After (header) for 429s', function (): void {
    // Rate-limit responses ship the retry hint in TWO places.
    // Regressions that drop either one break clients that only
    // read the other.
    $formatter = makeJsonFormatter();

    $response = $formatter->format(
        Request::create('/'),
        TooManyRequestsException::exceeded(30),
    );
    $body = $response->getData(assoc: true);

    expect($response)->toBeInstanceOf(JsonResponse::class)
        ->and($response->getStatusCode())->toBe(429)
        ->and($body['error']['retryAfter'])->toBe(30)
        ->and($response->headers->get('Retry-After'))->toBe('30');
});

it('does not set a Retry-After header when the exception has no retryAfter', function (): void {
    // Bare fixture has retryAfter = null → no header should be set.
    $formatter = makeJsonFormatter();

    $response = $formatter->format(
        Request::create('/'),
        new JsonFormatterFixtureException('boom'),
    );

    expect($response->headers->has('Retry-After'))->toBeFalse();
});

// -----------------------------------------------------------------
// priority() — formatter chain ordering
// -----------------------------------------------------------------

it('priority is 100 so JSON wins over the HTML formatter (10)', function (): void {
    // The Handler sorts by priority descending; 100 > 10 means
    // JSON is checked first, which is what we want for API traffic.
    $formatter = makeJsonFormatter();

    expect($formatter->priority())->toBe(100);
});

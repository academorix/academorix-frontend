<?php

/**
 * @file packages/foundation/tests/Unit/AssignCorrelationIdMiddlewareTest.php
 *
 * @description
 * Locks in the end-to-end behaviour of
 * {@see \Stackra\Foundation\Middleware\AssignCorrelationId}:
 * how it accepts / rejects inbound ids, when it mints its own, and
 * how the id is exposed to downstream code via
 * {@see \Stackra\Foundation\Support\CorrelationId::current()}.
 *
 * ## Why every branch is worth locking in
 *
 * - **Trusted passthrough** of a legitimate `X-Request-Id` keeps
 *   distributed traces stitched across services.
 * - **Guarded rejection** of a malformed header stops header-splitting
 *   payloads from an untrusted client (a `\r\n` injection would break
 *   every downstream response).
 * - **Static accessor sync** guarantees that logs, exceptions, and
 *   queued jobs all see the same id as the response header.
 *
 * ## Container reset
 *
 * `CorrelationId::current()` uses static state — every test resets
 * it in `beforeEach` / `afterEach` so cases don't leak into each
 * other.
 */

declare(strict_types=1);

use Stackra\Foundation\Middleware\AssignCorrelationId;
use Stackra\Foundation\Providers\FoundationServiceProvider;
use Stackra\Foundation\Support\CorrelationId;
use Illuminate\Foundation\Http\Events\RequestHandled;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Orchestra\Testbench\TestCase;

uses(TestCase::class);

beforeEach(function (): void {
    CorrelationId::forget();
});

afterEach(function (): void {
    CorrelationId::forget();
});

/**
 * Group 1 — no inbound header.
 *
 * When the request arrives without either header, the middleware
 * mints a fresh ULID and echoes it on the response so the client
 * has something to reference in support tickets.
 */
describe('no inbound header', function (): void {
    it('mints a fresh ULID and echoes it via X-Request-Id', function (): void {
        $middleware = new AssignCorrelationId;
        $request = Request::create('/');

        $response = $middleware->handle(
            $request,
            static fn (Request $r): Response => new Response('ok'),
        );

        $echoed = $response->headers->get('X-Request-Id');

        // ULIDs are 26 chars, Crockford base32 alphabet — the
        // regex mirrors the CorrelationId::generate() contract.
        expect($echoed)
            ->not->toBeNull()
            ->toHaveLength(26)
            ->toMatch('/^[0-9A-HJKMNP-TV-Z]{26}$/');
    });
});

/**
 * Group 2 — trusted inbound X-Request-Id.
 *
 * A legitimate id (alphanumeric + dashes) passes through untouched
 * so distributed traces stay stitched across service hops.
 */
describe('valid X-Request-Id passthrough', function (): void {
    it('keeps the inbound id when it matches the trust pattern', function (): void {
        $middleware = new AssignCorrelationId;
        $request = Request::create('/');
        $request->headers->set('X-Request-Id', 'req_abc-123');

        $response = $middleware->handle(
            $request,
            static fn (Request $r): Response => new Response('ok'),
        );

        expect($response->headers->get('X-Request-Id'))->toBe('req_abc-123');
    });
});

/**
 * Group 3 — X-Correlation-Id as a fallback.
 *
 * Some older clients emit `X-Correlation-Id` instead of the
 * de-facto `X-Request-Id`. The middleware accepts either.
 */
describe('X-Correlation-Id fallback', function (): void {
    it('accepts the fallback header when X-Request-Id is absent', function (): void {
        $middleware = new AssignCorrelationId;
        $request = Request::create('/');
        $request->headers->set('X-Correlation-Id', 'legacy-abc123');

        $response = $middleware->handle(
            $request,
            static fn (Request $r): Response => new Response('ok'),
        );

        expect($response->headers->get('X-Request-Id'))->toBe('legacy-abc123');
    });
});

/**
 * Group 4 — malformed inbound rejected.
 *
 * A hostile client could try to inject header-splitting characters
 * or oversize payloads. The middleware only trusts values matching
 * a strict regex; anything else is dropped and a fresh ULID is
 * minted in its place.
 */
describe('malformed inbound rejected', function (): void {
    it('discards a header with disallowed characters and mints a fresh ULID', function (): void {
        $middleware = new AssignCorrelationId;
        $request = Request::create('/');
        // Contains spaces + special chars — none of which are in
        // the middleware's `[A-Za-z0-9\-_.]` trust alphabet, so
        // the value MUST be discarded and a fresh id minted.
        $malicious = 'evil id <script>alert(1)</script>';
        $request->headers->set('X-Request-Id', $malicious);

        $response = $middleware->handle(
            $request,
            static fn (Request $r): Response => new Response('ok'),
        );

        $echoed = $response->headers->get('X-Request-Id');

        // We don't just check "not equal to malicious value" — we
        // assert the shape of a newly-minted ULID. That way even
        // a subtle mutation of the malicious string counts as a
        // failure.
        expect($echoed)
            ->not->toBeNull()
            ->and($echoed)->not->toBe($malicious)
            ->and($echoed)->toMatch('/^[0-9A-HJKMNP-TV-Z]{26}$/');
    });
});

/**
 * Group 5 — the static accessor mirrors the response header.
 *
 * `CorrelationId::current()` is what deep-stack code reads when it
 * wants to tag a log line or a queued job. It MUST return the
 * exact value that made it onto the response header, otherwise
 * clients + logs disagree on the id.
 */
describe('CorrelationId::current() sync', function (): void {
    it('returns the same value that ends up on the response header', function (): void {
        $middleware = new AssignCorrelationId;
        $request = Request::create('/');
        $request->headers->set('X-Request-Id', 'sync-check-abc');

        $currentDuringPipeline = null;
        $response = $middleware->handle(
            $request,
            static function (Request $r) use (&$currentDuringPipeline): Response {
                // Snapshot the static accessor while the pipeline
                // is executing — that's when downstream code would
                // read it.
                $currentDuringPipeline = CorrelationId::current();

                return new Response('ok');
            },
        );

        expect($currentDuringPipeline)->toBe('sync-check-abc')
            ->and($response->headers->get('X-Request-Id'))->toBe('sync-check-abc');
    });
});

/**
 * Group 6 — RequestHandled clears the static state.
 *
 * Long-lived workers (Octane, Roadrunner) reuse the same PHP
 * process across requests. The FoundationServiceProvider hooks
 * `RequestHandled` to call `CorrelationId::forget()` so request N
 * doesn't leak its id into request N+1.
 */
describe('RequestHandled resets CorrelationId', function (): void {
    it('clears the static accessor after the RequestHandled event fires', function (): void {
        // Register the provider so its event listener is wired.
        // We construct + register + boot it manually — Testbench's
        // package-provider mechanism would work too, but this
        // keeps the test self-contained.
        $provider = new FoundationServiceProvider($this->app);
        $provider->register();
        $provider->boot();

        CorrelationId::set('req_will_be_cleared');
        expect(CorrelationId::current())->toBe('req_will_be_cleared');

        // Fire the event manually — mirrors what the framework
        // dispatches at the end of a real HTTP request lifecycle.
        $this->app['events']->dispatch(new RequestHandled(
            Request::create('/'),
            new Response,
        ));

        expect(CorrelationId::current())->toBeNull();
    });
});

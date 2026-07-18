<?php

/**
 * @file packages/exceptions/tests/Unit/CaptureExceptionContextMiddlewareTest.php
 *
 * @description
 * Locks in the request-scoped snapshot behaviour of
 * {@see \Academorix\Exceptions\Http\Middleware\CaptureExceptionContext}.
 *
 * ## Why the snapshot exists
 *
 * Exceptions bubbling up from the domain layer often lose the HTTP
 * context that would make them debuggable — the reporter sees the
 * throwable but not the request that triggered it. This middleware
 * stashes `method / path / correlation_id / ip / user_agent` (plus
 * `user_id` and `tenant_id` when known) into a container binding so
 * every downstream reporter can enrich its event without carrying
 * the `Request` around manually.
 *
 * ## What this file tests
 *
 * 1. The full snapshot key set is present after the middleware runs.
 * 2. `user_id` is captured when authenticated, absent otherwise.
 * 3. `tenant_id` is captured from `request->attributes` when set.
 * 4. The snapshot SURVIVES an exception thrown downstream — the
 *    binding must be set BEFORE `$next($request)` is invoked.
 */

declare(strict_types=1);

use Academorix\Exceptions\Http\Middleware\CaptureExceptionContext;
use Illuminate\Auth\GenericUser;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Orchestra\Testbench\TestCase;

uses(TestCase::class);

/**
 * Helper closure — runs the middleware and returns the container
 * snapshot. Bound to `$this` (the TestCase) at call sites via
 * Closure::call so it can reach the protected `$this->app`.
 *
 * @param  Closure(Request): Response  $next
 * @return array<string, mixed>|null
 */
$run = function (Request $request, Closure $next): ?array {
    $middleware = new CaptureExceptionContext($this->app);
    try {
        $middleware->handle($request, $next);
    } catch (Throwable) {
        // Deliberately swallow — several cases assert the snapshot
        // is stashed BEFORE the downstream throw, so we still want
        // to inspect the container binding afterwards.
    }

    if (! $this->app->bound('academorix.exception_context')) {
        return null;
    }

    /** @var array<string, mixed> $snapshot */
    $snapshot = $this->app->make('academorix.exception_context');

    return $snapshot;
};

/**
 * Group 1 — baseline snapshot keys.
 *
 * Every request produces at minimum: method, path, correlation_id
 * (may be null), ip, user_agent. Reporters index on these fields
 * so a missing key breaks downstream event enrichment.
 */
describe('baseline snapshot', function () use ($run): void {
    it('captures method, path, correlation_id, ip, and user_agent', function () use ($run): void {
        $request = Request::create('/orders/42', 'POST');
        $request->headers->set('User-Agent', 'PestTests/1.0');
        // `correlation_id` is a request-attribute convention set
        // by the AssignCorrelationId middleware upstream — we
        // simulate that placement here.
        $request->attributes->set('correlation_id', 'req_abc');
        $request->server->set('REMOTE_ADDR', '203.0.113.9');

        $snapshot = $run->call(
            $this,
            $request,
            static fn (Request $r): Response => new Response('ok'),
        );

        expect($snapshot)->not->toBeNull()
            ->and($snapshot['method'])->toBe('POST')
            ->and($snapshot['path'])->toBe('/orders/42')
            ->and($snapshot['correlation_id'])->toBe('req_abc')
            ->and($snapshot['ip'])->toBe('203.0.113.9')
            ->and($snapshot['user_agent'])->toBe('PestTests/1.0');
    });
});

/**
 * Group 2 — user id capture.
 *
 * When a user is authenticated on the request, their auth id
 * enters the snapshot; when the request is anonymous, `user_id`
 * MUST NOT be present (so downstream code can tell "unknown user"
 * apart from "unknown request").
 */
describe('authenticated user capture', function () use ($run): void {
    it('records user_id when the request has an authenticated user', function () use ($run): void {
        $request = Request::create('/', 'GET');

        // `GenericUser` implements Authenticatable and has a
        // stable `getAuthIdentifier()` — no DB / model needed.
        $user = new GenericUser(['id' => 99]);
        $request->setUserResolver(static fn () => $user);

        $snapshot = $run->call(
            $this,
            $request,
            static fn (Request $r): Response => new Response,
        );

        expect($snapshot['user_id'])->toBe('99');
    });

    it('does NOT record user_id when the request is anonymous', function () use ($run): void {
        $request = Request::create('/', 'GET');
        // No user resolver — `$request->user()` returns null.

        $snapshot = $run->call(
            $this,
            $request,
            static fn (Request $r): Response => new Response,
        );

        expect($snapshot)->not->toHaveKey('user_id');
    });
});

/**
 * Group 3 — tenant id capture.
 *
 * The convention: apps that resolve tenants stash the tenant id on
 * `$request->attributes` under `tenant_id`. The middleware picks
 * this up without a hard dependency on any tenancy package.
 */
describe('tenant id capture', function () use ($run): void {
    it('records tenant_id when it is stashed on the request attributes', function () use ($run): void {
        $request = Request::create('/', 'GET');
        $request->attributes->set('tenant_id', 'acme');

        $snapshot = $run->call(
            $this,
            $request,
            static fn (Request $r): Response => new Response,
        );

        expect($snapshot['tenant_id'])->toBe('acme');
    });

    it('omits tenant_id entirely when the request has no tenant attribute', function () use ($run): void {
        $request = Request::create('/', 'GET');

        $snapshot = $run->call(
            $this,
            $request,
            static fn (Request $r): Response => new Response,
        );

        // A missing key (not `null`) is the contract — reporters
        // check `isset($snapshot['tenant_id'])` and skip the tag
        // when the value isn't there.
        expect($snapshot)->not->toHaveKey('tenant_id');
    });
});

/**
 * Group 4 — the snapshot survives a downstream throw.
 *
 * The middleware MUST bind the snapshot BEFORE calling `$next(...)`.
 * If the binding happened after, an exception thrown by a
 * controller would leave reporters without any HTTP context — the
 * exact scenario the middleware exists to prevent.
 */
describe('snapshot survives downstream exceptions', function () use ($run): void {
    it('keeps the binding populated even when the pipeline throws', function () use ($run): void {
        $request = Request::create('/boom', 'GET');
        $request->attributes->set('correlation_id', 'req_boom');

        $snapshot = $run->call(
            $this,
            $request,
            // The controller / downstream middleware explodes
            // BEFORE the handler returns. The snapshot should
            // still be readable from the container.
            static fn (Request $r): Response => throw new RuntimeException('downstream'),
        );

        expect($snapshot)->not->toBeNull()
            ->and($snapshot['path'])->toBe('/boom')
            ->and($snapshot['correlation_id'])->toBe('req_boom');
    });
});

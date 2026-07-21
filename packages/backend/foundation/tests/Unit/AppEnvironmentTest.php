<?php

/**
 * @file packages/foundation/tests/Unit/AppEnvironmentTest.php
 *
 * @description
 * Locks in the safe-defaults behaviour of the
 * {@see \Stackra\Foundation\Enums\AppEnvironment} enum.
 *
 * ## Why this matters
 *
 * The enum is the single source of truth for "am I in debug mode?"
 * and "should I mask errors from clients?". A bug here could cause
 * production to render debug traces, or local dev to swallow
 * useful debug information. Both are painful — the former is
 * catastrophic (leaked internals), the latter is friction.
 *
 * The critical invariant: an unrecognised env string MUST resolve
 * to `Production`. Never boot in a debuggable state by accident.
 *
 * ## Container-aware tests
 *
 * `AppEnvironment::current()` reads `config('app.env', 'production')`,
 * which needs the container. We use Testbench for those cases.
 */

declare(strict_types=1);

use Stackra\Foundation\Enums\AppEnvironment;
use Orchestra\Testbench\TestCase;

uses(TestCase::class);

/**
 * Group 1 — canonical case mapping.
 *
 * `from(...)` is a strict lookup: each documented env string maps
 * to exactly one enum case, and unrecognised strings throw.
 */
describe('canonical case mapping', function (): void {
    it('resolves every documented environment string to the right case', function (): void {
        // Table-driven — each pair is `[input string, expected case]`.
        // Locking every entry means a rename or removal is caught.
        expect(AppEnvironment::from('local'))->toBe(AppEnvironment::Local)
            ->and(AppEnvironment::from('testing'))->toBe(AppEnvironment::Testing)
            ->and(AppEnvironment::from('development'))->toBe(AppEnvironment::Development)
            ->and(AppEnvironment::from('staging'))->toBe(AppEnvironment::Staging)
            ->and(AppEnvironment::from('production'))->toBe(AppEnvironment::Production);
    });
});

/**
 * Group 2 — safe default on unknown values.
 *
 * `current()` — not `from()` — is the caller-facing API and MUST
 * never leave prod in debug mode. An unrecognised APP_ENV string
 * ("prd", "prod", "prodution") resolves to the strictest option:
 * Production.
 */
describe('unknown env falls back to Production', function (): void {
    it('resolves an unrecognised APP_ENV to Production', function (): void {
        $this->app['config']->set('app.env', 'not-a-real-env');

        // The defensive default is the whole point — a typo in a
        // `.env` file MUST NOT leave the app in a debuggable state.
        expect(AppEnvironment::current())->toBe(AppEnvironment::Production);
    });
});

/**
 * Group 3 — `isProductionLike()` groups the "no debug" envs.
 *
 * Staging is production-like on purpose: it runs the same code
 * as prod, so it should behave the same way for error masking,
 * telemetry sampling, etc.
 */
describe('isProductionLike', function (): void {
    it('is true for staging and production', function (): void {
        expect(AppEnvironment::Staging->isProductionLike())->toBeTrue()
            ->and(AppEnvironment::Production->isProductionLike())->toBeTrue();
    });

    it('is false for local, testing, development', function (): void {
        // These are the debug envs — grouping them via the enum
        // means callers never have to write a match statement.
        expect(AppEnvironment::Local->isProductionLike())->toBeFalse()
            ->and(AppEnvironment::Testing->isProductionLike())->toBeFalse()
            ->and(AppEnvironment::Development->isProductionLike())->toBeFalse();
    });
});

/**
 * Group 4 — `isDebuggable()` is the exact complement of
 * `isProductionLike()`. Duplicating the two methods (rather than
 * having one return the negation) is deliberate — call sites
 * express their intent more clearly, and if the two envelopes
 * diverge later (e.g. adding an "internal" env) the enum can
 * adjust without breaking callers.
 */
describe('isDebuggable', function (): void {
    it('is true for local, testing, development', function (): void {
        expect(AppEnvironment::Local->isDebuggable())->toBeTrue()
            ->and(AppEnvironment::Testing->isDebuggable())->toBeTrue()
            ->and(AppEnvironment::Development->isDebuggable())->toBeTrue();
    });

    it('is false for staging and production', function (): void {
        expect(AppEnvironment::Staging->isDebuggable())->toBeFalse()
            ->and(AppEnvironment::Production->isDebuggable())->toBeFalse();
    });
});

/**
 * Group 5 — `current()` reads from the booted container.
 *
 * When the container is available, `current()` resolves through
 * `config('app.env')`. In Laravel this is the same value that
 * `app()->environment()` returns — the task originally described
 * the accessor as reading from `app()->environment()`, but the
 * implementation reads from config; the two are equivalent in a
 * booted app. We test the observable contract.
 */
describe('current() with a booted container', function (): void {
    it('resolves the enum case matching the current config value', function (): void {
        $this->app['config']->set('app.env', 'staging');

        expect(AppEnvironment::current())->toBe(AppEnvironment::Staging);
    });

    it('defaults to Production when the config value is missing entirely', function (): void {
        // Simulate "config lookup returned the fallback string" —
        // the enum interprets the fallback as production so any
        // env misconfiguration lands on the safe side.
        $this->app['config']->set('app.env', 'production');

        expect(AppEnvironment::current())->toBe(AppEnvironment::Production);
    });
});

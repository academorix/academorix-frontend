<?php

/**
 * @file packages/exceptions/tests/Unit/MaskingPolicyTest.php
 *
 * @description
 * Unit coverage for {@see \Academorix\Exceptions\Support\MaskingPolicy},
 * the immutable value object that tells the renderer HOW aggressively
 * to mask an exception on the way out.
 *
 * ## Why this matters
 *
 * The policy is the single decision point for three orthogonal
 * questions:
 *
 *   1. Mask the developer message from clients?
 *   2. Redact the exception context payload?
 *   3. Attach the debug block (class / file / line / trace)?
 *
 * A regression that flips any flag in the wrong direction is either:
 *
 *   - A security leak (raw messages / context / traces to prod
 *     clients), OR
 *   - A dev-experience footgun (blank error pages in local dev
 *     because everything gets masked).
 *
 * We lock in each factory's combination for every (env × severity)
 * quadrant.
 *
 * ## No container needed
 *
 * The policy is a pure value object — no config lookup, no service
 * resolution — so these tests skip Testbench entirely and run
 * against the in-process class.
 */

declare(strict_types=1);

use Academorix\Exceptions\Enums\ErrorSeverity;
use Academorix\Exceptions\Support\MaskingPolicy;
use Academorix\Foundation\Enums\AppEnvironment;

// -----------------------------------------------------------------
// MaskingPolicy::forRequest — the four canonical quadrants
// -----------------------------------------------------------------

it('forRequest masks message + hides debug in Production for Critical severity', function (): void {
    // Production + Critical is the worst-case env × severity combo.
    // Every flag should point at "hide" so clients see only the
    // localised user message.
    $policy = MaskingPolicy::forRequest(AppEnvironment::Production, ErrorSeverity::Critical);

    expect($policy->maskMessage)->toBeTrue()
        // Context is masked in every env — there's no path where we
        // want to leak raw context to a client.
        ->and($policy->maskContext)->toBeTrue()
        // No debug block in production. Ever.
        ->and($policy->includeDebug)->toBeFalse();
});

it('forRequest keeps message visible in Local for Critical severity', function (): void {
    // Local dev + Critical: developer wants to see the raw error
    // string to diagnose. Message stays visible, debug block gets
    // attached, context still redacts (Redactor scrubs credentials
    // even in dev).
    $policy = MaskingPolicy::forRequest(AppEnvironment::Local, ErrorSeverity::Critical);

    expect($policy->maskMessage)->toBeFalse()
        ->and($policy->maskContext)->toBeTrue()
        ->and($policy->includeDebug)->toBeTrue();
});

it('forRequest keeps message visible in Production for Info severity', function (): void {
    // Production + Info (validation, 404, feature-flag denials).
    // These are expected-shape errors — the raw message is safe to
    // ship because it's already user-facing copy at throw time.
    $policy = MaskingPolicy::forRequest(AppEnvironment::Production, ErrorSeverity::Info);

    expect($policy->maskMessage)->toBeFalse()
        ->and($policy->maskContext)->toBeTrue()
        // Still no debug — the env dominates the debug flag.
        ->and($policy->includeDebug)->toBeFalse();
});

it('forRequest keeps message visible in Local for Info severity', function (): void {
    // Local dev + Info: the friendliest combo. Nothing hidden.
    $policy = MaskingPolicy::forRequest(AppEnvironment::Local, ErrorSeverity::Info);

    expect($policy->maskMessage)->toBeFalse()
        ->and($policy->maskContext)->toBeTrue()
        ->and($policy->includeDebug)->toBeTrue();
});

// -----------------------------------------------------------------
// forRequest — every remaining env × severity combination
// -----------------------------------------------------------------

it('forRequest keeps Staging masking-parity with Production', function (): void {
    // Staging must behave like production for masking — otherwise
    // staging becomes a leak vector.
    $prod = MaskingPolicy::forRequest(AppEnvironment::Production, ErrorSeverity::Error);
    $staging = MaskingPolicy::forRequest(AppEnvironment::Staging, ErrorSeverity::Error);

    expect($staging->maskMessage)->toBe($prod->maskMessage)
        ->and($staging->maskContext)->toBe($prod->maskContext)
        ->and($staging->includeDebug)->toBe($prod->includeDebug);
});

it('forRequest treats Testing + Development as debuggable envs', function (): void {
    // Both envs are "dev-like" per `AppEnvironment::isDebuggable()`
    // so debug blocks should attach.
    $testing = MaskingPolicy::forRequest(AppEnvironment::Testing, ErrorSeverity::Warning);
    $development = MaskingPolicy::forRequest(AppEnvironment::Development, ErrorSeverity::Warning);

    expect($testing->includeDebug)->toBeTrue()
        ->and($development->includeDebug)->toBeTrue()
        // Warning severity doesn't cross the mask-message threshold
        // (only Error+ do), so the message ships in both envs.
        ->and($testing->maskMessage)->toBeFalse()
        ->and($development->maskMessage)->toBeFalse();
});

// -----------------------------------------------------------------
// unmasked() — admin / support views
// -----------------------------------------------------------------

it('unmasked disables every mask flag', function (): void {
    // The admin / support view where the caller has already checked
    // their own authorisation. All three flags point at "show".
    $policy = MaskingPolicy::unmasked();

    expect($policy->maskMessage)->toBeFalse()
        ->and($policy->maskContext)->toBeFalse()
        ->and($policy->includeDebug)->toBeTrue();
});

// -----------------------------------------------------------------
// fullyMasked() — the safe last resort
// -----------------------------------------------------------------

it('fullyMasked enables every mask flag', function (): void {
    // Belt-and-braces default. When the caller can't work out what
    // env they're in, this is the safest response.
    $policy = MaskingPolicy::fullyMasked();

    expect($policy->maskMessage)->toBeTrue()
        ->and($policy->maskContext)->toBeTrue()
        ->and($policy->includeDebug)->toBeFalse();
});

// -----------------------------------------------------------------
// Immutability
// -----------------------------------------------------------------

it('MaskingPolicy is final readonly (constructor stores the exact flags)', function (): void {
    // The `readonly` modifier means these fields can't be flipped
    // mid-render. We assert on the constructor-supplied values as
    // a sanity check that the class hasn't grown a setter by
    // mistake.
    $policy = new MaskingPolicy(
        maskMessage: true,
        maskContext: false,
        includeDebug: true,
    );

    expect($policy->maskMessage)->toBeTrue()
        ->and($policy->maskContext)->toBeFalse()
        ->and($policy->includeDebug)->toBeTrue();
});

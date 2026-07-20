<?php

/**
 * @file packages/exceptions/tests/Unit/AuthExceptionsTest.php
 *
 * @description
 * Unit coverage for every named factory across the auth exception
 * family:
 *
 *   - {@see \Academorix\Exceptions\Auth\AuthenticationException}
 *   - {@see \Academorix\Exceptions\Auth\TokenExpiredException}
 *   - {@see \Academorix\Exceptions\Auth\ForbiddenException}
 *   - {@see \Academorix\Exceptions\Auth\FeatureDisabledException}
 *
 * ## What each test protects
 *
 *   - **Type preservation** through `::make()` + named factories —
 *     the whole point of returning `static` is that IDEs, phpstan,
 *     and downstream mapping code see the concrete subclass.
 *   - **Metadata contract** — `errorCode`, `httpStatus`, `severity`,
 *     `category`, `translationKey` on every class. These are the
 *     public API that clients + dashboards branch on; renames need
 *     a deprecation window.
 *   - **Named-factory wiring** — each factory sets a specific
 *     translation key (split-layout `exceptions::<file>.<key>`) plus
 *     the structured `context` and `translationParameters` that
 *     drive localised messages and dashboards.
 *
 * ## Translation-key layout
 *
 * The auth catalogue uses the split lang file layout — the file is
 * `lang/en/auth.php`, keys inside it look like `unauthenticated`,
 * `forbidden`, `token_expired`. Referenced from the code as
 * `exceptions::auth.<key>`, so a class default of
 * `exceptions::auth.forbidden` resolves to `lang/en/auth.php →
 * ['forbidden' => '...']`.
 */

declare(strict_types=1);

use Academorix\Exceptions\Auth\AuthenticationException;
use Academorix\Exceptions\Auth\FeatureDisabledException;
use Academorix\Exceptions\Auth\ForbiddenException;
use Academorix\Exceptions\Auth\TokenExpiredException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Academorix\Foundation\Support\CorrelationId;

afterEach(function (): void {
    CorrelationId::forget();
});

// -----------------------------------------------------------------
// AuthenticationException — class-level metadata
// -----------------------------------------------------------------

it('AuthenticationException carries the documented class-level metadata', function (): void {
    $e = AuthenticationException::make();

    // Locks in the entire public metadata surface. Any single-field
    // drift breaks the test loudly so a downstream client that
    // switches on `errorCode` or a Sentry dashboard that filters
    // by `category` isn't silently invalidated.
    expect($e)->toBeInstanceOf(AuthenticationException::class)
        ->and($e->errorCode())->toBe('auth.unauthenticated')
        ->and($e->httpStatus())->toBe(401)
        ->and($e->severity())->toBe(ErrorSeverity::Warning)
        ->and($e->category())->toBe(ErrorCategory::Authentication)
        // Split-layout key — file `auth`, key `unauthenticated`.
        ->and($e->translationKey())->toBe('exceptions::auth.unauthenticated');
});

// -----------------------------------------------------------------
// AuthenticationException::missingCredentials
// -----------------------------------------------------------------

it('AuthenticationException::missingCredentials returns the concrete subclass with the specific key', function (): void {
    $e = AuthenticationException::missingCredentials();

    expect($e)->toBeInstanceOf(AuthenticationException::class)
        // Named factories point at more specific keys so localised
        // UIs can distinguish "please sign in" from a generic 401.
        ->and($e->translationKey())->toBe('exceptions::auth.unauthenticated_missing_credentials')
        // Error code stays the class default — that's the public API
        // contract; the branch happens on translation key.
        ->and($e->errorCode())->toBe('auth.unauthenticated');
});

// -----------------------------------------------------------------
// AuthenticationException::invalidCredentials
// -----------------------------------------------------------------

it('AuthenticationException::invalidCredentials swaps the translation key', function (): void {
    $e = AuthenticationException::invalidCredentials();

    expect($e)->toBeInstanceOf(AuthenticationException::class)
        ->and($e->translationKey())->toBe('exceptions::auth.unauthenticated_invalid_credentials');
});

// -----------------------------------------------------------------
// AuthenticationException::tokenRevoked
// -----------------------------------------------------------------

it('AuthenticationException::tokenRevoked attaches token_name context and parameter', function (): void {
    $e = AuthenticationException::tokenRevoked('cli');

    // Token name lands in BOTH context (for logs/dashboards) and
    // translation parameters (for `:token_name` interpolation in
    // the localised message).
    expect($e)->toBeInstanceOf(AuthenticationException::class)
        ->and($e->translationKey())->toBe('exceptions::auth.unauthenticated_token_revoked')
        ->and($e->context())->toMatchArray(['token_name' => 'cli'])
        ->and($e->translationParameters())->toMatchArray(['token_name' => 'cli']);
});

// -----------------------------------------------------------------
// TokenExpiredException — extends AuthenticationException
// -----------------------------------------------------------------

it('TokenExpiredException overrides errorCode + translation key but inherits status + severity', function (): void {
    $e = TokenExpiredException::make();

    // Distinct code so clients can silently refresh instead of
    // bouncing the user to login. Status + severity + category
    // inherit from the parent because "who are you?" is still the
    // outer signal.
    expect($e)->toBeInstanceOf(TokenExpiredException::class)
        ->and($e)->toBeInstanceOf(AuthenticationException::class)
        ->and($e->errorCode())->toBe('auth.token.expired')
        ->and($e->translationKey())->toBe('exceptions::auth.token_expired')
        ->and($e->httpStatus())->toBe(401)
        ->and($e->severity())->toBe(ErrorSeverity::Warning)
        ->and($e->category())->toBe(ErrorCategory::Authentication);
});

it('TokenExpiredException::forTokenId stores the id in context only', function (): void {
    $e = TokenExpiredException::forTokenId('tok_123');

    expect($e)->toBeInstanceOf(TokenExpiredException::class)
        ->and($e->context())->toMatchArray(['token_id' => 'tok_123'])
        // Developer message carries the id — this is the internal
        // string, masked from clients in production by severity
        // policy.
        ->and($e->getMessage())->toContain('tok_123');
});

// -----------------------------------------------------------------
// ForbiddenException — class-level metadata
// -----------------------------------------------------------------

it('ForbiddenException carries the documented class-level metadata', function (): void {
    $e = ForbiddenException::make();

    expect($e)->toBeInstanceOf(ForbiddenException::class)
        ->and($e->errorCode())->toBe('auth.forbidden')
        ->and($e->httpStatus())->toBe(403)
        ->and($e->severity())->toBe(ErrorSeverity::Warning)
        ->and($e->category())->toBe(ErrorCategory::Authorization)
        // Split-layout — `auth.forbidden` (file / key), NOT the old
        // `errors.auth.forbidden` layout.
        ->and($e->translationKey())->toBe('exceptions::auth.forbidden');
});

// -----------------------------------------------------------------
// ForbiddenException::missingPermission
// -----------------------------------------------------------------

it('ForbiddenException::missingPermission stores the permission + translation key', function (): void {
    $e = ForbiddenException::missingPermission('billing.write');

    // Permission name is a documented part of the RBAC API — safe
    // to surface both to logs (context) and to the localised
    // user message (translationParameters).
    expect($e)->toBeInstanceOf(ForbiddenException::class)
        ->and($e->translationKey())->toBe('exceptions::auth.forbidden_missing_permission')
        ->and($e->context())->toMatchArray(['permission' => 'billing.write'])
        ->and($e->translationParameters())->toMatchArray(['permission' => 'billing.write']);
});

// -----------------------------------------------------------------
// ForbiddenException::missingRole
// -----------------------------------------------------------------

it('ForbiddenException::missingRole stores the role + translation key', function (): void {
    $e = ForbiddenException::missingRole('admin');

    expect($e)->toBeInstanceOf(ForbiddenException::class)
        ->and($e->translationKey())->toBe('exceptions::auth.forbidden_missing_role')
        ->and($e->context())->toMatchArray(['role' => 'admin'])
        ->and($e->translationParameters())->toMatchArray(['role' => 'admin']);
});

// -----------------------------------------------------------------
// ForbiddenException::policyDenied
// -----------------------------------------------------------------

it('ForbiddenException::policyDenied keeps model class in context, not parameters', function (): void {
    $e = ForbiddenException::policyDenied('edit', 'App\\Models\\Invoice');

    // Model class names are internal — they leak namespaces to end
    // users if surfaced. Kept in `context` (for logs) but omitted
    // from `translationParameters` (for user-facing messages).
    expect($e)->toBeInstanceOf(ForbiddenException::class)
        ->and($e->translationKey())->toBe('exceptions::auth.forbidden_policy_denied')
        ->and($e->context())->toMatchArray([
            'ability' => 'edit',
            'model' => 'App\\Models\\Invoice',
        ])
        ->and($e->translationParameters())->toEqual(['ability' => 'edit']);
});

// -----------------------------------------------------------------
// FeatureDisabledException — class-level metadata
// -----------------------------------------------------------------

it('FeatureDisabledException carries FeatureFlag + Info + 403 metadata', function (): void {
    $e = FeatureDisabledException::make();

    // `FeatureFlag` category (not `Authorization`) so product
    // analytics can chart flag-off traffic separately from
    // permission-denied traffic.
    expect($e)->toBeInstanceOf(FeatureDisabledException::class)
        ->and($e->errorCode())->toBe('auth.feature_disabled')
        ->and($e->httpStatus())->toBe(403)
        ->and($e->severity())->toBe(ErrorSeverity::Info)
        ->and($e->category())->toBe(ErrorCategory::FeatureFlag)
        ->and($e->translationKey())->toBe('exceptions::auth.feature_disabled');
});

// -----------------------------------------------------------------
// FeatureDisabledException::forFlag
// -----------------------------------------------------------------

it('FeatureDisabledException::forFlag stores the flag name in context + parameters', function (): void {
    $e = FeatureDisabledException::forFlag('ai_grading');

    // Flag names are documented API — safe in both context and
    // parameters. The named factory swaps to a more specific
    // translation key so localised copy can name the flag.
    expect($e)->toBeInstanceOf(FeatureDisabledException::class)
        ->and($e->translationKey())->toBe('exceptions::auth.feature_disabled_flag')
        ->and($e->context())->toMatchArray(['flag' => 'ai_grading'])
        ->and($e->translationParameters())->toMatchArray(['flag' => 'ai_grading']);
});

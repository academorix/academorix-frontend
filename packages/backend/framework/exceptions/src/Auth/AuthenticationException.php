<?php

/**
 * @file packages/exceptions/src/Auth/AuthenticationException.php
 *
 * @description
 * HTTP 401 — the request either carries no credentials at all, or
 * credentials that the auth guard could not validate. Thrown by:
 *
 *   - Sanctum guards when the bearer token is unknown / not on the
 *     `personal_access_tokens` table.
 *   - The password-grant flow when the email + password pair fails.
 *   - Session-based auth when the session cookie is stale.
 *
 * Distinct from {@see \Stackra\Exceptions\Auth\TokenExpiredException}:
 * use that class when the token WAS valid at some point and simply
 * timed out — clients can then run their refresh flow instead of
 * kicking the user back to the login screen.
 *
 * ## Translation keys
 *
 *   exceptions::auth.unauthenticated                       (class default)
 *   exceptions::auth.unauthenticated_missing_credentials   ({@see missingCredentials()})
 *   exceptions::auth.unauthenticated_invalid_credentials   ({@see invalidCredentials()})
 *   exceptions::auth.unauthenticated_token_revoked         ({@see tokenRevoked()})
 *
 * ## Context payload
 *
 * Named factories attach these keys to {@see \Stackra\Exceptions\Exception::context()}:
 *
 *   - `guards`      list<string> — the guard chain that rejected the request
 *   - `token_name`  string       — for revocation, the human-readable token label
 *
 * ## When NOT to throw
 *
 * Never throw this for an authenticated user who lacks a specific
 * permission — that's a 403 and belongs in
 * {@see \Stackra\Exceptions\Auth\ForbiddenException}. Confusing 401
 * and 403 breaks clients that redirect to the login screen on 401.
 *
 * @see \Stackra\Exceptions\Exception  Base class exposing `::make()` + fluent setters.
 * @see \Stackra\Exceptions\Concerns\TranslatesMessages  Trait powering `withTranslationKey()` / `withTranslationParameters()`.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Auth;

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class AuthenticationException extends Exception
{
    /**
     * Stable, machine-readable error code exposed on the wire as
     * `error.code`. Treated as public API — clients branch on this
     * literal, so any rename requires a deprecation window.
     */
    public const CODE = 'auth.unauthenticated';

    /**
     * Class-level translation key resolved by
     * {@see Exception::userMessage()} when no factory
     * override is applied. Points at the split lang catalogue at
     * `lang/en/auth.php` under the `exceptions::` namespace.
     */
    public const TRANSLATION_KEY = 'exceptions::auth.unauthenticated';

    /**
     * Log severity for every instance of this class.
     *
     * Deliberately `Warning` (not `Error`): 401s are expected
     * traffic on any authenticated API — every anonymous request,
     * every stale mobile session — and must not trip pagers or
     * skew error-rate SLOs.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Warning;

    /**
     * Dashboard / Sentry-tag bucket. `Authentication` groups every
     * "who are you?" failure regardless of underlying cause
     * (missing token, revoked token, wrong password) so ops can
     * chart the total volume in one panel.
     */
    protected ErrorCategory $category = ErrorCategory::Authentication;

    /**
     * HTTP status echoed by the renderer. Kept as a per-instance
     * override so a caller with a valid reason can bump to 403 or
     * 419 without touching the class default.
     */
    protected int $httpStatus = Response::HTTP_UNAUTHORIZED;

    /**
     * Named factory: "no credentials arrived at all."
     *
     * Used by the mapper when it sees Laravel's built-in
     * `AuthenticationException` with an empty guard array, and by
     * middleware that runs before Sanctum could parse a header.
     * The `missingCredentials` translation key drives a client-side
     * "please sign in" prompt rather than a "credentials rejected"
     * flow.
     *
     * @return static The fluent instance, ready for further
     *                `->withContext(...)` / `->withCorrelationId(...)`
     *                chaining. Never `null`.
     */
    public static function missingCredentials(): static
    {
        return static::make('No credentials were provided.')
            ->withTranslationKey('exceptions::auth.unauthenticated_missing_credentials');
    }

    /**
     * Named factory: "credentials arrived but were rejected."
     *
     * Prefer over {@see missingCredentials()} when the user
     * submitted a form and got the email/password wrong — the
     * client can highlight the login form fields rather than
     * bouncing the user off to the auth screen.
     *
     * @return static The fluent instance, pre-configured with the
     *                `invalid_credentials` translation key.
     */
    public static function invalidCredentials(): static
    {
        return static::make('Credentials are invalid.')
            ->withTranslationKey('exceptions::auth.unauthenticated_invalid_credentials');
    }

    /**
     * Named factory: "the token was valid but has been revoked."
     *
     * Fired when an admin manually deletes a personal access token
     * or when a compromised-token detector expires a token early.
     * The token label goes both into `context.token_name` (for
     * dashboards) and into the translation parameters (for a
     * user-facing message like "Token X has been revoked").
     *
     * @param  string  $tokenName  Human-readable token label — the
     *                             row's `name` column, never the
     *                             plaintext token itself.
     * @return static The fluent instance carrying the revoked-token
     *                metadata.
     */
    public static function tokenRevoked(string $tokenName): static
    {
        return static::make("Token \"{$tokenName}\" has been revoked.")
            ->withContext(['token_name' => $tokenName])
            ->withTranslationParameters(['token_name' => $tokenName])
            ->withTranslationKey('exceptions::auth.unauthenticated_token_revoked');
    }
}

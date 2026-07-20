<?php

/**
 * @file backend-packages/identity/auth/config/auth.php
 *
 * @description
 * Runtime knobs for the Auth module. Merged under the `auth.*`
 * root config namespace (Laravel already ships a `config/auth.php`
 * — the module merges INTO it under a `jwt` subkey to avoid
 * clobbering guards / providers / passwords).
 *
 * Every env-read here is a Doppler variable; there are no `.env`
 * files on disk. See `.kiro/steering/doppler.md`.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Inter-service JWT
    |--------------------------------------------------------------------------
    |
    | The HS256 shared secret used to sign inter-service JWTs. Every
    | downstream service (backend, ai, observability) holds the same
    | secret and verifies signatures locally — no round-trip to
    | identity-service for the hot path.
    |
    | RFC 7518 §3.2 mandates a key of AT LEAST 32 bytes for HS256.
    | The signer refuses to boot below that. Rotate by provisioning
    | a new kid in `auth_jwt_signing_keys`, waiting for issuance to
    | roll over, then rotating SERVICE_JWT_SECRET itself.
    */
    'jwt' => [
        'service_jwt_secret' => env('SERVICE_JWT_SECRET'),

        // Fully-qualified issuer URL emitted in every signed JWT's
        // `iss` claim. Downstream verifiers refuse tokens whose
        // `iss` doesn't match.
        'issuer' => env('AUTH_JWT_ISSUER', 'https://identity.academorix.com'),

        // Default TTL for user-session JWTs. Service accounts pass
        // an explicit TTL at issuance and default to 300s per the
        // service-accounts module's contract.
        'ttl_seconds' => (int) env('AUTH_JWT_TTL_SECONDS', 900),

        // Extended TTL for enterprise-tier integrations (higher
        // trust bar, longer-lived JWTs). Consumed by the SA issuer
        // when the caller requests a longer window.
        'extended_ttl_seconds' => (int) env('AUTH_JWT_EXTENDED_TTL_SECONDS', 3600),

        // Clock-skew tolerance applied to iat / exp checks.
        // Deliberately conservative — 30 seconds tolerates a NTP
        // step across the fleet without waving through a token
        // that expired 5 minutes ago.
        'clock_skew_seconds' => (int) env('AUTH_JWT_CLOCK_SKEW_SECONDS', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Login rate limits
    |--------------------------------------------------------------------------
    |
    | Named limiters consumed by `#[Middleware(['throttle:login'])]`
    | on the login action. Values interpret as "N attempts per M
    | seconds keyed by IP + email".
    */
    'login' => [
        'max_attempts' => (int) env('AUTH_LOGIN_MAX_ATTEMPTS', 5),
        'decay_seconds' => (int) env('AUTH_LOGIN_DECAY_SECONDS', 60),

        // Failed-attempts threshold before Identity.locked_until is
        // set. Zero disables the lockout mechanism (tests only).
        'lockout_after' => (int) env('AUTH_LOCKOUT_AFTER', 5),
        'lockout_duration_seconds' => (int) env('AUTH_LOCKOUT_DURATION_SECONDS', 900),
    ],

    /*
    |--------------------------------------------------------------------------
    | Password-reset rate limits
    |--------------------------------------------------------------------------
    */
    'password_reset' => [
        'max_requests_per_minute' => (int) env('AUTH_PASSWORD_RESET_MAX_PER_MINUTE', 3),
        'token_ttl_seconds' => (int) env('AUTH_PASSWORD_RESET_TOKEN_TTL_SECONDS', 900),
    ],
];

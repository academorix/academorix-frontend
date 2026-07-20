<?php

/**
 * @file backend-packages/identity/service-accounts/config/service-accounts.php
 *
 * @description
 * Runtime knobs for the ServiceAccounts module. Merged under
 * `service-accounts.*` at boot.
 *
 * Every env-read here is a Doppler variable; there are no `.env`
 * files on disk (see `.kiro/steering/doppler.md`).
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | JWT issuance defaults
    |--------------------------------------------------------------------------
    |
    | Consumed by `ServiceAccountJwtIssuer`. Every SA JWT the module
    | signs draws its TTL from these values unless the caller
    | overrides via the exchange payload.
    */
    'jwt' => [
        // Default TTL for exchange-issued JWTs. Blueprint §3.2 says
        // 300s (5 minutes) — short window bounds compromise blast
        // radius if a token leaks.
        'ttl_seconds' => (int) env('SERVICE_ACCOUNTS_JWT_TTL_SECONDS', 300),

        // Hard cap on caller-requested TTLs. Even an enterprise
        // integration cannot mint a 24-hour SA JWT — anything past
        // this and the exchange refuses.
        'max_ttl_seconds' => (int) env('SERVICE_ACCOUNTS_JWT_MAX_TTL_SECONDS', 3600),

        // TTL for the `service-account:test-jwt` command's
        // dry-run tokens. Blueprint example is 60s — a small
        // window because these often land in operator terminal
        // history / screenshots.
        'test_ttl_seconds' => (int) env('SERVICE_ACCOUNTS_JWT_TEST_TTL_SECONDS', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Secret rotation
    |--------------------------------------------------------------------------
    */
    'rotation' => [
        // Default expiry window on newly-provisioned SAs (blueprint
        // §6 — 90 days).
        'default_ttl_days' => (int) env('SERVICE_ACCOUNTS_ROTATION_TTL_DAYS', 90),

        // How many days before expiry to fire the
        // `NotifyRotationDueJob` warning.
        'warning_days_before' => (int) env('SERVICE_ACCOUNTS_ROTATION_WARNING_DAYS', 14),

        // Grace window (seconds) after `expires_at` during which
        // still-valid JWTs continue to verify. Matches the JWT TTL
        // so the last-issued token cannot outlive its host row.
        'grace_seconds' => (int) env('SERVICE_ACCOUNTS_ROTATION_GRACE_SECONDS', 300),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate limits (informational — actual limits live in the
    | `throttle:token-exchange` and `throttle:sa-management` named
    | limiters registered by the routing package's rate-limiter).
    |--------------------------------------------------------------------------
    */
    'rate_limits' => [
        'token_exchange_per_sa' => (int) env('SERVICE_ACCOUNTS_TOKEN_EXCHANGE_PER_SA', 5),
        'token_exchange_per_ip' => (int) env('SERVICE_ACCOUNTS_TOKEN_EXCHANGE_PER_IP', 20),
    ],

    /*
    |--------------------------------------------------------------------------
    | Anomaly detection
    |--------------------------------------------------------------------------
    */
    'dormant' => [
        'threshold_days' => (int) env('SERVICE_ACCOUNTS_DORMANT_DAYS', 30),
    ],

    'failure_disable' => [
        // Number of consecutive bcrypt-check failures before the SA
        // is auto-disabled. Blueprint calls out "disable-on-3-
        // failures counter" — the counter itself lives in Redis and
        // resets on any successful exchange.
        'threshold' => (int) env('SERVICE_ACCOUNTS_FAILURE_DISABLE_THRESHOLD', 3),
    ],
];

<?php

/**
 * @file modules/access/invitations/config/invitations.php
 *
 * @description
 * Runtime knobs for the `stackra/invitations` module. Every knob
 * is env-overridable so per-environment tuning stays out of code.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Token
    |--------------------------------------------------------------------------
    |
    | `raw_bytes` — the number of random bytes generated for each token
    | before hashing. 32 bytes = 256 bits. `prefix_chars` — leading hex
    | chars kept in plaintext on the row for indexed lookups + admin
    | search.
    */
    'token' => [
        'raw_bytes'    => env('INVITATIONS_TOKEN_RAW_BYTES', 32),
        'prefix_chars' => env('INVITATIONS_TOKEN_PREFIX_CHARS', 8),
    ],

    /*
    |--------------------------------------------------------------------------
    | Expiry
    |--------------------------------------------------------------------------
    |
    | Default validity window applied when the caller does not supply
    | `expires_at` explicitly. Expressed in days.
    */
    'expiry' => [
        'default_days' => env('INVITATIONS_EXPIRY_DAYS', 14),
    ],

    /*
    |--------------------------------------------------------------------------
    | Resend
    |--------------------------------------------------------------------------
    |
    | Maximum resend attempts per invitation. The `POST .../resend`
    | endpoint refuses beyond this cap.
    */
    'resend' => [
        'max' => env('INVITATIONS_MAX_RESENDS', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | Throttle
    |--------------------------------------------------------------------------
    |
    | Per-inviter + per-tenant rate-limit ceilings enforced by the
    | `throttle.invitations` middleware. See `middleware.json` for the
    | four counter dimensions.
    */
    'throttle' => [
        'per_user_per_day'            => env('INVITATIONS_THROTTLE_USER_DAILY', 50),
        'per_service_account_per_day' => env('INVITATIONS_THROTTLE_SERVICE_ACCOUNT_DAILY', 500),
        'per_tenant_per_day'          => env('INVITATIONS_THROTTLE_TENANT_DAILY', 250),
        'per_invitee_per_week'        => env('INVITATIONS_THROTTLE_INVITEE_WEEKLY', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Retention windows applied by the scheduled cleanup jobs. Values
    | are ISO-8601 durations parseable by CarbonInterval::fromString.
    */
    'retention' => [
        'accepted_older_than' => env('INVITATIONS_RETENTION_ACCEPTED', 'P90D'),
        'declined_older_than' => env('INVITATIONS_RETENTION_DECLINED', 'P90D'),
        'events_older_than'   => env('INVITATIONS_RETENTION_EVENTS', 'P365D'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Delivery
    |--------------------------------------------------------------------------
    |
    | Which channel the module defaults to when the caller did not
    | request one explicitly. `email` is the shipping channel; `sms`
    | and `in_app` are feature-flag guarded per tenant entitlement.
    */
    'delivery' => [
        'default_channel'   => env('INVITATIONS_DEFAULT_CHANNEL', 'email'),
        'default_transport' => env('INVITATIONS_DEFAULT_TRANSPORT', 'mail'),
    ],
];

<?php

/**
 * @file apps/laravel-template/config/auth.php
 *
 * @description
 * Auth config for the Stackra headless API — two guards,
 * both Sanctum-based per ADR-0022 Seam 1.
 *
 *   - `sanctum` — the tenant-audience guard for /api/v1/*
 *     routes. Personal access tokens issued from
 *     `personal_access_tokens` (Sanctum default).
 *   - `platform_admin` — the platform-audience guard for
 *     /api/v1/platform/* routes. Same driver, different
 *     user provider (`PlatformUser` model instead of the
 *     tenant-scoped `User`).
 *
 * No session guard is defined — the API is stateless per
 * `.kiro/steering/architecture.md` §Headless only.
 * The user models are declared as `class-string` fallbacks
 * on the packages; each user package's provider rebinds
 * `AUTH_MODEL` / `AUTH_PLATFORM_MODEL` at boot when the
 * package is present in `composer.json`.
 */

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    */
    'defaults' => [
        'guard' => env('AUTH_GUARD', 'sanctum'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    | Both guards use the `sanctum` driver — the guard split lets
    | routes attach `->middleware('auth:sanctum')` for tenant traffic
    | and `->middleware('auth:platform_admin')` for platform-admin
    | traffic while keeping one token issuance mechanism.
    */
    'guards' => [
        'sanctum' => [
            'driver' => 'sanctum',
            'provider' => 'users',
        ],
        'platform_admin' => [
            'driver' => 'sanctum',
            'provider' => 'platform_users',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    | The concrete User + PlatformUser models live in their own
    | packages (`stackra/user` + `stackra/platform-user`). Each
    | package's service provider replaces the placeholder class-
    | string at boot with the resolved concrete class.
    */
    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => env('AUTH_MODEL', \Stackra\User\Models\User::class),
        ],
        'platform_users' => [
            'driver' => 'eloquent',
            'model' => env('AUTH_PLATFORM_MODEL', \Stackra\PlatformUser\Models\PlatformUser::class),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    */
    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    */
    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];

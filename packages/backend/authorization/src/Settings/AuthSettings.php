<?php

/**
 * @file src/Settings/AuthSettings.php
 *
 * @description
 * Platform authentication policy knobs. Ported from the
 * `config('auth.*')` layer laid down by the old
 * `AuthServiceProvider::register()` — `platform_2fa_enforced`,
 * `platform_ip_allowlist`, `impersonate_catalog`,
 * `password_confirmation_ttl`. These are the platform-wide auth
 * policy toggles: what changes here changes login policy for
 * every tenant on the platform.
 *
 * ## Group key
 *
 * `auth` — stored under `scope_values.namespace='settings'`.
 *
 * ## Scope
 *
 * `System` — a single platform-wide policy. Tenants CANNOT
 * override — auth policy is an operator decision.
 *
 * ## Related settings groups
 *
 *   - {@see LockoutSettings}       — account-lockout windows.
 *   - {@see RiskScoringSettings}   — login-risk scorer weights.
 *   - {@see PasswordSettings}      — password floor + policy.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Settings;

use Stackra\Settings\Attributes\AsSetting;
use Stackra\Settings\Attributes\SettingField;
use Stackra\Settings\Enums\ControlType;
use Stackra\Settings\Enums\SettingScope;

/**
 * Platform-wide authentication policy.
 *
 * ## Usage
 *
 * Values are read through the settings service. They previously
 * sat on `config('auth.*')`; the migration bridge in
 * `AuthServiceProvider::register()` still layers them onto the
 * config bag for legacy consumers, but new code should read
 * directly.
 */
#[AsSetting(
    group: 'auth',
    label: 'Authentication',
    description: 'Platform-wide authentication policy: 2FA enforcement, IP allowlist, impersonation catalog.',
    icon: 'shield-check',
    // Auth policy read gate — separate from the generic
    // `settings.read` because platform_ip_allowlist and
    // impersonate_catalog leak security-sensitive detail.
    permission: 'settings.auth.read',
    scope: SettingScope::System,
    sortOrder: 200,
)]
final class AuthSettings
{
    /**
     * When true, every platform-admin login MUST clear a 2FA
     * challenge before completing. Set false ONLY when an
     * operator has an explicit incident-recovery reason —
     * the service provider emits a warning in production when
     * this is off (Auth Req 14.5).
     */
    #[SettingField(
        controlType: ControlType::Toggle,
        label: 'Enforce platform 2FA',
        description: 'When enabled, every platform-admin login must clear a 2FA challenge. Production deployments should always leave this on.',
        sortOrder: 10,
    )]
    public bool $platform_2fa_enforced = true;

    /**
     * CIDR-shaped list of IP ranges allowed to log in as a
     * platform admin. Empty list = allow-all. Stored as JSON
     * because the schema doesn't know how many entries the
     * operator will need.
     *
     * @var list<string>
     */
    #[SettingField(
        controlType: ControlType::Json,
        label: 'Platform-admin IP allowlist',
        description: 'JSON array of CIDR ranges permitted for platform-admin login (e.g. ["10.0.0.0/8", "203.0.113.42/32"]). Empty array = allow-all.',
        validation: ['array'],
        defaultValue: [],
        rows: 6,
        sortOrder: 20,
    )]
    public array $platform_ip_allowlist = [];

    /**
     * Slugs of workspaces this platform install permits
     * impersonation into. `["*"]` is the default catch-all.
     * Restrict to specific tenant slugs when the platform
     * services regulated clients that forbid impersonation.
     *
     * @var list<string>
     */
    #[SettingField(
        controlType: ControlType::Json,
        label: 'Impersonation catalog',
        description: 'Tenant slugs a platform admin may impersonate into. `["*"]` = all tenants. Restrict for regulated deployments.',
        validation: ['array'],
        defaultValue: ['*'],
        rows: 6,
        sortOrder: 30,
    )]
    public array $impersonate_catalog = ['*'];

    /**
     * TTL (seconds) for the password-confirmation window Laravel
     * uses to gate sensitive actions. The old code defaulted
     * this to Laravel's built-in `auth.password_timeout` (10800
     * seconds); we re-declare it here so operators don't have to
     * reason about two nested keys.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Password-confirmation TTL (seconds)',
        description: 'How long a fresh password-confirmation stays valid for sensitive actions (impersonate, revoke tokens, edit billing). Default 3 hours.',
        validation: ['integer', 'min:300', 'max:86400'],
        min: 300,
        max: 86400,
        step: 60,
        sortOrder: 40,
    )]
    public int $password_confirmation_ttl = 10800;
}

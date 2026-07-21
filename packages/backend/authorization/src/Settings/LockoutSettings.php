<?php

/**
 * @file src/Settings/LockoutSettings.php
 *
 * @description
 * Account-lockout tunables. Ported from private constants on
 * `Stackra\Auth\Services\AccountLockoutService` in the old
 * codebase — MAX_ATTEMPTS, WINDOW_SECONDS, MAX_LOCKOUT_SECONDS,
 * TIER_TTL_SECONDS. Moved to settings so an operator can adjust
 * lockout severity in response to an active credential-stuffing
 * incident without a deploy.
 *
 * ## Group key
 *
 * `auth_lockout` — stored under
 * `scope_values.namespace='settings'`.
 *
 * ## Scope
 *
 * `System` — a single platform-wide policy.
 *
 * ## Related requirements
 *
 * Auth Req 13.1, 13.2, 13.3 from the old-codebase spec.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Settings;

use Stackra\Settings\Attributes\AsSetting;
use Stackra\Settings\Attributes\SettingField;
use Stackra\Settings\Enums\ControlType;
use Stackra\Settings\Enums\SettingScope;

/**
 * Rolling-window account-lockout policy.
 *
 * ## How the four values interact
 *
 *   - Users get up to `max_attempts` failed logins inside a
 *     `window_seconds`-long rolling window before being locked.
 *   - A first lockout lasts `window_seconds`. A second lockout
 *     within `tier_ttl_seconds` doubles. A third doubles again,
 *     and so on — until the individual lockout hits the
 *     `max_lockout_seconds` ceiling.
 *   - The `tier_ttl_seconds` counter itself resets after that
 *     window with no fresh lockouts.
 */
#[AsSetting(
    group: 'auth_lockout',
    label: 'Account lockout',
    description: 'Rolling-window lockout thresholds for failed-login credential-stuffing defence.',
    icon: 'lock',
    permission: 'settings.auth.read',
    scope: SettingScope::System,
    sortOrder: 210,
)]
final class LockoutSettings
{
    /**
     * Attempts allowed in the rolling window before the caller's
     * (IP, username) pair is locked out.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Max attempts',
        description: 'Failed logins allowed inside the rolling window before the caller is locked out.',
        validation: ['integer', 'min:1', 'max:50'],
        min: 1,
        max: 50,
        step: 1,
        sortOrder: 10,
    )]
    public int $max_attempts = 5;

    /**
     * Length of the rolling window over which failed attempts
     * accumulate, AND the length of the base (tier 0) lockout.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Window (seconds)',
        description: 'Rolling-window length in seconds. Also the base lockout duration. Default 15 minutes.',
        validation: ['integer', 'min:60', 'max:86400'],
        min: 60,
        max: 86400,
        step: 60,
        sortOrder: 20,
    )]
    public int $window_seconds = 900;

    /**
     * Upper bound on a graduated back-off — an individual
     * lockout never exceeds this regardless of the tier count.
     * Default 24 hours matches the old-codebase constant.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Max lockout (seconds)',
        description: 'Absolute ceiling on any single lockout duration, regardless of graduated back-off tier. Default 24 hours.',
        validation: ['integer', 'min:60', 'max:604800'],
        min: 60,
        max: 604800,
        step: 60,
        sortOrder: 30,
    )]
    public int $max_lockout_seconds = 86400;

    /**
     * TTL for the "prior lockouts in the last N seconds" counter
     * that drives the graduated back-off tier — after this
     * window without a fresh lockout, the tier counter resets
     * and the next lockout starts from tier 0 again.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Tier TTL (seconds)',
        description: 'Window for the graduated back-off counter. After this many seconds without a fresh lockout, the tier count resets.',
        validation: ['integer', 'min:60', 'max:604800'],
        min: 60,
        max: 604800,
        step: 60,
        sortOrder: 40,
    )]
    public int $tier_ttl_seconds = 86400;
}

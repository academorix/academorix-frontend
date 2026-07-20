<?php

/**
 * @file src/Settings/RiskScoringSettings.php
 *
 * @description
 * Login-risk-scorer tunables. Ported from private constants on
 * `Academorix\Auth\Services\LoginRiskScorer` in the old
 * codebase — five weights, a max-score clamp, a sample window,
 * and the "normal" hour window bounds. Moved to settings so an
 * on-call engineer can retune the scorer without a deploy when
 * the false-positive rate spikes.
 *
 * ## Group key
 *
 * `auth_risk` — stored under `scope_values.namespace='settings'`.
 *
 * ## Scope
 *
 * `System` — one scoring policy per platform. Tenants inherit;
 * tenant-tier overrides don't make sense for a scorer that runs
 * before we know which tenant the login is aimed at.
 */

declare(strict_types=1);

namespace Academorix\Authorization\Settings;

use Academorix\Settings\Attributes\AsSetting;
use Academorix\Settings\Attributes\SettingField;
use Academorix\Settings\Enums\ControlType;
use Academorix\Settings\Enums\SettingScope;

/**
 * Login risk-scoring policy.
 *
 * ## Score computation
 *
 *   final = min(max_score,
 *               ip_novel        * weight_ip_novel
 *             + device_novel    * weight_device_novel
 *             + off_hours       * weight_off_hours
 *             + platform_ip_disallowed * weight_platform_ip_disallowed
 *             + default_device  * weight_default_device)
 *
 * Each rule-fire is a `1`; a rule that doesn't fire is `0`. The
 * weights are the operator's dial for tuning sensitivity.
 */
#[AsSetting(
    group: 'auth_risk',
    label: 'Login risk scoring',
    description: 'Weights and window bounds used by the login-risk scorer.',
    icon: 'chart-bar',
    permission: 'settings.auth.read',
    scope: SettingScope::System,
    sortOrder: 220,
)]
final class RiskScoringSettings
{
    // ---------------------------------------------------------
    // Weights
    // ---------------------------------------------------------

    /**
     * Points added when the login originates from an IP the
     * user hasn't been seen from in the sample window.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Weight: novel IP',
        description: 'Points added when the login originates from an IP unseen during the sample window.',
        validation: ['integer', 'min:0', 'max:100'],
        min: 0,
        max: 100,
        step: 1,
        sortOrder: 10,
    )]
    public int $weight_ip_novel = 30;

    /**
     * Points added when the login originates from a
     * device-fingerprint the user hasn't been seen from in the
     * sample window.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Weight: novel device',
        description: 'Points added when the login originates from a device fingerprint unseen during the sample window.',
        validation: ['integer', 'min:0', 'max:100'],
        min: 0,
        max: 100,
        step: 1,
        sortOrder: 20,
    )]
    public int $weight_device_novel = 15;

    /**
     * Points added when the login happens outside the user's
     * "normal" hour window (in their resolved timezone).
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Weight: off-hours',
        description: 'Points added when the login happens outside the user\'s normal activity window.',
        validation: ['integer', 'min:0', 'max:100'],
        min: 0,
        max: 100,
        step: 1,
        sortOrder: 30,
    )]
    public int $weight_off_hours = 10;

    /**
     * Points added when the IP is not in
     * `auth.platform_ip_allowlist` — only applied to platform-
     * admin logins.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Weight: platform IP disallowed',
        description: 'Points added when a platform-admin login originates from an IP outside the platform allowlist.',
        validation: ['integer', 'min:0', 'max:100'],
        min: 0,
        max: 100,
        step: 1,
        sortOrder: 40,
    )]
    public int $weight_platform_ip_disallowed = 20;

    /**
     * Points added when the caller's device fingerprint is the
     * generic "no device data" placeholder — cheap indicator
     * that the caller is a headless scraper.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Weight: default device',
        description: 'Points added when the device fingerprint is the "no device data" default (typical of headless bots).',
        validation: ['integer', 'min:0', 'max:100'],
        min: 0,
        max: 100,
        step: 1,
        sortOrder: 50,
    )]
    public int $weight_default_device = 10;

    // ---------------------------------------------------------
    // Score clamp + sampling
    // ---------------------------------------------------------

    /**
     * Absolute upper bound on the final aggregated score.
     * Anything scoring at this value hits the highest severity
     * band regardless of individual weights.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Max score',
        description: 'Upper clamp on the final aggregated risk score.',
        validation: ['integer', 'min:1', 'max:1000'],
        min: 1,
        max: 1000,
        step: 1,
        sortOrder: 60,
    )]
    public int $max_score = 100;

    /**
     * Rolling window (days) over which `personal_access_tokens.
     * last_used_at` samples are inspected for the novelty and
     * off-hours checks.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Sample window (days)',
        description: 'Rolling window in days for the novelty and off-hours checks.',
        validation: ['integer', 'min:1', 'max:365'],
        min: 1,
        max: 365,
        step: 1,
        sortOrder: 70,
    )]
    public int $sample_window_days = 30;

    /**
     * Minimum number of samples in the sample window before the
     * `off_hours` rule may fire — silences the rule when the
     * user's activity window isn't yet observable.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Off-hours minimum samples',
        description: 'Minimum sample count before the off-hours rule fires — protects new users from being auto-flagged as off-hours.',
        validation: ['integer', 'min:1', 'max:100'],
        min: 1,
        max: 100,
        step: 1,
        sortOrder: 80,
    )]
    public int $off_hours_min_samples = 3;

    // ---------------------------------------------------------
    // Hour window
    // ---------------------------------------------------------

    /**
     * Lower bound (inclusive, 0-23) of the "normal" activity
     * window in the user's resolved timezone.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Normal hour window start',
        description: 'Hour of day (0-23, inclusive) at which the normal activity window opens.',
        validation: ['integer', 'min:0', 'max:23'],
        min: 0,
        max: 23,
        step: 1,
        sortOrder: 90,
    )]
    public int $hour_window_start = 8;

    /**
     * Upper bound (exclusive, 0-23) of the "normal" activity
     * window in the user's resolved timezone.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Normal hour window end',
        description: 'Hour of day (0-23, exclusive) at which the normal activity window closes.',
        validation: ['integer', 'min:0', 'max:23'],
        min: 0,
        max: 23,
        step: 1,
        sortOrder: 100,
    )]
    public int $hour_window_end = 20;
}

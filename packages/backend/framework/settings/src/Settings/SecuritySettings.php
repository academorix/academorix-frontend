<?php

declare(strict_types=1);

/**
 * SecuritySettings — Security Policies & Access Controls.
 *
 * Defines the canonical schema for security settings within the Unified
 * Settings System. Controls CORS policies, rate limiting, IP access
 * control lists, and API key management.
 *
 * @category Settings
 *
 * @since    1.0.0
 */

namespace Stackra\Settings\Settings;

use Spatie\LaravelSettings\Settings;
use Stackra\Settings\Attributes\AsSetting;
use Stackra\Settings\Attributes\SettingField;
use Stackra\Settings\Attributes\SettingGroup;
use Stackra\Settings\Enums\ControlType;

/**
 * Security Settings.
 *
 * Tenant-scoped settings for security policies. Each tenant can define
 * their own CORS origins, rate limits, IP restrictions, and API key rules.
 */
#[AsSetting(group: 'security', label: 'Security', description: 'Security policies and access controls.', icon: 'shield-alert', scope: 'tenant', sortOrder: 8)]
class SecuritySettings extends Settings
{
    // ── CORS ─────────────────────────────────────────────────────

    /** Comma-separated allowed origins. Use `*` for all. */
    #[SettingGroup(label: 'CORS', description: 'Cross-Origin Resource Sharing policies.', icon: 'globe', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Text, label: 'Allowed Origins', validation: ['nullable', 'string', 'max:1000'], sortOrder: 1, group: 'CORS')]
    public string $cors_allowed_origins = '*';

    #[SettingField(controlType: ControlType::Text, label: 'Allowed Methods', validation: ['nullable', 'string', 'max:200'], sortOrder: 2, group: 'CORS')]
    public string $cors_allowed_methods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';

    #[SettingField(controlType: ControlType::Number, label: 'Max Age (seconds)', validation: ['nullable', 'integer', 'min:0', 'max:604800'], sortOrder: 3, group: 'CORS', min: 0, max: 604800)]
    public int $cors_max_age_seconds = 86400;

    // ── Rate Limiting ────────────────────────────────────────────

    #[SettingGroup(label: 'Rate Limiting', description: 'Request rate limits per endpoint category.', icon: 'gauge', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Number, label: 'API Rate Limit (per minute)', validation: ['nullable', 'integer', 'min:10', 'max:10000'], sortOrder: 1, group: 'Rate Limiting', min: 10, max: 10000)]
    public int $api_rate_limit_per_minute = 60;

    #[SettingField(controlType: ControlType::Number, label: 'Login Rate Limit (per minute)', validation: ['nullable', 'integer', 'min:1', 'max:100'], sortOrder: 2, group: 'Rate Limiting', min: 1, max: 100)]
    public int $login_rate_limit_per_minute = 10;

    #[SettingField(controlType: ControlType::Number, label: 'Upload Rate Limit (per minute)', validation: ['nullable', 'integer', 'min:1', 'max:100'], sortOrder: 3, group: 'Rate Limiting', min: 1, max: 100)]
    public int $upload_rate_limit_per_minute = 20;

    // ── IP Access Control ────────────────────────────────────────

    #[SettingGroup(label: 'IP Access Control', description: 'IP allowlist and blocklist for access restriction.', icon: 'network', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Toggle, label: 'IP Allowlist Enabled', sortOrder: 1, group: 'IP Access Control')]
    public bool $ip_allowlist_enabled = false;

    /** Comma-separated IPs or CIDR ranges. */
    #[SettingField(controlType: ControlType::Text, label: 'IP Allowlist', validation: ['nullable', 'string', 'max:2000'], sortOrder: 2, group: 'IP Access Control')]
    public string $ip_allowlist = '';

    #[SettingField(controlType: ControlType::Toggle, label: 'IP Blocklist Enabled', sortOrder: 3, group: 'IP Access Control')]
    public bool $ip_blocklist_enabled = false;

    /** Comma-separated IPs or CIDR ranges. */
    #[SettingField(controlType: ControlType::Text, label: 'IP Blocklist', validation: ['nullable', 'string', 'max:2000'], sortOrder: 4, group: 'IP Access Control')]
    public string $ip_blocklist = '';

    // ── API Keys ─────────────────────────────────────────────────

    /** 0 = never expire. */
    #[SettingGroup(label: 'API Keys', description: 'API key expiration and limits.', icon: 'key', sortOrder: 4)]
    #[SettingField(controlType: ControlType::Number, label: 'API Key Expiry (days)', validation: ['nullable', 'integer', 'min:0', 'max:3650'], sortOrder: 1, group: 'API Keys', min: 0, max: 3650)]
    public int $api_key_expiry_days = 365;

    #[SettingField(controlType: ControlType::Number, label: 'Max Keys Per User', validation: ['nullable', 'integer', 'min:1', 'max:50'], sortOrder: 2, group: 'API Keys', min: 1, max: 50)]
    public int $api_key_max_per_user = 5;

    public static function group(): string
    {
        return 'security';
    }
}

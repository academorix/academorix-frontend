<?php

declare(strict_types=1);

/**
 * SubscriptionSettings — Billing & Subscription Plan Configuration.
 *
 * Defines the canonical schema for subscription settings within the
 * Unified Settings System. Controls trial periods, grace periods,
 * billing provider credentials, and per-tenant resource limits.
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
use Stackra\Settings\Enums\BillingProvider;
use Stackra\Settings\Enums\ControlType;

/**
 * Subscription Settings.
 *
 * System-scoped settings for billing infrastructure. Shared across all
 * tenants since billing configuration is centralized.
 */
#[AsSetting(group: 'subscription', label: 'Subscription', description: 'Billing and subscription plan configuration.', icon: 'credit-card', scope: 'system', sortOrder: 9)]
class SubscriptionSettings extends Settings
{
    // ── Plans ────────────────────────────────────────────────────

    #[SettingGroup(label: 'Plans', description: 'Trial, grace period, and proration settings.', icon: 'calendar', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Number, label: 'Trial Days', validation: ['nullable', 'integer', 'min:0', 'max:90'], sortOrder: 1, group: 'Plans', min: 0, max: 90)]
    public int $trial_days = 14;

    #[SettingField(controlType: ControlType::Number, label: 'Grace Period (days)', validation: ['nullable', 'integer', 'min:0', 'max:30'], sortOrder: 2, group: 'Plans', min: 0, max: 30)]
    public int $grace_period_days = 3;

    #[SettingField(controlType: ControlType::Toggle, label: 'Proration Enabled', sortOrder: 3, group: 'Plans')]
    public bool $proration_enabled = true;

    // ── Billing Provider ─────────────────────────────────────────

    #[SettingGroup(label: 'Billing Provider', description: 'Payment gateway credentials.', icon: 'wallet', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Select, label: 'Billing Provider', validation: ['nullable', 'string', 'in:stripe,paddle,none'], sortOrder: 1, group: 'Billing Provider', options: BillingProvider::class)]
    public string $billing_provider = 'stripe';

    #[SettingField(controlType: ControlType::Text, label: 'Stripe Publishable Key', validation: ['nullable', 'string', 'max:255'], sortOrder: 2, group: 'Billing Provider')]
    public string $stripe_key = '';

    #[SettingField(controlType: ControlType::Password, label: 'Stripe Secret Key', validation: ['nullable', 'string', 'max:255'], sortOrder: 3, group: 'Billing Provider', sensitive: true)]
    public string $stripe_secret = '';

    #[SettingField(controlType: ControlType::Password, label: 'Stripe Webhook Secret', validation: ['nullable', 'string', 'max:255'], sortOrder: 4, group: 'Billing Provider', sensitive: true)]
    public string $stripe_webhook_secret = '';

    // ── Limits ───────────────────────────────────────────────────

    /** 0 = unlimited. */
    #[SettingGroup(label: 'Limits', description: 'Per-tenant resource limits. 0 = unlimited.', icon: 'bar-chart', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Number, label: 'Max Users Per Tenant', validation: ['nullable', 'integer', 'min:0', 'max:10000'], sortOrder: 1, group: 'Limits', min: 0, max: 10000)]
    public int $max_users_per_tenant = 0;

    /** 0 = unlimited. */
    #[SettingField(controlType: ControlType::Number, label: 'Max Storage (GB) Per Tenant', validation: ['nullable', 'integer', 'min:0', 'max:10000'], sortOrder: 2, group: 'Limits', min: 0, max: 10000)]
    public int $max_storage_gb_per_tenant = 0;

    /** 0 = unlimited. */
    #[SettingField(controlType: ControlType::Number, label: 'Max API Calls Per Day', validation: ['nullable', 'integer', 'min:0', 'max:1000000'], sortOrder: 3, group: 'Limits', min: 0, max: 1000000)]
    public int $max_api_calls_per_day = 0;

    public static function group(): string
    {
        return 'subscription';
    }
}

<?php

/**
 * @file src/Settings/HealthSettings.php
 *
 * @description
 * Platform-health notification knobs. Ported from
 * `foundation.health.slack.*` in the old codebase.
 *
 * ## Group key
 *
 * `health` — stored under `scope_values.namespace='settings'`
 * with keys `health.slack_webhook_url`, `health.slack_channel`.
 *
 * ## Scope
 *
 * `System` — a single platform destination for health alerts.
 * Multi-tenant deployments never want each tenant to define
 * their own on-call channel.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Settings;

use Academorix\Settings\Attributes\AsSetting;
use Academorix\Settings\Attributes\SettingField;
use Academorix\Settings\Enums\ControlType;
use Academorix\Settings\Enums\SettingScope;

/**
 * Health-notification integration settings.
 *
 * Consumed by the health-check scheduler + the horizon incident
 * hook. When both fields are empty the platform runs in silent
 * mode — checks still execute, but no Slack post is emitted.
 */
#[AsSetting(
    group: 'health',
    label: 'Health notifications',
    description: 'Platform health-check alerting integration.',
    icon: 'heart-pulse',
    // Access to health/ops settings should require a higher
    // permission than the generic settings read — operators only.
    permission: 'settings.health.read',
    scope: SettingScope::System,
    sortOrder: 800,
)]
final class HealthSettings
{
    /**
     * Slack incoming-webhook URL used by the health-check
     * scheduler to post platform-degraded / recovery events.
     *
     * ## Sensitivity
     *
     * The webhook URL itself is a bearer token — anyone with the
     * URL can post to the channel. Marked sensitive so it's
     * masked in GET responses.
     */
    #[SettingField(
        controlType: ControlType::Url,
        label: 'Slack webhook URL',
        description: 'Slack incoming-webhook URL used for platform health alerts. Leave empty to disable Slack posts entirely.',
        validation: ['nullable', 'url', 'starts_with:https://hooks.slack.com/'],
        sensitive: true,
        placeholder: 'https://hooks.slack.com/services/T00000/B00000/...',
        maxLength: 500,
        sortOrder: 10,
    )]
    public ?string $slack_webhook_url = null;

    /**
     * Optional channel override — the webhook itself is bound to
     * a channel by Slack, but this lets the operator route
     * alerts to a different channel without minting a new
     * webhook.
     */
    #[SettingField(
        controlType: ControlType::Text,
        label: 'Slack channel override',
        description: 'Optional Slack channel to post to (e.g. `#ops-alerts`). When empty, the webhook default channel is used.',
        validation: ['nullable', 'string', 'max:80', 'regex:/^#[a-z0-9._-]{1,79}$/'],
        placeholder: '#ops-alerts',
        maxLength: 80,
        pattern: '^#[a-z0-9._-]{1,79}$',
        sortOrder: 20,
    )]
    public ?string $slack_channel = null;
}

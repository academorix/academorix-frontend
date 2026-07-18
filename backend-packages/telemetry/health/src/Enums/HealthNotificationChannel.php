<?php

/**
 * @file packages/health/src/Enums/HealthNotificationChannel.php
 *
 * @description
 * Enumeration of logical notification channels a health check can
 * route failures to.
 *
 * ## The "logical channel, not the destination" rule
 *
 * Packages that ship a `#[AsHealthCheck(..., channel: X)]` marker
 * declare the LOGICAL routing (`SlackPlatformEng`, `PagerDuty`), not
 * the concrete destination (`https://hooks.slack.com/services/T...`
 * or a specific PagerDuty service key). The mapping from logical
 * channel to concrete notifiable lives at the APP level, keyed off
 * environment config — that keeps every package
 * environment-agnostic and stops secrets leaking into package repos.
 *
 * A static grep test in `packages/architecture` enforces that no
 * feature package can hardcode a Slack webhook or PagerDuty service
 * key. Anything routing-adjacent MUST reference one of the cases
 * below.
 *
 * ## Extending
 *
 * Adding a new channel is a 3-step change:
 *
 *   1. Add a case here (e.g. `case Opsgenie = 'opsgenie';`).
 *   2. Extend
 *      {@see \Academorix\Health\Support\HealthNotificationConfig::resolveChannel()}
 *      so it knows how to translate the new case into a notifiable.
 *   3. Every consuming app publishes a matching config block under
 *      `config('health.notifications.opsgenie')`.
 *
 * The enum is a `string`-backed enum so operators can override the
 * routing from environment / config using the case value as a key
 * (`'slack.platform-eng' => env('HEALTH_SLACK_PLATFORM_ENG_WEBHOOK')`).
 *
 * @see \Academorix\Health\Support\HealthNotificationConfig
 * @see \Academorix\Health\Attributes\AsHealthCheck  Consumers of this enum.
 */

declare(strict_types=1);

namespace Academorix\Health\Enums;

use Academorix\Enum\Enum;

enum HealthNotificationChannel: string
{
    use Enum;

    /**
     * Platform engineering Slack channel.
     *
     * Route infrastructure-adjacent failures here: pgvector missing,
     * Redis unreachable, Postgres primary flapping, storage disk
     * full, TLS certificate expiry warnings.
     *
     * Cadence expectation: someone is watching this channel during
     * office hours; page-adjacent failures should ALSO route to
     * {@see self::PagerDuty}.
     */
    case SlackPlatformEng = 'slack.platform-eng';

    /**
     * General operations Slack channel.
     *
     * Route business-visible failures here that aren't necessarily
     * platform-eng owned: queue backpressure, scheduler drift,
     * feature-flag rollout regressions.
     */
    case SlackOps = 'slack.ops';

    /**
     * Security incident Slack channel.
     *
     * Route auth / crypto / secret-adjacent failures here: JWT
     * signing key rotation gaps, session store integrity failures,
     * anomalous auth spikes flagged by a health check.
     */
    case SlackSecurity = 'slack.security';

    /**
     * PagerDuty — wakes an on-call human.
     *
     * Route ONLY failures that require human action within the SLA.
     * Every check routing here must have a clear runbook + a stable
     * name (the PagerDuty deduplication key is derived from the
     * check's {@see \Academorix\Health\Attributes\AsHealthCheck::$name}).
     */
    case PagerDuty = 'pagerduty';

    /**
     * Email — SLA reports, weekly digests.
     *
     * Route slow-burn signals here that don't need chat-speed
     * response: quota approaching, deprecation warnings, cert
     * expiry weeks out.
     */
    case Email = 'email';

    /**
     * Local logging only — no push notification.
     *
     * Route dev / staging checks here so they surface on the
     * dashboard without spamming real notification surfaces. Prefer
     * leaving `channel: null` on the attribute over using this case
     * unless you specifically want the log-only routing recorded.
     */
    case LogOnly = 'log';

    /**
     * Human-readable label rendered on the dashboard.
     *
     * Kept alongside the case value so a package can render a nice
     * "Routed to: Platform Engineering (Slack)" tooltip without
     * teaching every consumer about the enum layout.
     */
    public function label(): string
    {
        return match ($this) {
            self::SlackPlatformEng => 'Platform Engineering (Slack)',
            self::SlackOps => 'Ops (Slack)',
            self::SlackSecurity => 'Security (Slack)',
            self::PagerDuty => 'On-call (PagerDuty)',
            self::Email => 'Email digest',
            self::LogOnly => 'Log only (no push)',
        };
    }
}

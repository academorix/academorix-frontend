<?php

/**
 * @file packages/health/src/Support/HealthNotificationConfig.php
 *
 * @description
 * Translates a {@see HealthNotificationChannel} case into a concrete
 * notifiable / notification route consumable by Spatie Health.
 *
 * ## The one-way arrow
 *
 * Feature packages route by channel enum only —
 * `channel: HealthNotificationChannel::SlackPlatformEng`. That value
 * NEVER leaves the enum until it hits this class. This is the single
 * seam between the abstract routing intent and the concrete
 * notifiable, which means:
 *
 *   - Feature packages stay environment-agnostic.
 *   - Slack webhooks, PagerDuty routing keys, and email lists live
 *     ONLY in app config (or Doppler), never in package code.
 *   - Adding a new environment (staging, e2e, chaos) means editing
 *     `config/health.php` in the app, not touching a package.
 *
 * ## Config shape
 *
 * Apps publish `config/health.php` that carries a `notifications`
 * block. The block is keyed by the enum's string value:
 *
 * ```php
 * // apps/ai-service/config/health.php
 * return [
 *     'notifications' => [
 *         HealthNotificationChannel::SlackPlatformEng->value => [
 *             'driver' => 'slack',
 *             'webhook' => env('HEALTH_SLACK_PLATFORM_ENG_WEBHOOK'),
 *         ],
 *         HealthNotificationChannel::PagerDuty->value => [
 *             'driver' => 'pagerduty',
 *             'integration_key' => env('HEALTH_PAGERDUTY_KEY'),
 *         ],
 *         HealthNotificationChannel::Email->value => [
 *             'driver' => 'mail',
 *             'to' => env('HEALTH_EMAIL_TO', 'ops@stackra.test'),
 *         ],
 *     ],
 * ];
 * ```
 *
 * ## Resolution
 *
 * When {@see HealthCheckDiscoverer} sees a check with a `channel`,
 * it calls {@see resolveChannel()} once and stashes the resulting
 * notifiable on the check (via Spatie's `notifyOnFailure()` on the
 * check builder, when available; otherwise via global
 * notification config).
 *
 * ## What happens when the channel isn't configured
 *
 * A missing / empty notifiable does NOT throw. It logs a `warning`
 * and skips registration. Rationale: dev + local environments
 * frequently don't have Slack / PagerDuty wired up, and we don't
 * want boot to fail because someone hasn't provisioned an alerting
 * channel that would never fire locally anyway. Production
 * envs catch this via a separate config-audit CI job.
 *
 * @see HealthNotificationChannel  Enum this class translates.
 * @see HealthCheckDiscoverer      Consumer at boot time.
 */

declare(strict_types=1);

namespace Stackra\Health\Support;

use Stackra\Health\Enums\HealthNotificationChannel;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

final class HealthNotificationConfig
{
    /**
     * @param ConfigRepository $config Laravel's config repository.
     *   Injected so tests can rebind with an in-memory fake.
     */
    public function __construct(
        private readonly ConfigRepository $config,
    ) {
    }

    /**
     * Resolve a logical channel to its concrete configuration.
     *
     * The returned array shape follows Laravel's notification
     * routing convention — a `driver` key identifying the transport
     * plus driver-specific keys (e.g. `webhook`, `integration_key`,
     * `to`). Consumers pass the array to Spatie Health's
     * notification pipeline.
     *
     * @param HealthNotificationChannel $channel Logical channel to
     *   resolve.
     * @return array{driver: string, ...}|null Concrete notifiable
     *   config, or `null` when the channel is not configured in
     *   the current environment.
     */
    public function resolveChannel(HealthNotificationChannel $channel): ?array
    {
        $configKey = "health.notifications.{$channel->value}";

        /** @var mixed $entry */
        $entry = $this->config->get($configKey);

        if (! is_array($entry) || $entry === []) {
            return null;
        }

        // Sanity: every entry MUST declare a driver. Silently
        // ignoring a malformed entry would leave the notifiable
        // half-configured and the operator none the wiser.
        if (! isset($entry['driver']) || ! is_string($entry['driver'])) {
            return null;
        }

        /** @var array{driver: string, ...} $entry */
        return $entry;
    }

    /**
     * Return every configured channel — used by the health
     * dashboard to render a "which channels are wired" summary.
     *
     * Enum cases without a corresponding config entry are omitted.
     *
     * @return array<value-of<HealthNotificationChannel>, array{driver: string, ...}>
     */
    public function configuredChannels(): array
    {
        $result = [];

        foreach (HealthNotificationChannel::cases() as $channel) {
            $entry = $this->resolveChannel($channel);

            if ($entry !== null) {
                $result[$channel->value] = $entry;
            }
        }

        return $result;
    }
}

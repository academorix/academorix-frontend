<?php

declare(strict_types=1);

namespace Stackra\Notifications\Support;

/**
 * Readonly VO describing the effective preference decision for a
 * `(user, category, channel)` tuple at dispatch time.
 *
 * Returned by `NotificationPreferenceResolverInterface::resolve()`.
 * The dispatch gateway branches on `enabled` first, then `digestMode`
 * to decide whether to dispatch immediately or defer.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final readonly class NotificationPreferenceDecision
{
    /**
     * @param  bool         $enabled          Whether delivery is enabled.
     * @param  string       $digestMode       Digest mode backing value.
     * @param  bool         $inQuietHours     Whether the current time is inside quiet hours.
     * @param  string       $source           Source of the resolved decision (user / tenant / platform).
     * @param  string|null  $quietHoursStart  Quiet-hours window start (24h `HH:MM`).
     * @param  string|null  $quietHoursEnd    Quiet-hours window end (24h `HH:MM`).
     * @param  string|null  $timezone         Timezone the quiet-hours window applies to.
     */
    public function __construct(
        public bool $enabled,
        public string $digestMode,
        public bool $inQuietHours,
        public string $source,
        public ?string $quietHoursStart = null,
        public ?string $quietHoursEnd = null,
        public ?string $timezone = null,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace Academorix\Settings\Listeners;

use Academorix\Activity\Contracts\ActivityLoggerInterface;
use Academorix\Settings\Events\SettingsChangeEvent;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Product-feed audit listener — writes one `activity_log` row
 * per changed field for every `SettingsChangeEvent`.
 *
 * Sink for the tenant-facing "Recent activity" widget. Rows land
 * under `log_name = 'settings'`, `event = 'updated'`, with the
 * `group`, `field_key`, `old_value`, `new_value` in the vendor
 * `properties` blob. Retention is tier-based (30 / 90 / 365
 * days) — delegated to the `academorix/activity` retention
 * runner.
 *
 * ## Failure semantics
 *
 * Every write is wrapped in `try { ... } catch (Throwable) { log }`
 * so a broken activity_log table never rolls back a settings
 * mutation. Losing an activity row is preferable to blocking the
 * operator's write path — the compliance sink covers the
 * durability requirement.
 *
 * ## Octane safety
 *
 * `#[Scoped]` — resolves fresh per request. Holds no mutable
 * state; the injected `ActivityLoggerInterface` is a singleton,
 * the logger channel is process-lifetime.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(self::class)]
#[Scoped]
final class WriteSettingsChangeToActivity
{
    /**
     * @param  ActivityLoggerInterface  $activity  The typed activity logger — enforces subject_label / causer_name / icon / tenant_id on every row.
     * @param  LoggerInterface  $log  Fallback log channel — used when the activity write fails.
     */
    public function __construct(
        private readonly ActivityLoggerInterface $activity,
        private readonly LoggerInterface $log,
    ) {}

    /**
     * Handle the settings-change event.
     *
     * Writes one activity row per changed field. Old value +
     * new value ride along as `properties` extras so the widget
     * can render a "changed X from A to B" line without a
     * follow-up fetch.
     */
    public function handle(SettingsChangeEvent $event): void
    {
        foreach ($event->changedFields as $fieldKey) {
            try {
                /** @var mixed $newValue */
                $newValue = $event->values[$fieldKey] ?? null;

                $this->activity->log(
                    logName: 'settings',
                    event: 'updated',
                    subject: null,
                    description: sprintf(
                        'Updated setting %s.%s',
                        $event->group,
                        $fieldKey,
                    ),
                    icon: 'sliders-horizontal',
                    properties: [
                        'group' => $event->group,
                        'field_key' => $fieldKey,
                        'new_value' => $newValue,
                    ],
                    tenantId: $event->tenantId !== null ? (string) $event->tenantId : null,
                );
            } catch (Throwable $e) {
                $this->log->warning('SettingsChangeActivityWriteFailed', [
                    'group' => $event->group,
                    'field_key' => $fieldKey,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }
}

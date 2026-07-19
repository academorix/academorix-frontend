<?php

declare(strict_types=1);

namespace Academorix\Settings\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a settings write is refused.
 *
 * Consumed by the metrics collector (misuse rate) + compliance's
 * audit listener (records the refusal for the trail). The `reason`
 * field is a stable machine-readable code — never localised.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'settings.settings.write_refused')]
final readonly class SettingsWriteRefused implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $key        Field slug.
     * @param  string  $reason     Stable code — `validation_failed` /
     *                             `locked` / `permission_denied` /
     *                             `sensitive_reveal_denied` /
     *                             `writes_kill_switched`.
     * @param  string  $scopeKind  `system` / `tenant` / `user`.
     */
    public function __construct(
        public string $key,
        public string $reason,
        public string $scopeKind,
    ) {
    }
}

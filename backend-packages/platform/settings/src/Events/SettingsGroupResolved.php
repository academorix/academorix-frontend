<?php

declare(strict_types=1);

namespace Academorix\Settings\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after the API returns a fully-resolved group.
 *
 * Informational for observability — consumed by the metrics collector
 * to plot cascade depth + resolution latency. Never carries values in
 * its payload (there could be many, some sensitive) — subscribers that
 * need field values must re-read via the resolver.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'settings.settings.group_resolved')]
final readonly class SettingsGroupResolved implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string       $groupKey  Group slug.
     * @param  string       $scopeKind `system` / `tenant` / `user`.
     * @param  string|null  $scopeId   Concrete owner id — NULL for system.
     */
    public function __construct(
        public string $groupKey,
        public string $scopeKind,
        public ?string $scopeId,
    ) {
    }
}

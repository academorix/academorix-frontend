<?php

declare(strict_types=1);

namespace Academorix\Settings\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched after a settings write commits.
 *
 * Consumed by the activity module (tenant-facing feed, tier-based
 * retention) AND the audit module (immutable compliance trail, 7y
 * cold) — the platform's dual-write contract. `ShouldDispatchAfterCommit`
 * ensures both consumers only see rows that survived the transaction.
 *
 * Sensitive fields carry masked values on the payload — consumers
 * that need the raw value must re-read via
 * {@see \Academorix\Settings\Contracts\Services\SettingsResolverInterface}
 * with a caller that carries `settings.view-sensitive`.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'settings.settings.changed')]
final readonly class SettingsChangeEvent implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string       $key         Field slug.
     * @param  mixed        $before      Previous value (masked when sensitive).
     * @param  mixed        $after       New value (masked when sensitive).
     * @param  string       $scopeKind   `system` / `tenant` / `user`.
     * @param  string|null  $scopeId     Concrete owner id — NULL for system.
     * @param  string|null  $userId      Acting user id (null for system-driven writes).
     * @param  bool         $isSensitive Whether the schema flags this field sensitive.
     */
    public function __construct(
        public string $key,
        public mixed $before,
        public mixed $after,
        public string $scopeKind,
        public ?string $scopeId,
        public ?string $userId,
        public bool $isSensitive,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Events;

use Stackra\Events\Attributes\AsEvent;

/**
 * Fired when a kill-switch row exits its active window (or is soft-deleted).
 *
 * Immutable payload. Consumers: incident channel, audit trail.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'feature-flags.kill-switch.disabled')]
final readonly class FeatureFlagKillSwitchDisabled
{
    /**
     * @param  string       $flag        Flag identifier being turned back on.
     * @param  string       $scopeLevel  Target scope level slug.
     * @param  string|null  $scopeValue  Target entity id, or null for level-wide.
     * @param  string|null  $actorId     Optional acting principal id.
     */
    public function __construct(
        public string $flag,
        public string $scopeLevel,
        public ?string $scopeValue,
        public ?string $actorId = null,
    ) {}
}

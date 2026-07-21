<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Events;

use Stackra\Events\Attributes\AsEvent;

/**
 * Fired when a kill-switch row enters its active window.
 *
 * Immutable payload. Consumers: incident channel, audit trail.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'feature-flags.kill-switch.enabled')]
final readonly class FeatureFlagKillSwitchEnabled
{
    /**
     * @param  string       $flag           Flag identifier being shut off.
     * @param  string       $scopeLevel     Target scope level slug.
     * @param  string|null  $scopeValue     Target entity id, or null for "every value at this level".
     * @param  string|null  $reason         Operator-supplied reason.
     * @param  string|null  $actorId        Optional acting principal id.
     */
    public function __construct(
        public string $flag,
        public string $scopeLevel,
        public ?string $scopeValue,
        public ?string $reason,
        public ?string $actorId = null,
    ) {}
}

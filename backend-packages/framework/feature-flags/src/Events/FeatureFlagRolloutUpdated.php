<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Events;

use Academorix\Events\Attributes\AsEvent;

/**
 * Fired after a rollout row is created / updated.
 *
 * Immutable payload. Includes the old + new percentage so
 * consumers (audit + analytics) can chart ratchet operations.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'feature-flags.rollout.updated')]
final readonly class FeatureFlagRolloutUpdated
{
    /**
     * @param  string       $flag           Flag identifier the rollout targets.
     * @param  string       $tenantId       Owning tenant id.
     * @param  string       $rolloutId      Prefixed-ULID id of the row.
     * @param  string       $scopeLevel     Target scope level slug.
     * @param  int          $oldPercentage  Previous percentage (0 when just created).
     * @param  int          $newPercentage  Current percentage.
     * @param  string|null  $actorId        Optional acting principal id.
     */
    public function __construct(
        public string $flag,
        public string $tenantId,
        public string $rolloutId,
        public string $scopeLevel,
        public int $oldPercentage,
        public int $newPercentage,
        public ?string $actorId = null,
    ) {}
}

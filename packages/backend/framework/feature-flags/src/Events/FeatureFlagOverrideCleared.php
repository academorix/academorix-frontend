<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Events;

use Stackra\Events\Attributes\AsEvent;

/**
 * Fired after an override row is deleted (soft-delete).
 *
 * Immutable payload. Consumers: audit trail, cache invalidation.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'feature-flags.override.cleared')]
final readonly class FeatureFlagOverrideCleared
{
    /**
     * @param  string       $flag        Flag identifier the override targeted.
     * @param  string       $tenantId    Owning tenant id.
     * @param  string       $overrideId  Prefixed-ULID id of the retired row.
     * @param  string|null  $actorId     Optional acting principal id.
     */
    public function __construct(
        public string $flag,
        public string $tenantId,
        public string $overrideId,
        public ?string $actorId = null,
    ) {}
}

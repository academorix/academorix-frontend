<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Events;

use Stackra\Events\Attributes\AsEvent;

/**
 * Fired after a new override row is persisted.
 *
 * Immutable payload. Consumers: audit trail, analytics, cache invalidation triggers.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'feature-flags.override.created')]
final readonly class FeatureFlagOverrideCreated
{
    /**
     * @param  string       $flag         Flag identifier the override targets.
     * @param  string       $tenantId     Owning tenant id.
     * @param  string       $overrideId   Prefixed-ULID id of the new row.
     * @param  string       $decision     `allow` or `deny` — backing value of `OverrideDecision`.
     * @param  string       $scopeLevel   Target scope level slug.
     * @param  string       $scopeValue   Target entity id at `scopeLevel`.
     * @param  string|null  $actorId      Optional acting principal id.
     */
    public function __construct(
        public string $flag,
        public string $tenantId,
        public string $overrideId,
        public string $decision,
        public string $scopeLevel,
        public string $scopeValue,
        public ?string $actorId = null,
    ) {}
}

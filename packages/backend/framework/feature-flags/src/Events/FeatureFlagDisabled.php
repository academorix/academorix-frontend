<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Events;

use Stackra\Events\Attributes\AsEvent;

/**
 * Fired after an override, rollout, or kill-switch takes a flag off for a tenant.
 *
 * Immutable payload. Consumers: audit trail, analytics.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'feature-flags.disabled')]
final readonly class FeatureFlagDisabled
{
    /**
     * @param  string       $tenantId  Tenant the flag turned off for.
     * @param  string       $flag      Stable dot-separated flag identifier.
     * @param  string       $source    Deciding source — backing value of `ResolutionSource`.
     * @param  string|null  $actorId   Optional acting principal id.
     */
    public function __construct(
        public string $tenantId,
        public string $flag,
        public string $source,
        public ?string $actorId = null,
    ) {}
}

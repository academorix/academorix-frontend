<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Events;

use Academorix\Events\Attributes\AsEvent;

/**
 * Fired after an override or discovery pass results in a flag being turned on for a tenant.
 *
 * Immutable payload. Consumers: audit trail, analytics.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'feature-flags.enabled')]
final readonly class FeatureFlagEnabled
{
    /**
     * @param  string       $tenantId  Tenant the flag turned on for.
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

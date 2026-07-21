<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Events;

use Stackra\Events\Attributes\AsEvent;

/**
 * Fired when a platform admin force-disables a hierarchy flag with orphan-risk rows.
 *
 * Immutable payload. Requirement 8.7 mandates the event carry
 * per-level overflow counts so audit tooling can reconstruct the
 * shape of the hierarchy at force-disable time.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'feature-flags.hierarchy.force-disabled')]
final readonly class FeatureHierarchyForceDisabled
{
    /**
     * @param  string                   $flag          Hierarchy flag that was disabled.
     * @param  string                   $tenantId      Tenant the disable applied to.
     * @param  string                   $actorId       Platform-admin actor id.
     * @param  array<string, int>       $levelCounts   Map of scope_level → row count at force time.
     * @param  string                   $timestamp     ISO-8601 timestamp of the force operation.
     */
    public function __construct(
        public string $flag,
        public string $tenantId,
        public string $actorId,
        public array $levelCounts,
        public string $timestamp,
    ) {}
}

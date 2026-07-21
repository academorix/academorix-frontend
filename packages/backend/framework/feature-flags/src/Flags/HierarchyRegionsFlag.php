<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Flags;

use Stackra\FeatureFlags\Attributes\AsFeatureFlag;
use Stackra\FeatureFlags\Enums\FlagKind;

/**
 * `hierarchy.regions` — enables the optional Regions layer in the tenant hierarchy.
 *
 * Off by default. When enabled for a tenant (via plan entitlement
 * or explicit override), Regions become insertable between
 * Tenant and Organization in `scope_definitions` and every
 * downstream consumer (settings, permissions, admin surfaces)
 * picks up the new level automatically.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsFeatureFlag(
    name: 'hierarchy.regions',
    description: 'Optional Regions layer in the tenant hierarchy.',
    kind: FlagKind::PlanGate,
    defaultOff: true,
)]
final class HierarchyRegionsFlag
{
    // Marker class — the composed FeatureResolver drives the decision.
}

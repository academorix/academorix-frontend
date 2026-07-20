<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Flags;

use Academorix\FeatureFlags\Attributes\AsFeatureFlag;
use Academorix\FeatureFlags\Enums\FlagKind;

/**
 * `hierarchy.organizations` — enables the optional Organizations layer.
 *
 * Off by default. When enabled, Organizations become insertable
 * between Tenant / Region and Branch in `scope_definitions`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsFeatureFlag(
    name: 'hierarchy.organizations',
    description: 'Optional Organizations layer in the tenant hierarchy.',
    kind: FlagKind::PlanGate,
    defaultOff: true,
)]
final class HierarchyOrganizationsFlag
{
    // Marker class — the composed FeatureResolver drives the decision.
}

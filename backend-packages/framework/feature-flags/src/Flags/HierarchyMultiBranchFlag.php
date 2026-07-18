<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Flags;

use Academorix\FeatureFlags\Attributes\AsFeatureFlag;
use Academorix\FeatureFlags\Enums\FlagKind;

/**
 * `hierarchy.multi_branch` — enables multiple Branches per Tenant / Organization.
 *
 * Off by default (single-branch tenants). When enabled, the admin
 * surface lets operators provision additional branches and the
 * scope resolver permits sibling branch nodes under the same
 * parent.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsFeatureFlag(
    name: 'hierarchy.multi_branch',
    description: 'Multi-branch support inside a single tenant / organization.',
    kind: FlagKind::PlanGate,
    defaultOff: true,
)]
final class HierarchyMultiBranchFlag
{
    // Marker class — the composed FeatureResolver drives the decision.
}

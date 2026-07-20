<?php

/**
 * @file src/Enums/ScopeResolverPriority.php
 *
 * @description
 * Canonical priority constants for the shipped resolvers. Provided
 * as an enum so consumer packages can reference them by name
 * ("higher than TenantContext, lower than Header") instead of
 * copy-pasting magic numbers. The chain still accepts arbitrary
 * integers from `ScopeResolverInterface::priority()`.
 */

declare(strict_types=1);

namespace Academorix\Scope\Enums;

use Academorix\Enum\Enum;

/**
 * Priority table.
 *
 *   * Header          100  — explicit override, always wins.
 *   * Jwt              80  — decoded from a signed token, trusted.
 *   * TenantContext    60  — inferred from the active tenant.
 *   * Session          40  — legacy, only used when Sanctum PATs
 *                            aren't available (rare, admin panels).
 *   * RootFallback      0  — last resort, owner's root scope.
 *
 * Custom resolvers should slot between the shipped ones by using
 * bare integers; the enum names document the anchors.
 */
enum ScopeResolverPriority: int
{
    use Enum;

    case Header = 100;
    case Jwt = 80;
    case TenantContext = 60;
    case Session = 40;
    case RootFallback = 0;
}

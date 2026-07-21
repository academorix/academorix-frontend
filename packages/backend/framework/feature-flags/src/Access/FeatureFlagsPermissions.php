<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Access;

use Stackra\Access\Contracts\PermissionContributor;
use Stackra\Access\Data\PermissionDefinition;
use Stackra\Access\Enums\Guard;
use Stackra\Access\Registry\PermissionRegistry;
use Stackra\Foundation\Contributions\ContributorTag;

/**
 * Permissions owned by the FeatureFlags module.
 *
 * Registered under {@see ContributorTag::PERMISSIONS} so
 * {@see PermissionRegistry} aggregates the fleet catalog at boot.
 *
 * ## Permissions
 *
 *  * `feature-flags.view` — read-only access to the catalog and the
 *    `me.features` diagnostic endpoint (tenant guard).
 *  * `feature-flags.overrides.manage` — create/update/delete
 *    override rows (tenant guard).
 *  * `feature-flags.rollouts.manage` — create/update/delete
 *    rollout rows (tenant guard).
 *
 * Kill switches are gated by the `platform_admin` role via
 * `#[RequireRole('platform_admin')]` on their admin actions —
 * they never appear here (Requirement 19.5).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureFlagsPermissions implements PermissionContributor
{
    /**
     * Return every permission this module contributes.
     *
     * @return list<PermissionDefinition>
     */
    public function permissions(): array
    {
        return [
            new PermissionDefinition(
                name: 'feature-flags.view',
                guard: Guard::Sanctum,
                description: 'View the feature-flag catalog and diagnostic endpoints.',
                grantedTo: ['owner', 'admin'],
                isSystem: true,
            ),
            new PermissionDefinition(
                name: 'feature-flags.overrides.manage',
                guard: Guard::Sanctum,
                description: 'Create, update, and delete per-subject feature-flag overrides.',
                grantedTo: ['owner', 'admin'],
                isSystem: true,
            ),
            new PermissionDefinition(
                name: 'feature-flags.rollouts.manage',
                guard: Guard::Sanctum,
                description: 'Create, update, and delete percentage-based feature-flag rollouts.',
                grantedTo: ['owner', 'admin'],
                isSystem: true,
            ),
        ];
    }
}

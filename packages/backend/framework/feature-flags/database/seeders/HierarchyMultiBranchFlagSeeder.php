<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Database\Seeders;

use Stackra\FeatureFlags\Contracts\Data\FeatureInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureRepositoryInterface;
use Stackra\FeatureFlags\Enums\FlagKind;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seeder for the `hierarchy.multi_branch` flag.
 *
 * Production writes come from `FeatureFlagDiscovery` on
 * `package:discover`; this seeder is a local-dev / CI fallback
 * that ships the row through the repository seam. Uses
 * `$repository->factory()->create(...)` — no direct model access.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 100)]
final class HierarchyMultiBranchFlagSeeder extends Seeder
{
    /**
     * Guard flag consumed by the runner — skipped in production.
     *
     * @var bool
     */
    public static bool $isDemoOnly = true;

    /**
     * @param  FeatureRepositoryInterface  $features  Catalog persistence boundary.
     */
    public function __construct(
        private readonly FeatureRepositoryInterface $features,
    ) {}

    /**
     * Seed the `hierarchy.multi_branch` catalog row.
     *
     * @return void
     */
    public function run(): void
    {
        $this->features->factory()->create([
            FeatureInterface::ATTR_NAME        => 'hierarchy.multi_branch',
            FeatureInterface::ATTR_DESCRIPTION => 'Multi-branch support inside a single tenant / organization.',
            FeatureInterface::ATTR_KIND        => FlagKind::PlanGate->value,
            FeatureInterface::ATTR_DEFAULT_OFF => true,
            FeatureInterface::ATTR_CACHE_TTL   => null,
        ]);
    }
}

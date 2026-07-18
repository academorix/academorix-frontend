<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\FeatureFlags\Contracts\Data\FeatureInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureRepositoryInterface;
use Academorix\FeatureFlags\Models\Feature;
use Academorix\FeatureFlags\Registry\FeatureDefinition;
use Illuminate\Database\Eloquent\Collection;

/**
 * Attribute-first Eloquent implementation of {@see FeatureRepositoryInterface}.
 *
 * ## What this class owns
 *
 * Two discovery-time queries `FeatureFlagDiscovery` and
 * `FeatureFlagRegistry` need on top of the base CRUD surface:
 *
 *   - {@see findByName()} — natural-key lookup for registry hydration.
 *   - {@see upsertMany()} — idempotent bulk upsert on `package:discover`.
 *
 * CRUD comes for free from {@see Repository}. Model resolution is
 * driven by `#[UseModel]` — no `model()` override needed.
 *
 * @extends Repository<Feature>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(FeatureInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    FeatureInterface::ATTR_NAME        => ['$eq', '$contains', '$startsWith'],
    FeatureInterface::ATTR_KIND        => ['$eq', '$in'],
    FeatureInterface::ATTR_DEFAULT_OFF => ['$eq'],
])]
final class EloquentFeatureRepository extends Repository implements FeatureRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByName(string $name): ?Feature
    {
        /** @var Feature|null $row */
        $row = $this->query()
            ->where(FeatureInterface::ATTR_NAME, $name)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function allOrdered(): Collection
    {
        /** @var Collection<int, Feature> $rows */
        $rows = $this->query()
            ->orderBy(FeatureInterface::ATTR_NAME)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function upsertMany(array $definitions): void
    {
        if ($definitions === []) {
            return;
        }

        $rows = [];
        foreach ($definitions as $definition) {
            $rows[] = [
                FeatureInterface::ATTR_NAME        => $definition->name,
                FeatureInterface::ATTR_DESCRIPTION => $definition->description,
                FeatureInterface::ATTR_KIND        => $definition->kind->value,
                FeatureInterface::ATTR_DEFAULT_OFF => $definition->defaultOff,
                FeatureInterface::ATTR_CACHE_TTL   => $definition->cacheTtl,
            ];
        }

        Feature::query()->upsert(
            values: $rows,
            uniqueBy: [FeatureInterface::ATTR_NAME],
            update: [
                FeatureInterface::ATTR_DESCRIPTION,
                FeatureInterface::ATTR_KIND,
                FeatureInterface::ATTR_DEFAULT_OFF,
                FeatureInterface::ATTR_CACHE_TTL,
            ],
        );
    }
}

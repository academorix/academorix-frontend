<?php

declare(strict_types=1);

namespace Academorix\Settings\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Settings\Contracts\Data\SettingsGroupInterface;
use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Contracts\Repositories\SettingsSchemaRepositoryInterface;
use Academorix\Settings\Models\SettingsSchema;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SettingsSchemaRepositoryInterface}.
 *
 * Schema rows are read once at boot by the resolver and cached — the
 * repository's caching layer keeps the hot path fast for any consumer
 * that reads schemas per-request (admin UI, validators).
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SettingsSchemaInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    SettingsSchemaInterface::ATTR_GROUP_ID  => ['$eq', '$in'],
    SettingsSchemaInterface::ATTR_KEY       => ['$eq', '$in'],
    SettingsSchemaInterface::ATTR_TYPE      => ['$eq', '$in'],
    SettingsSchemaInterface::ATTR_SENSITIVE => ['$eq'],
    SettingsSchemaInterface::ATTR_IS_SYSTEM => ['$eq'],
])]
final class EloquentSettingsSchemaRepository extends Repository implements SettingsSchemaRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByGroup(string $groupId): Collection
    {
        /** @var Collection<int, SettingsSchema> $rows */
        $rows = $this->query()
            ->where(SettingsSchemaInterface::ATTR_GROUP_ID, $groupId)
            ->orderBy(SettingsSchemaInterface::ATTR_SORT_ORDER)
            ->orderBy(SettingsSchemaInterface::ATTR_KEY)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByGroupAndKey(string $groupKey, string $key): ?SettingsSchema
    {
        /** @var SettingsSchema|null $row */
        $row = $this->query()
            ->whereHas('group', static function ($q) use ($groupKey): void {
                $q->where(SettingsGroupInterface::ATTR_KEY, $groupKey);
            })
            ->where(SettingsSchemaInterface::ATTR_KEY, $key)
            ->first();

        return $row;
    }
}

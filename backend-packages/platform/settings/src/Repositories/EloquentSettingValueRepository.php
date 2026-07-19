<?php

declare(strict_types=1);

namespace Academorix\Settings\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Contracts\Data\SettingValueInterface;
use Academorix\Settings\Contracts\Repositories\SettingValueRepositoryInterface;
use Academorix\Settings\Models\SettingValue;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SettingValueRepositoryInterface}.
 *
 * The resolver's hot-path finder `resolve()` reads through the cache
 * layer — invalidated on every write via the tag flush emitted by the
 * writer's post-commit hook.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SettingValueInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    SettingValueInterface::ATTR_SCHEMA_ID  => ['$eq', '$in'],
    SettingValueInterface::ATTR_SCOPE_KIND => ['$eq', '$in'],
    SettingValueInterface::ATTR_SCOPE_ID   => ['$eq', '$in', '$null'],
    SettingValueInterface::ATTR_TENANT_ID  => ['$eq', '$in', '$null'],
])]
final class EloquentSettingValueRepository extends Repository implements SettingValueRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function resolve(string $schemaKey, string $scopeKind, ?string $scopeId): ?SettingValue
    {
        $q = $this->query()
            ->whereHas('schema', static function ($sub) use ($schemaKey): void {
                $sub->where(SettingsSchemaInterface::ATTR_KEY, $schemaKey);
            })
            ->where(SettingValueInterface::ATTR_SCOPE_KIND, $scopeKind);

        if ($scopeId === null) {
            $q->whereNull(SettingValueInterface::ATTR_SCOPE_ID);
        } else {
            $q->where(SettingValueInterface::ATTR_SCOPE_ID, $scopeId);
        }

        /** @var SettingValue|null $row */
        $row = $q->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByScope(string $scopeKind, ?string $scopeId): Collection
    {
        $q = $this->query()
            ->where(SettingValueInterface::ATTR_SCOPE_KIND, $scopeKind);

        if ($scopeId === null) {
            $q->whereNull(SettingValueInterface::ATTR_SCOPE_ID);
        } else {
            $q->where(SettingValueInterface::ATTR_SCOPE_ID, $scopeId);
        }

        /** @var Collection<int, SettingValue> $rows */
        $rows = $q->get();

        return $rows;
    }
}

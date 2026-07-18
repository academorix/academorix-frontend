<?php

declare(strict_types=1);

namespace Academorix\Settings\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Settings\Contracts\Data\SettingsGroupInterface;
use Academorix\Settings\Contracts\Repositories\SettingsGroupRepositoryInterface;
use Academorix\Settings\Models\SettingsGroup;

/**
 * Eloquent implementation of {@see SettingsGroupRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 3600, tags: true)]` — 1-hour TTL with tag-based
 * invalidation. Groups mutate only via the discovery pass (system
 * rows) or tenant admin (tenant-defined groups), so the tag flush on
 * every write leaves reads fast.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SettingsGroupInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    SettingsGroupInterface::ATTR_KEY       => ['$eq', '$in'],
    SettingsGroupInterface::ATTR_IS_SYSTEM => ['$eq'],
])]
final class EloquentSettingsGroupRepository extends Repository implements SettingsGroupRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByKey(string $key): ?SettingsGroup
    {
        /** @var SettingsGroup|null $row */
        $row = $this->query()
            ->where(SettingsGroupInterface::ATTR_KEY, $key)
            ->first();

        return $row;
    }
}

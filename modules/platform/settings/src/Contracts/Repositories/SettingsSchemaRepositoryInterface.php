<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Settings\Models\SettingsSchema;
use Academorix\Settings\Repositories\EloquentSettingsSchemaRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SettingsSchema}.
 *
 * @extends RepositoryInterface<SettingsSchema>
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(EloquentSettingsSchemaRepository::class)]
interface SettingsSchemaRepositoryInterface extends RepositoryInterface
{
    /**
     * Every schema for a group.
     *
     * @param  string  $groupId  The owning group's ULID.
     * @return Collection<int, SettingsSchema>  Schema rows in sort order.
     */
    public function findByGroup(string $groupId): Collection;

    /**
     * Find a single schema by `(group, key)`.
     *
     * @param  string  $groupKey  The group slug.
     * @param  string  $key       The field slug.
     * @return SettingsSchema|null  The schema, or null when the pair is unknown.
     */
    public function findByGroupAndKey(string $groupKey, string $key): ?SettingsSchema;
}

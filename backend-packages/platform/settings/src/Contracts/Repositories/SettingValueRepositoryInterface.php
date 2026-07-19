<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Settings\Models\SettingValue;
use Academorix\Settings\Repositories\EloquentSettingValueRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SettingValue}.
 *
 * Domain finders below are the hot-path lookups the resolver + writer
 * use; CRUD comes from `RepositoryInterface`.
 *
 * @extends RepositoryInterface<SettingValue>
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(EloquentSettingValueRepository::class)]
interface SettingValueRepositoryInterface extends RepositoryInterface
{
    /**
     * Resolve a value for `(schemaKey, scopeKind, scopeId)`.
     *
     * The caller supplies the field key (e.g. `default_locale`) —
     * this method joins to `settings_schemas` internally to find the
     * matching value row. Returns `null` when no row exists for the
     * given scope tuple; callers cascade to the next scope in that case.
     *
     * @param  string       $schemaKey  Field slug on `settings_schemas.key`.
     * @param  string       $scopeKind  One of `system` / `tenant` / `user`.
     * @param  string|null  $scopeId    Concrete owner id, or NULL for system.
     * @return SettingValue|null  The matching row, or null when absent.
     */
    public function resolve(string $schemaKey, string $scopeKind, ?string $scopeId): ?SettingValue;

    /**
     * Every value row bound to a scope owner.
     *
     * @param  string       $scopeKind  One of `system` / `tenant` / `user`.
     * @param  string|null  $scopeId    Concrete owner id, or NULL for system.
     * @return Collection<int, SettingValue>  Matching rows.
     */
    public function findByScope(string $scopeKind, ?string $scopeId): Collection;
}

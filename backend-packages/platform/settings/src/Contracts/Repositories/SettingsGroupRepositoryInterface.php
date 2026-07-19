<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Settings\Models\SettingsGroup;
use Academorix\Settings\Repositories\EloquentSettingsGroupRepository;
use Illuminate\Container\Attributes\Bind;

/**
 * Repository contract for {@see SettingsGroup}.
 *
 * @extends RepositoryInterface<SettingsGroup>
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(EloquentSettingsGroupRepository::class)]
interface SettingsGroupRepositoryInterface extends RepositoryInterface
{
    /**
     * Find a group by its stable slug (`general`, `notifications`, …).
     *
     * @param  string  $key  The group slug — matches `#[AsSetting(group: ...)]`.
     * @return SettingsGroup|null  The group, or null when none exists.
     */
    public function findByKey(string $key): ?SettingsGroup;
}

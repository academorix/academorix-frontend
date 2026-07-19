<?php

declare(strict_types=1);

namespace Academorix\Settings\Attributes;

use Attribute;

/**
 * Marks a class as a settings container for the boot-time discovery
 * pass.
 *
 * One `#[AsSetting]` per settings class. The class carries
 * `#[SettingGroup]` (visual section metadata) at the class level plus
 * one or more `#[SettingField]` attributes on its properties, and the
 * `SettingsDiscoveryBootstrapper` reads all three via reflection to
 * register the group + its fields into
 * {@see \Academorix\Settings\Contracts\Services\SettingsRegistryInterface}.
 *
 * The `group` argument doubles as the URL segment
 * (`/api/v1/settings/{group}`) and the spatie group identifier — so
 * it MUST match `^[a-z][a-z0-9_]{0,63}$`. Duplicate group keys fail
 * the discovery pass when
 * `config('settings.discovery.fail_on_duplicate_group')` is true.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsSetting
{
    /**
     * @param  string  $group        Unique group key. Matches API route + spatie group.
     * @param  string  $label        Human display label. Empty falls back to the key.
     * @param  string  $description  Short prose describing what the group covers.
     * @param  string  $icon         Semantic icon name (heroicons).
     * @param  string  $permission   Permission gating GET. PUT always requires
     *                               `settings.update.{group}`.
     * @param  string  $scope        Hierarchy scope — `system` / `tenant` / `user`.
     * @param  bool    $public       When true, GET skips auth (PUT still requires permission).
     * @param  int     $sortOrder    Ascending sort in the admin navigator.
     */
    public function __construct(
        public string $group,
        public string $label = '',
        public string $description = '',
        public string $icon = '',
        public string $permission = 'settings.read',
        public string $scope = 'system',
        public bool $public = false,
        public int $sortOrder = 0,
    ) {
    }
}

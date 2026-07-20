<?php

declare(strict_types=1);

namespace Academorix\Theme\Policies;

use Academorix\Theme\Contracts\Data\ThemePresetInterface;
use Academorix\Theme\Models\ThemePreset;
use Academorix\User\Models\User;

/**
 * Authorization policy for {@see ThemePreset}.
 *
 * Dual-source-aware: HTTP writes on `is_system = true` rows are refused
 * unconditionally — even for actors that hold `theme.manage` or
 * `platform.theme.manage-presets`. Platform preset mutation is a deploy
 * event: the seeder writes them via
 * {@see ThemePreset::allowSystemMutation()} on migrate/seed, and the
 * observer refuses every other write path.
 *
 * Wired via `#[UsePolicy(ThemePresetPolicy::class)]` on the model.
 *
 * @category Theme
 *
 * @since    0.1.0
 */
final class ThemePresetPolicy
{
    /**
     * Every authenticated tenant user with `theme.read` sees the
     * platform preset catalogue plus their tenant's customs.
     */
    public function viewAny(User $user, ThemePreset $model): bool
    {
        return $user->can('theme.read');
    }

    /**
     * Platform presets are cross-tenant readable by design; tenant
     * customs are scoped by the visibility rule on the repository.
     */
    public function view(User $user, ThemePreset $model): bool
    {
        return $user->can('theme.read');
    }

    /**
     * Tenant admin + design-role create tenant customs. Platform
     * preset creation goes through
     * {@see self::createPlatformPreset()} (platform-admin guard).
     */
    public function create(User $user, ThemePreset $model): bool
    {
        return $user->can('theme.manage');
    }

    /**
     * Academorix staff only — mutates the shared platform catalogue.
     */
    public function createPlatformPreset(User $user, ThemePreset $model): bool
    {
        return $user->can('platform.theme.manage-presets');
    }

    /**
     * Tenant custom presets are editable by admin + design-role;
     * system rows are IMMUTABLE and refuse writes unconditionally.
     */
    public function update(User $user, ThemePreset $model): bool
    {
        if ($this->isSystem($model)) {
            return false;
        }

        return $user->can('theme.manage');
    }

    /**
     * Duplication clones ANY preset (system OR custom) into a new
     * tenant custom preset — no `is_system` gate on the source, but
     * the destination is always tenant-scoped.
     */
    public function duplicate(User $user, ThemePreset $model): bool
    {
        return $user->can('theme.manage');
    }

    /**
     * Publishing flips a preset's `is_active` state. System rows are
     * IMMUTABLE — publish is refused; the seeder controls their
     * active state at deploy time.
     */
    public function publish(User $user, ThemePreset $model): bool
    {
        if ($this->isSystem($model)) {
            return false;
        }

        return $user->can('theme.manage');
    }

    /**
     * Deleting a system row is refused unconditionally. Tenant
     * customs are deletable by admin + design-role.
     */
    public function delete(User $user, ThemePreset $model): bool
    {
        if ($this->isSystem($model)) {
            return false;
        }

        return $user->can('theme.manage');
    }

    /**
     * Read the `is_system` flag off the model. Centralised here so
     * every guard uses the same source of truth.
     */
    private function isSystem(ThemePreset $model): bool
    {
        return (bool) $model->getAttribute(ThemePresetInterface::ATTR_IS_SYSTEM);
    }
}

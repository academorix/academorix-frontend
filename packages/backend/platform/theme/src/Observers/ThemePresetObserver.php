<?php

declare(strict_types=1);

namespace Stackra\Theme\Observers;

use Stackra\Theme\Contracts\Data\ThemePresetInterface;
use Stackra\Theme\Exceptions\ThemePresetSystemImmutableException;
use Stackra\Theme\Models\ThemePreset;

/**
 * Guardrail observer for the dual-source `theme_presets` catalogue.
 *
 * System rows (`is_system = true`) are IMMUTABLE outside the seeder.
 * Every other write path — HTTP admin mutations, Tinker, ad-hoc
 * migrations — trips {@see ThemePresetSystemImmutableException}. The
 * seeder opens the mutation-allowed scope via
 * {@see ThemePreset::allowSystemMutation()}; tests do the same when
 * fixturing system state.
 *
 * Wired via `#[ObservedBy(ThemePresetObserver::class)]` on the model.
 *
 * @category Theme
 *
 * @since    0.1.0
 */
final class ThemePresetObserver
{
    /**
     * Guard the `updating` path — reject mutations on system rows.
     */
    public function updating(ThemePreset $preset): void
    {
        $this->guard($preset, 'update');
    }

    /**
     * Guard the `deleting` path — reject deletes on system rows.
     */
    public function deleting(ThemePreset $preset): void
    {
        $this->guard($preset, 'delete');
    }

    /**
     * Enforce the system-row invariant. Called from every mutation hook.
     *
     * @throws ThemePresetSystemImmutableException  When a caller attempts
     *   to mutate a system row outside `allowSystemMutation`.
     */
    private function guard(ThemePreset $preset, string $action): void
    {
        if ((bool) $preset->getAttribute(ThemePresetInterface::ATTR_IS_SYSTEM) !== true) {
            return;
        }

        if (ThemePreset::isSystemMutationAllowed()) {
            return;
        }

        throw ThemePresetSystemImmutableException::forAction(
            action: $action,
            rowId: (string) $preset->getKey(),
        );
    }
}

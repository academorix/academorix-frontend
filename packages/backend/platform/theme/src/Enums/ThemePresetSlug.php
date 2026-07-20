<?php

declare(strict_types=1);

namespace Academorix\Theme\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Platform theme preset slugs — dual-source catalogue.
 *
 * Code branches on this enum for preset-driven defaults (e.g. the
 * `SeedDefaultThemeForNewTenant` hook reads
 * `ThemePlatformSettings::default_preset_slug` and resolves it to a
 * case here). The 6 non-{@see self::Custom} cases persist as system
 * rows in the `theme_presets` table with `is_system = true` and
 * `tenant_id = null`. Tenant-authored presets are `Custom` at the
 * code level and get their own rows with `is_system = false` and
 * `tenant_id` set to the owning tenant.
 *
 * ## Cases
 *
 *  * {@see self::LightDefault}       — light mode baseline shipped platform-wide.
 *  * {@see self::DarkDefault}        — dark mode baseline shipped platform-wide.
 *  * {@see self::HighContrastLight}  — WCAG-AAA contrast light preset for accessibility.
 *  * {@see self::HighContrastDark}   — WCAG-AAA contrast dark preset for accessibility.
 *  * {@see self::BrandForwardBlue}   — blue-forward brand palette.
 *  * {@see self::BrandForwardGreen}  — green-forward brand palette.
 *  * {@see self::Custom}             — code-only bucket for tenant-authored presets.
 *                                     Never persisted with this slug.
 *
 * Resolution pattern: `ThemePresetSlug::tryFrom($slug) ?? Custom`.
 *
 * @category Theme
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ThemePresetSlug: string
{
    use Enum;

    #[Label('Light Default')]
    #[Description('Light mode baseline shipped platform-wide. New tenants default to this preset when the settings say so.')]
    case LightDefault = 'light-default';

    #[Label('Dark Default')]
    #[Description('Dark mode baseline shipped platform-wide.')]
    case DarkDefault = 'dark-default';

    #[Label('High Contrast Light')]
    #[Description('WCAG-AAA contrast light preset. Selected automatically when the user carries the accessibility high_contrast flag.')]
    case HighContrastLight = 'high-contrast-light';

    #[Label('High Contrast Dark')]
    #[Description('WCAG-AAA contrast dark preset.')]
    case HighContrastDark = 'high-contrast-dark';

    #[Label('Brand Forward Blue')]
    #[Description('Blue-forward brand palette — cool, professional. Common enterprise default.')]
    case BrandForwardBlue = 'brand-forward-blue';

    #[Label('Brand Forward Green')]
    #[Description('Green-forward brand palette — approachable, wellness-adjacent. Common academy default.')]
    case BrandForwardGreen = 'brand-forward-green';

    /**
     * Catch-all bucket for tenant-authored presets. Never seeded, never
     * persisted with this backing value. Only reached via the canonical
     * resolution pattern `tryFrom($slug) ?? Custom`.
     */
    #[Label('Custom')]
    #[Description('Tenant-authored preset outside the shipped catalogue. Never persisted with this slug.')]
    case Custom = 'custom';

    /**
     * The user-visible name persisted on the `theme_presets.name` column
     * when the seeder writes the system row. Kept in sync with the enum
     * `Label` metadata by convention — this method is the single source
     * of truth for the seeder's payload.
     */
    public function displayName(): string
    {
        return match ($this) {
            self::LightDefault       => 'Light Default',
            self::DarkDefault        => 'Dark Default',
            self::HighContrastLight  => 'High Contrast Light',
            self::HighContrastDark   => 'High Contrast Dark',
            self::BrandForwardBlue   => 'Brand Forward Blue',
            self::BrandForwardGreen  => 'Brand Forward Green',
            self::Custom             => 'Custom',
        };
    }

    /**
     * Mode this preset targets (`light`, `dark`).
     */
    public function mode(): string
    {
        return match ($this) {
            self::LightDefault,
            self::HighContrastLight,
            self::BrandForwardBlue,
            self::BrandForwardGreen => 'light',

            self::DarkDefault,
            self::HighContrastDark  => 'dark',

            self::Custom            => 'light',
        };
    }

    /**
     * Whether this preset case ships as a `is_system = true` row.
     * Only `Custom` is a code-level bucket; every other case has a
     * corresponding seeded row.
     */
    public function isSystem(): bool
    {
        return $this !== self::Custom;
    }
}

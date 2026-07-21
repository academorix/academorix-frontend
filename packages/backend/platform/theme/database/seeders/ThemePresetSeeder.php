<?php

declare(strict_types=1);

namespace Stackra\Theme\Database\Seeders;

use Stackra\ServiceProvider\Attributes\AsSeeder;
use Stackra\Theme\Contracts\Data\ThemePresetInterface;
use Stackra\Theme\Enums\ThemePresetSlug;
use Stackra\Theme\Models\ThemePreset;
use Illuminate\Database\Seeder;

/**
 * Seeds the platform-shipped `theme_presets` rows — one row per
 * non-{@see ThemePresetSlug::Custom} case.
 *
 * Priority 23 places the seeder in the platform tier (see
 * `.kiro/steering/discovery.md`). Runs in every environment — the
 * platform preset catalogue is required for a functioning tenant
 * experience.
 *
 * Idempotent: the seeder uses `updateOrCreate` keyed by
 * `(tenant_id = NULL, slug)`. Re-running after a token payload
 * change refreshes the row without disturbing tenant customs.
 *
 * @category Theme
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 23, environments: [])]
final class ThemePresetSeeder extends Seeder
{
    /**
     * Run the seeder.
     */
    public function run(): void
    {
        ThemePreset::allowSystemMutation(function (): void {
            foreach (ThemePresetSlug::cases() as $case) {
                if (! $case->isSystem()) {
                    continue;
                }

                ThemePreset::query()->updateOrCreate(
                    [
                        ThemePresetInterface::ATTR_TENANT_ID => null,
                        ThemePresetInterface::ATTR_SLUG      => $case->value,
                    ],
                    [
                        ThemePresetInterface::ATTR_NAME        => $case->displayName(),
                        ThemePresetInterface::ATTR_DESCRIPTION => $case->description(),
                        ThemePresetInterface::ATTR_MODE        => $case->mode(),
                        ThemePresetInterface::ATTR_CATEGORY    => 'platform',
                        ThemePresetInterface::ATTR_TOKENS      => $this->tokensFor($case),
                        ThemePresetInterface::ATTR_IS_ACTIVE   => true,
                        ThemePresetInterface::ATTR_IS_SYSTEM   => true,
                    ],
                );
            }
        });
    }

    /**
     * Return the design-token payload for a system preset.
     *
     * Placeholder maps — the shipping token vocabulary is authored by
     * design and lands as a separate JSON manifest. This seeder keeps
     * the rows populated with a valid structural shape so downstream
     * consumers (CssRenderer, ContrastAuditor) can read them without
     * NPE.
     *
     * @return array<string, mixed>
     */
    private function tokensFor(ThemePresetSlug $case): array
    {
        return match ($case) {
            ThemePresetSlug::LightDefault, ThemePresetSlug::BrandForwardBlue, ThemePresetSlug::BrandForwardGreen => [
                'color' => [
                    'background' => ['default' => '#ffffff'],
                    'foreground' => ['default' => '#0f172a'],
                ],
            ],
            ThemePresetSlug::DarkDefault => [
                'color' => [
                    'background' => ['default' => '#0f172a'],
                    'foreground' => ['default' => '#f8fafc'],
                ],
            ],
            ThemePresetSlug::HighContrastLight => [
                'color' => [
                    'background' => ['default' => '#ffffff'],
                    'foreground' => ['default' => '#000000'],
                ],
                'accessibility' => ['wcag_target' => 'AAA'],
            ],
            ThemePresetSlug::HighContrastDark => [
                'color' => [
                    'background' => ['default' => '#000000'],
                    'foreground' => ['default' => '#ffffff'],
                ],
                'accessibility' => ['wcag_target' => 'AAA'],
            ],
            ThemePresetSlug::Custom => [],
        };
    }
}

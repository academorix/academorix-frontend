<?php

declare(strict_types=1);

namespace Academorix\Branding\Database\Factories;

use Academorix\Branding\Contracts\Data\BrandingInterface;
use Academorix\Branding\Enums\BrandingTheme;
use Academorix\Branding\Models\Branding;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Branding}.
 *
 * @extends Factory<Branding>
 *
 * @category Branding
 *
 * @since    0.1.0
 */
final class BrandingFactory extends Factory
{
    /**
     * @var class-string<Branding>
     */
    protected $model = Branding::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            BrandingInterface::ATTR_ID               => 'brd_' . Str::ulid()->toBase32(),
            BrandingInterface::ATTR_TENANT_ID        => 'ten_' . Str::ulid()->toBase32(),
            BrandingInterface::ATTR_NAME             => 'Default',
            BrandingInterface::ATTR_IS_DEFAULT       => true,
            BrandingInterface::ATTR_THEME            => BrandingTheme::Auto->value,
            BrandingInterface::ATTR_PRIMARY_COLOR    => '#4F46E5',
            BrandingInterface::ATTR_SECONDARY_COLOR  => '#0EA5E9',
            BrandingInterface::ATTR_ACCENT_COLOR     => '#F59E0B',
            BrandingInterface::ATTR_BACKGROUND_COLOR => '#FFFFFF',
            BrandingInterface::ATTR_SURFACE_COLOR    => '#F9FAFB',
            BrandingInterface::ATTR_TEXT_COLOR       => '#111827',
            BrandingInterface::ATTR_FONT_STACK       => 'Inter, system-ui, sans-serif',
            BrandingInterface::ATTR_TRANSLATIONS     => ['en' => ['name' => 'Default']],
        ];
    }

    public function darkMode(): static
    {
        return $this->state(fn (): array => [
            BrandingInterface::ATTR_NAME             => 'Dark Mode',
            BrandingInterface::ATTR_IS_DEFAULT       => false,
            BrandingInterface::ATTR_THEME            => BrandingTheme::Dark->value,
            BrandingInterface::ATTR_BACKGROUND_COLOR => '#0F172A',
            BrandingInterface::ATTR_SURFACE_COLOR    => '#1E293B',
            BrandingInterface::ATTR_TEXT_COLOR       => '#F8FAFC',
        ]);
    }
}

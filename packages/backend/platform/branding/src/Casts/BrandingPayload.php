<?php

declare(strict_types=1);

namespace Academorix\Branding\Casts;

/**
 * Read-model snapshot of a Branding row, denormalised into
 * `tenants.branding` by TenantObserver.
 *
 * ## Shape
 *
 * ```php
 * [
 *   'theme'            => 'auto',
 *   'logo_url'         => 'https://cdn.example.com/logo.svg',
 *   'logo_dark_url'    => null,
 *   'favicon_url'      => '...',
 *   'primary_color'    => '#4F46E5',
 *   'secondary_color'  => '#0EA5E9',
 *   'accent_color'     => '#F59E0B',
 *   'background_color' => '#FFFFFF',
 *   'surface_color'    => '#F9FAFB',
 *   'text_color'       => '#111827',
 *   'font_stack'       => 'Inter, system-ui, sans-serif',
 *   'custom_font_url'  => null,
 *   'css_variables'    => ['--radius-md' => '8px'],
 * ]
 * ```
 *
 * Immutable — mutations go through the Branding aggregate.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
final readonly class BrandingPayload
{
    /**
     * @param  array<string, string>|null  $cssVariables  Free-form
     *   `{name: value}` map applied at `:root`. Names are `--` prefixed.
     */
    public function __construct(
        public string $theme = 'auto',
        public ?string $logoUrl = null,
        public ?string $logoDarkUrl = null,
        public ?string $faviconUrl = null,
        public ?string $primaryColor = null,
        public ?string $secondaryColor = null,
        public ?string $accentColor = null,
        public ?string $backgroundColor = null,
        public ?string $surfaceColor = null,
        public ?string $textColor = null,
        public ?string $fontStack = null,
        public ?string $customFontUrl = null,
        public ?array $cssVariables = null,
    ) {
    }

    /**
     * Serialise for the `tenants.branding` JSONB column.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'theme'            => $this->theme,
            'logo_url'         => $this->logoUrl,
            'logo_dark_url'    => $this->logoDarkUrl,
            'favicon_url'      => $this->faviconUrl,
            'primary_color'    => $this->primaryColor,
            'secondary_color'  => $this->secondaryColor,
            'accent_color'     => $this->accentColor,
            'background_color' => $this->backgroundColor,
            'surface_color'    => $this->surfaceColor,
            'text_color'       => $this->textColor,
            'font_stack'       => $this->fontStack,
            'custom_font_url'  => $this->customFontUrl,
            'css_variables'    => $this->cssVariables,
        ];
    }
}

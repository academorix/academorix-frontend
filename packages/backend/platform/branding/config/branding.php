<?php

/**
 * @file modules/platform/branding/config/branding.php
 *
 * @description
 * Runtime knobs for the `stackra/branding` module.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | The Eloquent repository ships `#[Cacheable(ttl: 3600)]`. Override
    | via env when a shorter TTL is needed (typically during migration
    | rollouts).
    */
    'cache' => [
        'ttl' => env('BRANDING_CACHE_TTL', 3600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Default palette
    |--------------------------------------------------------------------------
    |
    | Platform-level defaults used when a tenant has not overridden a
    | given field. Consumed by the FE shell as its "before branding"
    | render layer.
    */
    'defaults' => [
        'theme'            => 'auto',
        'primary_color'    => '#4F46E5',
        'secondary_color'  => '#0EA5E9',
        'accent_color'     => '#F59E0B',
        'background_color' => '#FFFFFF',
        'surface_color'    => '#F9FAFB',
        'text_color'       => '#111827',
        'font_stack'       => 'Inter, system-ui, sans-serif',
    ],

    /*
    |--------------------------------------------------------------------------
    | OG image renderer
    |--------------------------------------------------------------------------
    |
    | The default renderer (`NullOgImageRenderer`) returns `null`.
    | Bind a real renderer via `#[Bind(OgImageRendererInterface::class)]`
    | on the concrete class + configure it here.
    */
    'og_image' => [
        'enabled' => env('BRANDING_OG_IMAGE_ENABLED', false),
        'width'   => env('BRANDING_OG_IMAGE_WIDTH', 1200),
        'height'  => env('BRANDING_OG_IMAGE_HEIGHT', 630),
    ],
];

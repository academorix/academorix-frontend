<?php

declare(strict_types=1);

namespace Stackra\Settings\Attributes;

use Attribute;

/**
 * Marker attribute for a visual group section within a settings
 * class.
 *
 * Place on a property of a `#[AsSetting]`-decorated class to
 * define a section. Other `#[SettingField]` attributes on the
 * same class reference this section via their `group` argument to
 * be rendered under the shared heading.
 *
 * Repeatable — a single property may belong to multiple visual
 * groups (rare but valid; the admin UI picks one at render time).
 *
 * ## Usage
 *
 * ```php
 * #[SettingGroup(label: 'Brand Colors', description: 'Primary palette.', icon: 'palette', sortOrder: 1)]
 * #[SettingField(controlType: 'color', label: 'Accent', group: 'Brand Colors')]
 * public string $accent = 'oklch(0.6204 0.195 253.83)';
 * ```
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE)]
final readonly class SettingGroup
{
    /**
     * @param  string  $label  Display label AND reference key. Non-empty; fields opt in via their `group` argument matching this exact string.
     * @param  string  $description  Description rendered under the heading.
     * @param  string  $icon  Semantic icon name (`palette`, `type`, ...).
     * @param  int  $sortOrder  Sort order relative to sibling groups in the same settings class.
     */
    public function __construct(
        public string $label,
        public string $description = '',
        public string $icon = '',
        public int $sortOrder = 0,
    ) {}
}

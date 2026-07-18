<?php

declare(strict_types=1);

namespace Academorix\Settings\Attributes;

use Attribute;

/**
 * Declares a visual section inside an `#[AsSetting]` class.
 *
 * Property-level, repeatable. Fields on the same class attach to a
 * section by matching their `#[SettingField(group: '<label>')]`
 * argument against a section's `label`. Sections are ordered by
 * `sortOrder` ascending; unsectioned fields render in an implicit
 * "General" section.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_PROPERTY | Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class SettingGroup
{
    /**
     * @param  string  $label        Display label AND reference key.
     * @param  string  $description  Free-form section description.
     * @param  string  $icon         Semantic icon name (heroicons).
     * @param  int     $sortOrder    Ascending sort — sections + fields share the same axis.
     */
    public function __construct(
        public string $label,
        public string $description = '',
        public string $icon = '',
        public int $sortOrder = 0,
    ) {
    }
}

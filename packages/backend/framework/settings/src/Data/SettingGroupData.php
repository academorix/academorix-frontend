<?php

declare(strict_types=1);

namespace Stackra\Settings\Data;

/**
 * DTO for a visual group section within a settings class.
 *
 * Built by the settings bootstrapper from `#[SettingGroup]`
 * attributes. The admin UI uses `label` as the section heading
 * AND the reference key that fields opt into via their own
 * `group` argument.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final readonly class SettingGroupData
{
    /**
     * @param  string  $label  Display label + reference key.
     * @param  string  $description  Description rendered under the heading.
     * @param  string  $icon  Semantic icon name.
     * @param  int  $sortOrder  Sort order relative to sibling groups.
     */
    public function __construct(
        public string $label,
        public string $description = '',
        public string $icon = '',
        public int $sortOrder = 0,
    ) {}

    /**
     * Wire shape for the schema endpoint.
     *
     * @return array{label: string, description: string, icon: string, sortOrder: int}
     */
    public function toArray(): array
    {
        return [
            'label' => $this->label,
            'description' => $this->description,
            'icon' => $this->icon,
            'sortOrder' => $this->sortOrder,
        ];
    }
}

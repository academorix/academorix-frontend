<?php

declare(strict_types=1);

namespace Academorix\Settings\Data;

/**
 * Full DTO for one `#[AsSetting]`-decorated group.
 *
 * Captures the group-level metadata from `#[AsSetting]`, the
 * Spatie Settings class FQCN, the resolved field metadata array,
 * and the resolved visual-group metadata array. Stored in the
 * {@see \Academorix\Settings\Registry\SettingsRegistry} at boot.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final readonly class SettingDefinitionData
{
    /**
     * @param  string  $group  Unique group key.
     * @param  string  $label  Admin-facing label.
     * @param  string  $description  Longer description.
     * @param  string  $icon  Semantic icon name.
     * @param  string  $permission  Read permission gate.
     * @param  string  $scope  Hierarchy scope: `system` / `tenant` / `user`.
     * @param  bool  $public  Whether the GET endpoint is publicly accessible.
     * @param  int  $sortOrder  Admin listing sort order.
     * @param  class-string  $className  Spatie Settings class FQCN.
     * @param  array<int, SettingFieldData>  $fields  Resolved fields.
     * @param  array<int, SettingGroupData>  $groups  Resolved visual sections.
     */
    public function __construct(
        public string $group,
        public string $label,
        public string $description,
        public string $icon,
        public string $permission,
        public string $scope,
        public bool $public,
        public int $sortOrder,
        public string $className,
        public array $fields = [],
        public array $groups = [],
    ) {}

    /**
     * Wire shape for the schema endpoint.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'group' => $this->group,
            'label' => $this->label,
            'description' => $this->description,
            'icon' => $this->icon,
            'permission' => $this->permission,
            'scope' => $this->scope,
            'public' => $this->public,
            'sortOrder' => $this->sortOrder,
            'className' => $this->className,
            'fields' => array_map(
                static fn (SettingFieldData $field): array => $field->toArray(),
                $this->fields,
            ),
            'groups' => array_map(
                static fn (SettingGroupData $group): array => $group->toArray(),
                $this->groups,
            ),
        ];
    }
}

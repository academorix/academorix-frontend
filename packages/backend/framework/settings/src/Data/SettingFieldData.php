<?php

declare(strict_types=1);

namespace Stackra\Settings\Data;

/**
 * DTO for a single setting field's metadata.
 *
 * Built by the settings bootstrapper from `#[SettingField]`
 * attributes on each `#[AsSetting]` class. Stored in the registry
 * and rendered on the schema endpoint.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final readonly class SettingFieldData
{
    /**
     * @param  string  $key  Property name — the field identifier on the wire.
     * @param  string  $controlType  UI control type as a semantic string.
     * @param  string  $label  Admin-facing label.
     * @param  string  $placeholder  Placeholder text.
     * @param  array<int, string>  $validation  Laravel validation rules the service applies before writing.
     * @param  mixed  $defaultValue  Default when no stored value exists.
     * @param  int  $sortOrder  Sort order within the group.
     * @param  string|null  $group  Reference to a `#[SettingGroup]` label.
     * @param  array<string, string>  $options  Resolved `value => label` map for select / multiselect.
     * @param  bool  $sensitive  Whether the field is masked in read responses.
     * @param  string  $helpText  Optional guidance rendered below the field.
     * @param  float|null  $min  Minimum for number / slider.
     * @param  float|null  $max  Maximum for number / slider.
     * @param  float|null  $step  Step increment for number / slider.
     */
    public function __construct(
        public string $key,
        public string $controlType = 'text',
        public string $label = '',
        public string $placeholder = '',
        public array $validation = [],
        public mixed $defaultValue = null,
        public int $sortOrder = 0,
        public ?string $group = null,
        public array $options = [],
        public bool $sensitive = false,
        public string $helpText = '',
        public ?float $min = null,
        public ?float $max = null,
        public ?float $step = null,
    ) {}

    /**
     * Wire shape for the schema endpoint.
     *
     * Omits keys with default values (empty options, unset min /
     * max / step) so the payload stays lean.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'key' => $this->key,
            'controlType' => $this->controlType,
            'label' => $this->label,
            'placeholder' => $this->placeholder,
            'validation' => $this->validation,
            'defaultValue' => $this->defaultValue,
            'sortOrder' => $this->sortOrder,
            'group' => $this->group,
            'sensitive' => $this->sensitive,
            'helpText' => $this->helpText,
        ];

        if ($this->options !== []) {
            $data['options'] = $this->options;
        }

        if ($this->min !== null) {
            $data['min'] = $this->min;
        }

        if ($this->max !== null) {
            $data['max'] = $this->max;
        }

        if ($this->step !== null) {
            $data['step'] = $this->step;
        }

        return $data;
    }
}

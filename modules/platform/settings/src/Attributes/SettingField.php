<?php

declare(strict_types=1);

namespace Academorix\Settings\Attributes;

use Attribute;

/**
 * Declares a single settings field.
 *
 * Property-level, non-repeatable. Combined with `#[AsSetting]` on the
 * containing class this drives:
 *  1. The SDUI settings form renderer.
 *  2. Server-side validation of incoming PUT bodies.
 *  3. Default-value seeding at system scope during discovery.
 *
 * The `key` argument is used verbatim as the field slug — combined
 * with the group + `scope_kind` + `scope_id` it forms the SettingValue
 * lookup key. Sensitive fields are masked on read unless the caller
 * carries `settings.view-sensitive` on their guard.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
final readonly class SettingField
{
    /**
     * @param  string                    $key         Stable field slug.
     * @param  string                    $type        {@see \Academorix\Settings\Enums\SettingType} backing value.
     * @param  string                    $label       Display label. Empty falls back to Title-cased `$key`.
     * @param  mixed                     $default     Default value when no override exists.
     * @param  array<int, string>        $rules       Laravel validation rules.
     * @param  bool                      $sensitive   Masks the value on read + logs `?reveal=true`.
     * @param  int                       $sortOrder   Ascending sort within the section.
     * @param  string|null               $section     Section label (references a `#[SettingGroup]`).
     * @param  string|null               $description Free-form field description.
     * @param  string|null               $placeholder Placeholder text for the input control.
     * @param  string|null               $helpText    Free-form help copy.
     * @param  array<mixed>|string|null  $options     Enum FQCN / assoc value=>label / flat list.
     * @param  float|null                $min         Min value (numeric fields).
     * @param  float|null                $max         Max value (numeric fields).
     * @param  float|null                $step        Step size (numeric fields).
     */
    public function __construct(
        public string $key,
        public string $type = 'string',
        public string $label = '',
        public mixed $default = null,
        public array $rules = [],
        public bool $sensitive = false,
        public int $sortOrder = 0,
        public ?string $section = null,
        public ?string $description = null,
        public ?string $placeholder = null,
        public ?string $helpText = null,
        public array|string|null $options = null,
        public ?float $min = null,
        public ?float $max = null,
        public ?float $step = null,
    ) {
    }
}

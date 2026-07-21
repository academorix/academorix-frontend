<?php

declare(strict_types=1);

namespace Stackra\Settings\Attributes;

use Stackra\Settings\Enums\ControlType;
use Attribute;

/**
 * Marker attribute for a single field on a settings class.
 *
 * Place on a public property of a class carrying `#[AsSetting]` to
 * declare its control type, validation rules, and display
 * metadata. The `#[SettingGroup]` attribute organises fields into
 * visual sections; that shape is orthogonal to this one.
 *
 * ## Usage
 *
 * ```php
 * #[SettingField(
 *     controlType: ControlType::Select,
 *     label: 'Mail Driver',
 *     options: MailDriver::class,
 *     validation: ['nullable', 'string'],
 *     helpText: 'Choose the email transport driver.',
 * )]
 * public string $driver = 'smtp';
 * ```
 *
 * The `defaultValue` argument is only used when the default cannot
 * live as a property default (closures, callables, computed
 * shapes). Every other case reads the property default directly
 * per `.kiro/steering/settings.md` §2.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
final readonly class SettingField
{
    /**
     * @param  ControlType|string  $controlType  UI control type — a {@see ControlType} case or the enum's backing string.
     * @param  string  $label  Display label. Empty falls back to the property name (snake_case → Title Case).
     * @param  string  $placeholder  Placeholder text for text inputs.
     * @param  array<int, string>  $validation  Laravel validation rules applied by the service before writing.
     * @param  mixed  $defaultValue  Escape-hatch default; usually leave `null` and rely on the property default.
     * @param  int  $sortOrder  Sort order within the group; lower first.
     * @param  string|null  $group  Reference to a `#[SettingGroup]` label — attaches the field to that visual section.
     * @param  string|array<string, string>|array<int, string>|null  $options  Enum FQCN, associative `value => label` array, or flat array. Applies to select / multiselect fields.
     * @param  bool  $sensitive  Passwords, tokens, API keys. Masked in read responses.
     * @param  string  $helpText  Optional guidance rendered below the field.
     * @param  float|null  $min  Minimum for numeric / slider fields.
     * @param  float|null  $max  Maximum for numeric / slider fields.
     * @param  float|null  $step  Step increment for numeric / slider fields.
     */
    public function __construct(
        public ControlType|string $controlType = ControlType::Text,
        public string $label = '',
        public string $placeholder = '',
        public array $validation = [],
        public mixed $defaultValue = null,
        public int $sortOrder = 0,
        public ?string $group = null,
        public string|array|null $options = null,
        public bool $sensitive = false,
        public string $helpText = '',
        public ?float $min = null,
        public ?float $max = null,
        public ?float $step = null,
    ) {}

    /**
     * Return the control type as its wire string, normalising both
     * enum + string inputs.
     */
    public function controlTypeValue(): string
    {
        return $this->controlType instanceof ControlType
            ? $this->controlType->value
            : $this->controlType;
    }

    /**
     * Resolve the `options` argument to an associative
     * `value => label` array.
     *
     * Handles three shapes:
     *
     *   1. Backed-enum FQCN — extracts cases as
     *      `case->value => case->name`.
     *   2. Associative array — returned as-is.
     *   3. Flat list — maps each entry to itself.
     *
     * @return array<string, string>
     */
    public function resolveOptions(): array
    {
        if ($this->options === null) {
            return [];
        }

        if (is_string($this->options) && enum_exists($this->options)) {
            $resolved = [];

            /** @var array<int, \BackedEnum> $cases */
            $cases = $this->options::cases();

            foreach ($cases as $case) {
                $resolved[(string) $case->value] = $case->name;
            }

            return $resolved;
        }

        if (is_array($this->options)) {
            if (array_is_list($this->options)) {
                return array_combine($this->options, $this->options);
            }

            /** @var array<string, string> $options */
            $options = $this->options;

            return $options;
        }

        return [];
    }
}

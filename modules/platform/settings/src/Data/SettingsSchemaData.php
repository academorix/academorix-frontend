<?php

declare(strict_types=1);

namespace Academorix\Settings\Data;

use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Enums\SettingType;
use Academorix\Settings\Models\SettingsSchema;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SettingsSchema}.
 *
 * NEVER surfaces the `default_value` of a `sensitive: true` schema —
 * the default is scrubbed to `null` on the way out so the admin UI
 * doesn't accidentally render production API keys as placeholder text.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SettingsSchemaData extends Data
{
    /**
     * @param  string                    $id            `sss_<ulid>`.
     * @param  string                    $groupId       Owning group ULID.
     * @param  string                    $key           Field slug.
     * @param  string                    $label         Display label.
     * @param  SettingType               $type          Storage type.
     * @param  mixed                     $defaultValue  Default value (nulled when sensitive).
     * @param  array<int, string>        $rules         Laravel validation rules.
     * @param  bool                      $sensitive     Sensitive-flag mirror.
     * @param  bool                      $isSystem      System-owned rows are locked.
     * @param  int                       $sortOrder     Sort within the group.
     * @param  string|null               $description   Free-form description.
     */
    public function __construct(
        public string $id,
        public string $groupId,
        public string $key,
        public string $label,
        public SettingType $type,
        public mixed $defaultValue,
        public array $rules,
        public bool $sensitive,
        public bool $isSystem,
        public int $sortOrder,
        public ?string $description = null,
    ) {
    }

    /**
     * Build from a model. Redacts the default when the schema flags
     * `sensitive: true`.
     */
    public static function fromModel(SettingsSchema $schema): self
    {
        $sensitive = (bool) $schema->{SettingsSchemaInterface::ATTR_SENSITIVE};

        $default = $schema->{SettingsSchemaInterface::ATTR_DEFAULT_VALUE};
        if ($sensitive) {
            $default = null;
        }

        $typeValue = $schema->{SettingsSchemaInterface::ATTR_TYPE};
        $type      = $typeValue instanceof SettingType
            ? $typeValue
            : (SettingType::tryFrom((string) $typeValue) ?? SettingType::String);

        /** @var array<int, string> $rules */
        $rules = (array) ($schema->{SettingsSchemaInterface::ATTR_RULES} ?? []);

        return new self(
            id: (string) $schema->getKey(),
            groupId: (string) $schema->{SettingsSchemaInterface::ATTR_GROUP_ID},
            key: (string) $schema->{SettingsSchemaInterface::ATTR_KEY},
            label: (string) $schema->{SettingsSchemaInterface::ATTR_LABEL},
            type: $type,
            defaultValue: $default,
            rules: $rules,
            sensitive: $sensitive,
            isSystem: (bool) $schema->{SettingsSchemaInterface::ATTR_IS_SYSTEM},
            sortOrder: (int) $schema->{SettingsSchemaInterface::ATTR_SORT_ORDER},
            description: $schema->{SettingsSchemaInterface::ATTR_DESCRIPTION},
        );
    }
}

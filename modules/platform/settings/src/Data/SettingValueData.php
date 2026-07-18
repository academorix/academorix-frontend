<?php

declare(strict_types=1);

namespace Academorix\Settings\Data;

use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Contracts\Data\SettingValueInterface;
use Academorix\Settings\Enums\SettingScopeKind;
use Academorix\Settings\Models\SettingValue;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SettingValue}.
 *
 * Redacts the value when the corresponding schema flags
 * `sensitive: true` — the caller must carry `settings.view-sensitive`
 * to see the raw payload (unmasking is handled by a separate action).
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SettingValueData extends Data
{
    /**
     * @param  string                    $id         `stv_<ulid>`.
     * @param  string                    $schemaId   Owning schema ULID.
     * @param  SettingScopeKind          $scopeKind  Cascade layer.
     * @param  mixed                     $value      Resolved value (redacted when sensitive).
     * @param  bool                      $redacted   Whether the value has been masked.
     * @param  \DateTimeInterface        $createdAt  Row creation.
     * @param  \DateTimeInterface        $updatedAt  Last mutation.
     * @param  string|null               $scopeId    Concrete owner id — NULL for system.
     * @param  string|null               $tenantId   Cascaded tenant id (nullable).
     */
    public function __construct(
        public string $id,
        public string $schemaId,
        public SettingScopeKind $scopeKind,
        public mixed $value,
        public bool $redacted,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $scopeId = null,
        public ?string $tenantId = null,
    ) {
    }

    /**
     * Build from a model, redacting when sensitive.
     */
    public static function fromModel(SettingValue $row): self
    {
        $schema      = $row->schema;
        $isSensitive = $schema !== null
            && (bool) $schema->{SettingsSchemaInterface::ATTR_SENSITIVE};

        $value = $row->{SettingValueInterface::ATTR_VALUE};
        if ($isSensitive) {
            $value = null;
        }

        $scopeKind = $row->{SettingValueInterface::ATTR_SCOPE_KIND};
        if (! $scopeKind instanceof SettingScopeKind) {
            $scopeKind = SettingScopeKind::tryFrom((string) $scopeKind) ?? SettingScopeKind::System;
        }

        return new self(
            id: (string) $row->getKey(),
            schemaId: (string) $row->{SettingValueInterface::ATTR_SCHEMA_ID},
            scopeKind: $scopeKind,
            value: $value,
            redacted: $isSensitive,
            createdAt: $row->{SettingValueInterface::ATTR_CREATED_AT},
            updatedAt: $row->{SettingValueInterface::ATTR_UPDATED_AT},
            scopeId: $row->{SettingValueInterface::ATTR_SCOPE_ID},
            tenantId: $row->{SettingValueInterface::ATTR_TENANT_ID},
        );
    }
}

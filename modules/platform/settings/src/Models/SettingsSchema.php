<?php

declare(strict_types=1);

namespace Academorix\Settings\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Database\Concerns\HasSystemFlag;
use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Database\Factories\SettingsSchemaFactory;
use Academorix\Settings\Enums\SettingType;
use Academorix\Settings\Policies\SettingsPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see SettingsSchemaInterface}.
 *
 * One row per registered `#[SettingField]`. `default_value` + `rules`
 * ship as JSON — the resolver falls back to `default_value` when no
 * override row exists, and the writer runs the rules against every
 * PUT before persisting.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Table(
    name: SettingsSchemaInterface::TABLE,
    key: SettingsSchemaInterface::PRIMARY_KEY,
    keyType: SettingsSchemaInterface::KEY_TYPE,
)]
#[Fillable([
    SettingsSchemaInterface::ATTR_GROUP_ID,
    SettingsSchemaInterface::ATTR_KEY,
    SettingsSchemaInterface::ATTR_LABEL,
    SettingsSchemaInterface::ATTR_DESCRIPTION,
    SettingsSchemaInterface::ATTR_TYPE,
    SettingsSchemaInterface::ATTR_DEFAULT_VALUE,
    SettingsSchemaInterface::ATTR_RULES,
    SettingsSchemaInterface::ATTR_SENSITIVE,
    SettingsSchemaInterface::ATTR_IS_SYSTEM,
    SettingsSchemaInterface::ATTR_SORT_ORDER,
    SettingsSchemaInterface::ATTR_METADATA,
])]
#[UseFactory(SettingsSchemaFactory::class)]
#[UsePolicy(SettingsPolicy::class)]
#[WithoutIncrementing]
final class SettingsSchema extends Model implements AuditableContract, SettingsSchemaInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasSystemFlag;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enum + JSON + boolean coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SettingsSchemaInterface::ATTR_TYPE          => SettingType::class,
        SettingsSchemaInterface::ATTR_DEFAULT_VALUE => 'array',
        SettingsSchemaInterface::ATTR_RULES         => 'array',
        SettingsSchemaInterface::ATTR_SENSITIVE     => 'boolean',
        SettingsSchemaInterface::ATTR_IS_SYSTEM     => 'boolean',
        SettingsSchemaInterface::ATTR_SORT_ORDER    => 'integer',
        SettingsSchemaInterface::ATTR_METADATA      => 'array',
    ];

    /**
     * The owning group.
     *
     * @return BelongsTo<SettingsGroup, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(
            SettingsGroup::class,
            SettingsSchemaInterface::ATTR_GROUP_ID,
        );
    }

    /**
     * Persisted values (one row per scope) for this schema.
     *
     * @return HasMany<SettingValue, $this>
     */
    public function values(): HasMany
    {
        return $this->hasMany(
            SettingValue::class,
            \Academorix\Settings\Contracts\Data\SettingValueInterface::ATTR_SCHEMA_ID,
        );
    }
}

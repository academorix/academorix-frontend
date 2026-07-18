<?php

declare(strict_types=1);

namespace Academorix\Settings\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Database\Concerns\HasSystemFlag;
use Academorix\Settings\Contracts\Data\SettingsGroupInterface;
use Academorix\Settings\Database\Factories\SettingsGroupFactory;
use Academorix\Settings\Policies\SettingsPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see SettingsGroupInterface}.
 *
 * A settings group bundles related fields into one admin UI page.
 * System groups (`is_system = true`) are populated by the boot-time
 * discovery pass and are immutable via HTTP — mutations refused by
 * {@see SettingsPolicy}.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Table(
    name: SettingsGroupInterface::TABLE,
    key: SettingsGroupInterface::PRIMARY_KEY,
    keyType: SettingsGroupInterface::KEY_TYPE,
)]
#[Fillable([
    SettingsGroupInterface::ATTR_KEY,
    SettingsGroupInterface::ATTR_NAME,
    SettingsGroupInterface::ATTR_DESCRIPTION,
    SettingsGroupInterface::ATTR_ICON,
    SettingsGroupInterface::ATTR_SORT_ORDER,
    SettingsGroupInterface::ATTR_IS_SYSTEM,
    SettingsGroupInterface::ATTR_METADATA,
])]
#[UseFactory(SettingsGroupFactory::class)]
#[UsePolicy(SettingsPolicy::class)]
#[WithoutIncrementing]
final class SettingsGroup extends Model implements AuditableContract, SettingsGroupInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasSystemFlag;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — JSON + boolean coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SettingsGroupInterface::ATTR_IS_SYSTEM  => 'boolean',
        SettingsGroupInterface::ATTR_SORT_ORDER => 'integer',
        SettingsGroupInterface::ATTR_METADATA   => 'array',
    ];

    /**
     * Schemas that belong to this group.
     *
     * @return HasMany<SettingsSchema, $this>
     */
    public function schemas(): HasMany
    {
        return $this->hasMany(
            SettingsSchema::class,
            \Academorix\Settings\Contracts\Data\SettingsSchemaInterface::ATTR_GROUP_ID,
        );
    }
}

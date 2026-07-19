<?php

declare(strict_types=1);

namespace Academorix\Settings\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Settings\Contracts\Data\SettingValueInterface;
use Academorix\Settings\Database\Factories\SettingValueFactory;
use Academorix\Settings\Enums\SettingScopeKind;
use Academorix\Settings\Policies\SettingsPolicy;
use Academorix\Tenancy\Concerns\BelongsToTenantOptional;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see SettingValueInterface}.
 *
 * The concrete value that populates the resolver's cascade. One row
 * per `(scope_kind, scope_id, schema_id)` tuple. System-scope rows
 * carry `scope_id = NULL` (platform defaults). No soft deletes —
 * values are always current-state; clearing an override is a hard
 * delete so the resolver falls through to the next scope.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Table(
    name: SettingValueInterface::TABLE,
    key: SettingValueInterface::PRIMARY_KEY,
    keyType: SettingValueInterface::KEY_TYPE,
)]
#[Fillable([
    SettingValueInterface::ATTR_SCHEMA_ID,
    SettingValueInterface::ATTR_SCOPE_KIND,
    SettingValueInterface::ATTR_SCOPE_ID,
    SettingValueInterface::ATTR_TENANT_ID,
    SettingValueInterface::ATTR_VALUE,
    SettingValueInterface::ATTR_METADATA,
])]
#[UseFactory(SettingValueFactory::class)]
#[UsePolicy(SettingsPolicy::class)]
#[WithoutIncrementing]
final class SettingValue extends Model implements AuditableContract, SettingValueInterface
{
    use Auditable;
    use BelongsToTenantOptional;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — enum + JSON coercion on hydrate. The `value` column
     * is a plain JSON cast here; the sensitive-encryption layer is
     * applied by {@see \Academorix\Settings\Casts\EncryptedSensitiveSettingCast}
     * when the owning schema flags `sensitive: true`.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SettingValueInterface::ATTR_SCOPE_KIND => SettingScopeKind::class,
        SettingValueInterface::ATTR_VALUE      => 'array',
        SettingValueInterface::ATTR_METADATA   => 'array',
    ];

    /**
     * The owning schema.
     *
     * @return BelongsTo<SettingsSchema, $this>
     */
    public function schema(): BelongsTo
    {
        return $this->belongsTo(
            SettingsSchema::class,
            SettingValueInterface::ATTR_SCHEMA_ID,
        );
    }
}

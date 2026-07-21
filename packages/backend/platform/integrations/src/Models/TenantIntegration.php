<?php

declare(strict_types=1);

namespace Stackra\Integrations\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Integrations\Casts\IntegrationConfig;
use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Database\Factories\TenantIntegrationFactory;
use Stackra\Integrations\Enums\IntegrationKind;
use Stackra\Integrations\Enums\IntegrationSyncStatus;
use Stackra\Integrations\Observers\TenantIntegrationObserver;
use Stackra\Integrations\Policies\TenantIntegrationPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see TenantIntegrationInterface}.
 *
 * The `config` column carries encrypted-at-rest credential material —
 * NEVER surfaces on the wire. `#[Hidden]` on `config`, `metadata`,
 * `sync_cursor`, and the userstamp columns per the blueprint's
 * `x-wire.hidden` list.
 *
 * Composes `BelongsToTenant` so every read/write auto-scopes to the
 * active tenant.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Table(
    name: TenantIntegrationInterface::TABLE,
    key: TenantIntegrationInterface::PRIMARY_KEY,
    keyType: TenantIntegrationInterface::KEY_TYPE,
)]
#[Fillable([
    TenantIntegrationInterface::ATTR_TENANT_ID,
    TenantIntegrationInterface::ATTR_KIND,
    TenantIntegrationInterface::ATTR_PROVIDER,
    TenantIntegrationInterface::ATTR_NAME,
    TenantIntegrationInterface::ATTR_CONFIG,
    TenantIntegrationInterface::ATTR_IS_ACTIVE,
    TenantIntegrationInterface::ATTR_LAST_SYNC_AT,
    TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS,
    TenantIntegrationInterface::ATTR_LAST_SYNC_ERROR,
    TenantIntegrationInterface::ATTR_NEXT_SYNC_AT,
    TenantIntegrationInterface::ATTR_SYNC_CURSOR,
    TenantIntegrationInterface::ATTR_METADATA,
])]
#[Hidden([
    TenantIntegrationInterface::ATTR_CONFIG,
    TenantIntegrationInterface::ATTR_METADATA,
    TenantIntegrationInterface::ATTR_SYNC_CURSOR,
    TenantIntegrationInterface::ATTR_CREATED_BY,
    TenantIntegrationInterface::ATTR_UPDATED_BY,
    TenantIntegrationInterface::ATTR_DELETED_BY,
])]
#[UseFactory(TenantIntegrationFactory::class)]
#[UsePolicy(TenantIntegrationPolicy::class)]
#[ObservedBy([TenantIntegrationObserver::class])]
#[WithoutIncrementing]
final class TenantIntegration extends Model implements AuditableContract, TenantIntegrationInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + JSON + boolean + datetime coercion on
     * hydrate. `config` routes through the encrypted-at-rest cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        TenantIntegrationInterface::ATTR_KIND             => IntegrationKind::class,
        TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS => IntegrationSyncStatus::class,
        TenantIntegrationInterface::ATTR_CONFIG           => IntegrationConfig::class,
        TenantIntegrationInterface::ATTR_IS_ACTIVE        => 'boolean',
        TenantIntegrationInterface::ATTR_LAST_SYNC_AT     => 'datetime',
        TenantIntegrationInterface::ATTR_NEXT_SYNC_AT     => 'datetime',
        TenantIntegrationInterface::ATTR_METADATA         => 'array',
    ];

    /**
     * Whether this integration is currently active.
     */
    public function isActive(): bool
    {
        return (bool) $this->{TenantIntegrationInterface::ATTR_IS_ACTIVE};
    }
}

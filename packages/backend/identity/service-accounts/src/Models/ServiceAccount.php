<?php

declare(strict_types=1);

namespace Stackra\ServiceAccounts\Models;

use Stackra\Foundation\Concerns\Filterable;
use Stackra\Foundation\Concerns\HasMetadata;
use Stackra\ServiceAccounts\Concerns\IsServiceAccount;
use Stackra\ServiceAccounts\Contracts\Data\ServiceAccountInterface;
use Stackra\ServiceAccounts\Database\Factories\ServiceAccountFactory;
use Stackra\ServiceAccounts\Enums\ServiceAccountStatus;
use Stackra\ServiceAccounts\Observers\ServiceAccountObserver;
use Stackra\ServiceAccounts\Policies\ServiceAccountPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Scout\Searchable;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Eloquent model for a ServiceAccount.
 *
 * Machine credential for inter-service authentication. `secret_hash`
 * is `#[Hidden]` so a stray `toArray()` / `toJson()` never leaks
 * the bcrypt hash to the wire — the observer refuses `tenant_id`
 * mutation on existing rows (blueprint invariant).
 *
 * @category ServiceAccounts
 *
 * @since    0.1.0
 */
#[Table(
    name: ServiceAccountInterface::TABLE,
    key: ServiceAccountInterface::PRIMARY_KEY,
    keyType: ServiceAccountInterface::KEY_TYPE,
)]
#[Fillable([
    ServiceAccountInterface::ATTR_APPLICATION_ID,
    ServiceAccountInterface::ATTR_TENANT_ID,
    ServiceAccountInterface::ATTR_NAME,
    ServiceAccountInterface::ATTR_DESCRIPTION,
    ServiceAccountInterface::ATTR_IS_ENABLED,
    ServiceAccountInterface::ATTR_SIGNER_KID,
    ServiceAccountInterface::ATTR_SECRET_HASH,
    ServiceAccountInterface::ATTR_SECRET_ROTATED_AT,
    ServiceAccountInterface::ATTR_EXPIRES_AT,
    ServiceAccountInterface::ATTR_LAST_USED_AT,
    ServiceAccountInterface::ATTR_LAST_USED_IP,
    ServiceAccountInterface::ATTR_STATUS,
    ServiceAccountInterface::ATTR_METADATA,
])]
#[Hidden([
    ServiceAccountInterface::ATTR_SECRET_HASH,
])]
#[UseFactory(ServiceAccountFactory::class)]
#[UsePolicy(ServiceAccountPolicy::class)]
#[ObservedBy([ServiceAccountObserver::class])]
#[WithoutIncrementing]
final class ServiceAccount extends Model implements AuditableContract, ServiceAccountInterface
{
    // `BelongsToTenant` MUST come FIRST — per `.kiro/steering/hierarchy.md`
    // §14 subsequent traits' `booted()` hooks depend on the tenant scope
    // + auto-fill wired here (Phase E6, 2026-07-21).
    use BelongsToTenant;
    use Auditable;
    use Filterable;
    use HasFactory;
    use HasMetadata;
    use HasUlids;
    use IsServiceAccount;
    use LogsActivity;
    use Notifiable;
    use Searchable;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enum, boolean, and datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        ServiceAccountInterface::ATTR_IS_ENABLED => 'boolean',
        ServiceAccountInterface::ATTR_EXPIRES_AT => 'immutable_datetime',
        ServiceAccountInterface::ATTR_SECRET_ROTATED_AT => 'immutable_datetime',
        ServiceAccountInterface::ATTR_LAST_USED_AT => 'datetime',
        ServiceAccountInterface::ATTR_STATUS => ServiceAccountStatus::class,
        ServiceAccountInterface::ATTR_METADATA => 'array',
    ];
}

<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Foundation\Concerns\HasSystemFlag;
use Stackra\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Stackra\Notifications\Mail\Database\Factories\MailSuppressionFactory;
use Stackra\Notifications\Mail\Enums\MailProvider;
use Stackra\Notifications\Mail\Enums\MailSuppressionReason;
use Stackra\Notifications\Mail\Observers\MailSuppressionObserver;
use Stackra\Notifications\Mail\Policies\MailSuppressionPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenantOptional;
use Illuminate\Database\Eloquent\Attributes\Fillable;
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
 * Eloquent model for a {@see MailSuppressionInterface}.
 *
 * Persisted block-list of email addresses that must NOT be sent to.
 * `tenant_id NULL` = platform-wide row (spam-trap, known invalid
 * addresses); `tenant_id` set = tenant-scoped row applied only to
 * that tenant's outbound mail.
 *
 * `HasSystemFlag` composes the platform-wide immutability rule:
 * `is_system=true` rows can be modified only from inside a seeder
 * (or a test) that wraps the mutation in `allowSystemMutation()`.
 * The observer + policy enforce this at the HTTP + ORM boundaries.
 *
 * `BelongsToTenantOptional` composes the tenant scope but tolerates
 * `NULL` — platform-wide rows are visible to every tenant's reads.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Table(
    name: MailSuppressionInterface::TABLE,
    key: MailSuppressionInterface::PRIMARY_KEY,
    keyType: MailSuppressionInterface::KEY_TYPE,
)]
#[Fillable([
    MailSuppressionInterface::ATTR_TENANT_ID,
    MailSuppressionInterface::ATTR_EMAIL,
    MailSuppressionInterface::ATTR_EMAIL_DOMAIN,
    MailSuppressionInterface::ATTR_REASON,
    MailSuppressionInterface::ATTR_PROVIDER,
    MailSuppressionInterface::ATTR_SOURCE_DELIVERY_ID,
    MailSuppressionInterface::ATTR_BOUNCE_REASON,
    MailSuppressionInterface::ATTR_IS_SYSTEM,
    MailSuppressionInterface::ATTR_METADATA,
    MailSuppressionInterface::ATTR_EXPIRES_AT,
])]
#[UseFactory(MailSuppressionFactory::class)]
#[UsePolicy(MailSuppressionPolicy::class)]
#[ObservedBy([MailSuppressionObserver::class])]
#[WithoutIncrementing]
final class MailSuppression extends Model implements AuditableContract, MailSuppressionInterface
{
    use Auditable;
    use BelongsToTenantOptional;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasSystemFlag;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enum + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        MailSuppressionInterface::ATTR_REASON     => MailSuppressionReason::class,
        MailSuppressionInterface::ATTR_PROVIDER   => MailProvider::class,
        MailSuppressionInterface::ATTR_IS_SYSTEM  => 'boolean',
        MailSuppressionInterface::ATTR_EXPIRES_AT => 'datetime',
    ];
}

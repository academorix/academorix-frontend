<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Stackra\Notifications\InApp\Contracts\Data\InAppMessageReadInterface;
use Stackra\Notifications\InApp\Database\Factories\InAppMessageReadFactory;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for an {@see InAppMessageReadInterface}.
 *
 * Per-user read / dismissed state for an
 * {@see InAppMessage}. One row per
 * `(in_app_message_id, addressee_id)`.
 *
 * NOT composing `SoftDeletes` — read state is immutable append-only
 * from the user's POV (a `read_at` transition never rolls back).
 * Retention is inherited from the parent message row via the
 * cascading FK.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[Table(
    name: InAppMessageReadInterface::TABLE,
    key: InAppMessageReadInterface::PRIMARY_KEY,
    keyType: InAppMessageReadInterface::KEY_TYPE,
)]
#[Fillable([
    InAppMessageReadInterface::ATTR_TENANT_ID,
    InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID,
    InAppMessageReadInterface::ATTR_ADDRESSEE_ID,
    InAppMessageReadInterface::ATTR_ADDRESSEE_TYPE,
    InAppMessageReadInterface::ATTR_READ_AT,
    InAppMessageReadInterface::ATTR_DISMISSED_AT,
    InAppMessageReadInterface::ATTR_METADATA,
])]
#[UseFactory(InAppMessageReadFactory::class)]
#[WithoutIncrementing]
final class InAppMessageRead extends Model implements AuditableContract, InAppMessageReadInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        InAppMessageReadInterface::ATTR_READ_AT      => 'datetime',
        InAppMessageReadInterface::ATTR_DISMISSED_AT => 'datetime',
    ];

    /**
     * Parent message.
     *
     * @return BelongsTo<InAppMessage, $this>
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(
            InAppMessage::class,
            InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID,
            InAppMessageInterface::ATTR_ID,
        );
    }
}

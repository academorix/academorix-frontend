<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Stackra\Notifications\InApp\Contracts\Data\InAppMessageReadInterface;
use Stackra\Notifications\InApp\Database\Factories\InAppMessageFactory;
use Stackra\Notifications\InApp\Policies\InAppMessagePolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
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
 * Eloquent model for an {@see InAppMessageInterface}.
 *
 * Denormalised inbox row for the user's bell UI — one row per
 * `(tenant, notification, addressee)`. The parent
 * {@see \Stackra\Notifications\Models\Notification} carries the
 * canonical payload; this row carries the snapshot fields the inbox
 * list renders (title, body preview, action URL, category, priority)
 * so the list page renders without a join.
 *
 * Composes `BelongsToTenant` — every read/write is scoped to the
 * active tenant automatically. Composes `SoftDeletes` — dismissal is
 * a soft-delete via the sibling `InAppMessageRead.dismissed_at`, and
 * the retention pruner does the hard-delete when the row falls out of
 * the hot window.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[Table(
    name: InAppMessageInterface::TABLE,
    key: InAppMessageInterface::PRIMARY_KEY,
    keyType: InAppMessageInterface::KEY_TYPE,
)]
#[Fillable([
    InAppMessageInterface::ATTR_TENANT_ID,
    InAppMessageInterface::ATTR_APPLICATION_ID,
    InAppMessageInterface::ATTR_NOTIFICATION_ID,
    InAppMessageInterface::ATTR_ADDRESSEE_ID,
    InAppMessageInterface::ATTR_ADDRESSEE_TYPE,
    InAppMessageInterface::ATTR_CATEGORY_SLUG,
    InAppMessageInterface::ATTR_PRIORITY,
    InAppMessageInterface::ATTR_TITLE,
    InAppMessageInterface::ATTR_BODY_PREVIEW,
    InAppMessageInterface::ATTR_ACTION_URL,
    InAppMessageInterface::ATTR_ICON,
    InAppMessageInterface::ATTR_PAYLOAD,
    InAppMessageInterface::ATTR_DELIVERED_AT,
    InAppMessageInterface::ATTR_METADATA,
])]
#[UseFactory(InAppMessageFactory::class)]
#[UsePolicy(InAppMessagePolicy::class)]
#[WithoutIncrementing]
final class InAppMessage extends Model implements AuditableContract, InAppMessageInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — JSON + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        InAppMessageInterface::ATTR_PAYLOAD      => 'array',
        InAppMessageInterface::ATTR_DELIVERED_AT => 'datetime',
    ];

    /**
     * Read-state rows across every addressee that has viewed this
     * message. For the bell UI's own read-state, callers filter by
     * `addressee_id` — no relation constraint here.
     *
     * @return HasMany<InAppMessageRead, $this>
     */
    public function reads(): HasMany
    {
        return $this->hasMany(
            InAppMessageRead::class,
            InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID,
            InAppMessageInterface::ATTR_ID,
        );
    }
}

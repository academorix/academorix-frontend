<?php

declare(strict_types=1);

namespace Academorix\Transfer\Models;

use Academorix\Activity\Concerns\HasActivityLog;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Academorix\Transfer\Contracts\Data\XferMappingProfileInterface;
use Academorix\Transfer\Database\Factories\XferMappingProfileFactory;
use Academorix\Transfer\Policies\XferMappingProfilePolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;

/**
 * Eloquent model for an {@see XferMappingProfileInterface}.
 *
 * Saved header-remap profile per tenant per entity. Composes
 * {@see HasActivityLog} so tenant admins see 'Alice created mapping
 * profile Q3 HubSpot Import' in the feed. No audit trail — mapping
 * profiles are convenience, not compliance material.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Table(
    name: XferMappingProfileInterface::TABLE,
    key: XferMappingProfileInterface::PRIMARY_KEY,
    keyType: XferMappingProfileInterface::KEY_TYPE,
)]
#[Fillable([
    XferMappingProfileInterface::ATTR_TENANT_ID,
    XferMappingProfileInterface::ATTR_OWNER_ID,
    XferMappingProfileInterface::ATTR_ENTITY_KEY,
    XferMappingProfileInterface::ATTR_NAME,
    XferMappingProfileInterface::ATTR_DESCRIPTION,
    XferMappingProfileInterface::ATTR_HEADER_MAP,
    XferMappingProfileInterface::ATTR_START_ROW,
    XferMappingProfileInterface::ATTR_HEADING_ROW,
    XferMappingProfileInterface::ATTR_CSV_SETTINGS,
    XferMappingProfileInterface::ATTR_IS_DEFAULT,
    XferMappingProfileInterface::ATTR_IS_SHARED,
    XferMappingProfileInterface::ATTR_USED_COUNT,
    XferMappingProfileInterface::ATTR_LAST_USED_AT,
])]
#[UseFactory(XferMappingProfileFactory::class)]
#[UsePolicy(XferMappingProfilePolicy::class)]
#[WithoutIncrementing]
final class XferMappingProfile extends Model implements XferMappingProfileInterface
{
    use BelongsToTenant;
    use HasActivityLog;
    use HasFactory;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — JSON blobs + booleans + integers + datetime.
     *
     * @var array<string, string>
     */
    protected $casts = [
        XferMappingProfileInterface::ATTR_HEADER_MAP   => 'array',
        XferMappingProfileInterface::ATTR_CSV_SETTINGS => 'array',
        XferMappingProfileInterface::ATTR_IS_DEFAULT   => 'boolean',
        XferMappingProfileInterface::ATTR_IS_SHARED    => 'boolean',
        XferMappingProfileInterface::ATTR_START_ROW    => 'integer',
        XferMappingProfileInterface::ATTR_HEADING_ROW  => 'integer',
        XferMappingProfileInterface::ATTR_USED_COUNT   => 'integer',
        XferMappingProfileInterface::ATTR_LAST_USED_AT => 'datetime',
    ];
}

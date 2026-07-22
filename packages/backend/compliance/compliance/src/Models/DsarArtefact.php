<?php

declare(strict_types=1);

namespace Stackra\Compliance\Models;

use Stackra\Compliance\Contracts\Data\DsarArtefactInterface;
use Stackra\Compliance\Database\Factories\DsarArtefactFactory;
use Stackra\Compliance\Observers\DsarArtefactObserver;
use Stackra\Compliance\Policies\DsarArtefactPolicy;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;

/**
 * Eloquent model for a {@see DsarArtefactInterface}.
 *
 * Per-module contribution to a DSAR bundle. `file_id` points at the
 * storage::File that holds the assembled bytes; SoftDeletes cascades
 * from the parent Dsar.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Table(
    name: DsarArtefactInterface::TABLE,
    key: DsarArtefactInterface::PRIMARY_KEY,
    keyType: DsarArtefactInterface::KEY_TYPE,
)]
#[Fillable([
    DsarArtefactInterface::ATTR_TENANT_ID,
    DsarArtefactInterface::ATTR_DSAR_ID,
    DsarArtefactInterface::ATTR_MODULE,
    DsarArtefactInterface::ATTR_ENTITY,
    DsarArtefactInterface::ATTR_ROW_COUNT,
    DsarArtefactInterface::ATTR_FORMAT,
    DsarArtefactInterface::ATTR_FILE_ID,
    DsarArtefactInterface::ATTR_REDACTED_COLUMNS,
    DsarArtefactInterface::ATTR_STATUS,
    DsarArtefactInterface::ATTR_ERROR,
    DsarArtefactInterface::ATTR_METADATA,
])]
#[UseFactory(DsarArtefactFactory::class)]
#[UsePolicy(DsarArtefactPolicy::class)]
#[ObservedBy([DsarArtefactObserver::class])]
#[WithoutIncrementing]
final class DsarArtefact extends Model implements DsarArtefactInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — JSON + integer coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        DsarArtefactInterface::ATTR_ROW_COUNT        => 'integer',
        DsarArtefactInterface::ATTR_REDACTED_COLUMNS => 'array',
    ];

    /**
     * The parent DSAR.
     *
     * @return BelongsTo<Dsar, $this>
     */
    public function dsar(): BelongsTo
    {
        return $this->belongsTo(
            Dsar::class,
            DsarArtefactInterface::ATTR_DSAR_ID,
        );
    }
}

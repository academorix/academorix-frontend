<?php

declare(strict_types=1);

namespace Academorix\Localization\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Database\Concerns\Model\HasUserStamp;
use Academorix\Localization\Contracts\Data\TranslationJobInterface;
use Academorix\Localization\Database\Factories\TranslationJobFactory;
use Academorix\Localization\Enums\TranslationJobKind;
use Academorix\Localization\Enums\TranslationJobStatus;
use Academorix\Localization\Enums\TranslatorDriverName;
use Academorix\Localization\Observers\TranslationJobObserver;
use Academorix\Localization\Policies\TranslationJobPolicy;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see TranslationJobInterface}.
 *
 * Audit trail for async bulk-translation work. Append-only in
 * practice — status transitions capture progress. NO SoftDeletes;
 * retention by hard purge via the retention module's runner.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Table(
    name: TranslationJobInterface::TABLE,
    key: TranslationJobInterface::PRIMARY_KEY,
    keyType: TranslationJobInterface::KEY_TYPE,
)]
#[Fillable([
    TranslationJobInterface::ATTR_TENANT_ID,
    TranslationJobInterface::ATTR_INITIATOR_ID,
    TranslationJobInterface::ATTR_KIND,
    TranslationJobInterface::ATTR_DRIVER,
    TranslationJobInterface::ATTR_DRIVER_MODEL,
    TranslationJobInterface::ATTR_SOURCE_LOCALE,
    TranslationJobInterface::ATTR_TARGET_LOCALE,
    TranslationJobInterface::ATTR_STATUS,
    TranslationJobInterface::ATTR_TOTAL_KEYS,
    TranslationJobInterface::ATTR_TRANSLATED_KEYS,
    TranslationJobInterface::ATTR_FAILED_KEYS,
    TranslationJobInterface::ATTR_NAMESPACE_FILTER,
    TranslationJobInterface::ATTR_GROUP_FILTER,
    TranslationJobInterface::ATTR_STARTED_AT,
    TranslationJobInterface::ATTR_FINISHED_AT,
    TranslationJobInterface::ATTR_ERROR_MESSAGE,
    TranslationJobInterface::ATTR_METADATA,
])]
#[UseFactory(TranslationJobFactory::class)]
#[UsePolicy(TranslationJobPolicy::class)]
#[ObservedBy([TranslationJobObserver::class])]
final class TranslationJob extends Model implements AuditableContract, TranslationJobInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasUserStamp;

    /**
     * Cast map — status + kind + driver enums plus counters + times.
     *
     * @var array<string, string>
     */
    protected $casts = [
        TranslationJobInterface::ATTR_KIND            => TranslationJobKind::class,
        TranslationJobInterface::ATTR_DRIVER          => TranslatorDriverName::class,
        TranslationJobInterface::ATTR_STATUS          => TranslationJobStatus::class,
        TranslationJobInterface::ATTR_TOTAL_KEYS      => 'integer',
        TranslationJobInterface::ATTR_TRANSLATED_KEYS => 'integer',
        TranslationJobInterface::ATTR_FAILED_KEYS     => 'integer',
        TranslationJobInterface::ATTR_STARTED_AT      => 'datetime',
        TranslationJobInterface::ATTR_FINISHED_AT     => 'datetime',
    ];

    /**
     * Reverse — every translation row produced by this job.
     *
     * @return HasMany<Translation, $this>
     */
    public function translations(): HasMany
    {
        return $this->hasMany(
            Translation::class,
            \Academorix\Localization\Contracts\Data\TranslationInterface::ATTR_TRANSLATION_JOB_ID,
        );
    }

    /**
     * Get the table associated with the model — resolved from config.
     */
    public function getTable(): string
    {
        return (string) \config(
            'localization.tables.translation_jobs',
            TranslationJobInterface::TABLE,
        );
    }
}

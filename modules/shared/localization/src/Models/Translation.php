<?php

declare(strict_types=1);

namespace Academorix\Localization\Models;

use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Database\Concerns\Model\HasUserStamp;
use Academorix\Localization\Contracts\Data\TranslationInterface;
use Academorix\Localization\Database\Factories\TranslationFactory;
use Academorix\Localization\Enums\TranslationSource;
use Academorix\Localization\Observers\TranslationObserver;
use Academorix\Localization\Policies\TranslationPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see TranslationInterface}.
 *
 * The DB cache the decorated Translator consults before the
 * filesystem. `tenant_id NULL` = platform default (Academorix-shipped);
 * non-null = tenant override.
 *
 * NOT composing `BelongsToTenant` — the trait presumes non-null
 * `tenant_id`, and platform defaults would be invisible to every
 * read. Manual tenant scoping happens in the repository layer.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Table(
    name: TranslationInterface::TABLE,
    key: TranslationInterface::PRIMARY_KEY,
    keyType: TranslationInterface::KEY_TYPE,
)]
#[Fillable([
    TranslationInterface::ATTR_TENANT_ID,
    TranslationInterface::ATTR_LANGUAGE_ID,
    TranslationInterface::ATTR_TRANSLATION_JOB_ID,
    TranslationInterface::ATTR_NAMESPACE,
    TranslationInterface::ATTR_GROUP,
    TranslationInterface::ATTR_KEY,
    TranslationInterface::ATTR_LOCALE_CODE,
    TranslationInterface::ATTR_VALUE,
    TranslationInterface::ATTR_SOURCE,
    TranslationInterface::ATTR_PROVIDER,
    TranslationInterface::ATTR_QUALITY_SCORE,
    TranslationInterface::ATTR_SOURCE_HASH,
    TranslationInterface::ATTR_IS_VERIFIED,
    TranslationInterface::ATTR_IS_STALE,
    TranslationInterface::ATTR_VERIFIED_BY,
    TranslationInterface::ATTR_VERIFIED_AT,
])]
#[UseFactory(TranslationFactory::class)]
#[UsePolicy(TranslationPolicy::class)]
#[ObservedBy([TranslationObserver::class])]
final class Translation extends Model implements AuditableContract, TranslationInterface
{
    use Auditable;
    use HasFactory;
    use HasPrefixedUlid;
    use HasUserStamp;
    use SoftDeletes;

    /**
     * Cast map — enum source + booleans + quality score float.
     *
     * @var array<string, string>
     */
    protected $casts = [
        TranslationInterface::ATTR_SOURCE        => TranslationSource::class,
        TranslationInterface::ATTR_IS_VERIFIED   => 'boolean',
        TranslationInterface::ATTR_IS_STALE      => 'boolean',
        TranslationInterface::ATTR_QUALITY_SCORE => 'float',
        TranslationInterface::ATTR_VERIFIED_AT   => 'datetime',
    ];

    /**
     * The platform language this row translates into.
     *
     * @return BelongsTo<PlatformLanguage, $this>
     */
    public function language(): BelongsTo
    {
        return $this->belongsTo(
            PlatformLanguage::class,
            TranslationInterface::ATTR_LANGUAGE_ID,
        );
    }

    /**
     * The parent bulk-translate job — nullable because a row can be
     * hand-authored (`source=manual`) or imported (`source=import`)
     * without any job attachment.
     *
     * @return BelongsTo<TranslationJob, $this>
     */
    public function translationJob(): BelongsTo
    {
        return $this->belongsTo(
            TranslationJob::class,
            TranslationInterface::ATTR_TRANSLATION_JOB_ID,
        );
    }

    /**
     * Get the table associated with the model — resolved from config.
     */
    public function getTable(): string
    {
        return (string) \config(
            'localization.tables.translations',
            TranslationInterface::TABLE,
        );
    }
}

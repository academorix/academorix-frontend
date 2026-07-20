<?php

declare(strict_types=1);

namespace Academorix\Geography\Models;

use Academorix\Geography\Contracts\Data\LanguageInterface;
use Academorix\Geography\Database\Factories\LanguageFactory;
use Academorix\Geography\Observers\LanguageObserver;
use Academorix\Geography\Policies\LanguagePolicy;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Nnjeim\World\Models\Language as WorldLanguage;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see LanguageInterface}.
 *
 * SUBCLASSES vendor `Nnjeim\World\Models\Language`. Single source of
 * truth for ISO-639-1 language metadata across the platform;
 * `localization::PlatformLanguage` FK-references this table via
 * `platform_languages.geography_language_id` (Wave 5 dedupe).
 *
 * Route binding accepts BOTH the numeric PK AND the ISO-639-1 code
 * (lowercased).
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[UseFactory(LanguageFactory::class)]
#[UsePolicy(LanguagePolicy::class)]
#[ObservedBy([LanguageObserver::class])]
class Language extends WorldLanguage implements AuditableContract, LanguageInterface
{
    use Auditable;
    use HasFactory;

    /**
     * Cast map — `is_rtl` is a denormalised boolean.
     *
     * @var array<string, string>
     */
    protected $casts = [
        LanguageInterface::ATTR_IS_RTL => 'boolean',
    ];

    /**
     * Route-model-binding resolver — accepts numeric PK or ISO-639-1
     * alpha code (lowercased).
     *
     * @param  mixed        $value  URL segment.
     * @param  string|null  $field  Optional explicit binding field.
     * @return $this|null
     */
    public function resolveRouteBinding($value, $field = null): ?self
    {
        if ($field !== null) {
            /** @var self|null $model */
            $model = static::query()->where($field, $value)->first();

            return $model;
        }

        if (\is_numeric($value)) {
            /** @var self|null $model */
            $model = static::query()
                ->where(LanguageInterface::ATTR_ID, (int) $value)
                ->first();

            return $model;
        }

        /** @var self|null $model */
        $model = static::query()
            ->where(LanguageInterface::ATTR_CODE, \strtolower((string) $value))
            ->first();

        return $model;
    }
}

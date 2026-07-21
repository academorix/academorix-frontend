<?php

declare(strict_types=1);

namespace Stackra\Localization\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched by the `HasTranslations` trait when a `#[Translatable]`
 * property writes a new (locale, field) tuple into the model's
 * `translations` JSONB column.
 *
 * Distinct from `TranslationOverridden` — this event fires on every
 * per-row content translation write, whereas
 * `TranslationOverridden` fires on the UI-key override path.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'localization.translation.written')]
final readonly class TranslationWritten implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string|null    $tenantId       Tenant owning the model (null on platform-scoped rows).
     * @param  class-string   $modelType      Fully-qualified model class.
     * @param  string         $modelId        Model row id (ULID or PK).
     * @param  string         $field          Property name annotated with `#[Translatable]`.
     * @param  string         $localeCode    BCP-47 tag of the write.
     * @param  string|null    $actorId       User id causing the write (null on system writes).
     * @param  bool           $isNewLocale   True when this is the FIRST write for this locale on the row.
     */
    public function __construct(
        public ?string $tenantId,
        public string $modelType,
        public string $modelId,
        public string $field,
        public string $localeCode,
        public ?string $actorId,
        public bool $isNewLocale,
    ) {
    }
}

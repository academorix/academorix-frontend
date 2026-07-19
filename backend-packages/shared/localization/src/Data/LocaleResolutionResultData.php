<?php

declare(strict_types=1);

namespace Academorix\Localization\Data;

use Academorix\Localization\Enums\LocaleResolutionSource;
use Spatie\LaravelData\Data;

/**
 * Result of one
 * {@see \Academorix\Localization\Contracts\Services\LocaleResolverInterface::resolve()}
 * call — the winning locale + the strategy that produced it.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class LocaleResolutionResultData extends Data
{
    /**
     * @param  string                  $localeCode    BCP-47 tag chosen for the request.
     * @param  LocaleResolutionSource  $source        Strategy that produced the winner.
     * @param  string|null             $fallbackCode  BCP-47 tag the fallback resolution would use.
     */
    public function __construct(
        public string $localeCode,
        public LocaleResolutionSource $source,
        public ?string $fallbackCode = null,
    ) {
    }
}

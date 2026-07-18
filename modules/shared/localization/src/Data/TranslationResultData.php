<?php

declare(strict_types=1);

namespace Academorix\Localization\Data;

use Spatie\LaravelData\Data;

/**
 * Wire-visible result of a single {@see \Academorix\Localization\Contracts\Services\TranslatorDriverInterface::translate()}
 * call. Every driver returns this same shape so consumers stay
 * driver-agnostic.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationResultData extends Data
{
    /**
     * @param  string       $translatedText  The driver's output — already redacted downstream by the caller.
     * @param  string       $driver          Driver identifier that produced the result.
     * @param  string|null  $model           Optional model / engine variant identifier (e.g. `gpt-4o-mini`).
     * @param  float|null   $qualityScore    Driver-reported quality (0.0-1.0). Null when the driver has no such signal.
     * @param  int          $durationMs      Wall-clock duration of the driver call in milliseconds.
     */
    public function __construct(
        public string $translatedText,
        public string $driver,
        public ?string $model = null,
        public ?float $qualityScore = null,
        public int $durationMs = 0,
    ) {
    }
}

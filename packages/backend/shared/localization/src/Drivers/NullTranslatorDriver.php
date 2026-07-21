<?php

declare(strict_types=1);

namespace Stackra\Localization\Drivers;

use Stackra\Localization\Attributes\AsTranslatorDriver;
use Stackra\Localization\Contracts\Services\TranslatorDriverInterface;
use Stackra\Localization\Data\DriverHealthData;
use Stackra\Localization\Data\TranslationResultData;
use Illuminate\Container\Attributes\Scoped;

/**
 * No-op driver — returns the source string unchanged. Used in tests
 * and as the safe fallback when auto-translate is off or when a
 * mis-configured driver name resolves through the manager.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsTranslatorDriver(name: 'null')]
#[Scoped]
final class NullTranslatorDriver implements TranslatorDriverInterface
{
    /**
     * {@inheritDoc}
     */
    public function translate(
        string $sourceText,
        string $sourceLocale,
        string $targetLocale,
        array $context = [],
    ): TranslationResultData {
        return new TranslationResultData(
            translatedText: $sourceText,
            driver: $this->name(),
            model: null,
            qualityScore: null,
            durationMs: 0,
        );
    }

    /**
     * {@inheritDoc}
     */
    public function translateBatch(
        array $sources,
        string $sourceLocale,
        string $targetLocale,
        array $context = [],
    ): array {
        return \array_map(
            fn (string $text): TranslationResultData => $this->translate(
                $text,
                $sourceLocale,
                $targetLocale,
                $context,
            ),
            $sources,
        );
    }

    /**
     * {@inheritDoc}
     */
    public function supportsLocalePair(string $sourceLocale, string $targetLocale): bool
    {
        // Every pair is trivially supported — this driver never
        // actually translates.
        return true;
    }

    /**
     * {@inheritDoc}
     */
    public function healthcheck(): DriverHealthData
    {
        return new DriverHealthData(
            driver: $this->name(),
            reachable: true,
            latencyMs: 0,
        );
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'null';
    }
}

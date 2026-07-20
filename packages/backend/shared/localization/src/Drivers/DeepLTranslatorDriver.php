<?php

declare(strict_types=1);

namespace Academorix\Localization\Drivers;

use Academorix\Localization\Attributes\AsTranslatorDriver;
use Academorix\Localization\Contracts\Services\TranslatorDriverInterface;
use Academorix\Localization\Data\DriverHealthData;
use Academorix\Localization\Data\TranslationResultData;
use Academorix\Localization\Exceptions\DriverUnreachableException;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Client\Factory as HttpFactory;

/**
 * DeepL API v2 driver.
 *
 * DeepL supports a smaller set of locales than Google — see
 * {@see self::SUPPORTED_LANGUAGES}. `supportsLocalePair()` refuses
 * unsupported pairs so the manager can pick a fallback driver.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsTranslatorDriver(name: 'deepl')]
#[Scoped]
final class DeepLTranslatorDriver implements TranslatorDriverInterface
{
    /**
     * Language subtags DeepL supports as source or target. Reference:
     * https://developers.deepl.com/docs/resources/supported-languages
     *
     * @var list<string>
     */
    private const array SUPPORTED_LANGUAGES = [
        'en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'pt', 'ru', 'ja',
        'zh', 'ko', 'sv', 'da', 'fi', 'no', 'cs', 'el', 'hu', 'ro',
        'sk', 'sl', 'bg', 'et', 'lv', 'lt', 'tr', 'uk', 'id', 'ar',
    ];

    /**
     * @param  HttpFactory  $http           HTTP client factory.
     * @param  string|null  $apiKey         DeepL API key.
     * @param  string       $endpoint       Free-tier or pro endpoint URL.
     * @param  int          $timeoutSeconds Request timeout.
     */
    public function __construct(
        private readonly HttpFactory $http,
        #[Config('localization.drivers.deepl.api_key')] private readonly ?string $apiKey,
        #[Config('localization.drivers.deepl.endpoint', 'https://api-free.deepl.com/v2')] private readonly string $endpoint,
        #[Config('localization.drivers.deepl.timeout_seconds', 30)] private readonly int $timeoutSeconds,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function translate(
        string $sourceText,
        string $sourceLocale,
        string $targetLocale,
        array $context = [],
    ): TranslationResultData {
        $results = $this->translateBatch([$sourceText], $sourceLocale, $targetLocale, $context);

        return $results[0] ?? new TranslationResultData(
            translatedText: $sourceText,
            driver: $this->name(),
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
        $started = \microtime(true);

        if ($this->apiKey === null || $sources === []) {
            return \array_map(
                fn (string $text): TranslationResultData => new TranslationResultData(
                    translatedText: $text,
                    driver: $this->name(),
                ),
                $sources,
            );
        }

        try {
            $response = $this->http
                ->timeout($this->timeoutSeconds)
                ->withHeaders(['Authorization' => 'DeepL-Auth-Key ' . $this->apiKey])
                ->asForm()
                ->post($this->endpoint . '/translate', [
                    'text'        => \array_values($sources),
                    'source_lang' => \strtoupper(\explode('-', $sourceLocale)[0]),
                    'target_lang' => \strtoupper(\explode('-', $targetLocale)[0]),
                ]);
        } catch (\Throwable $e) {
            throw new DriverUnreachableException(\sprintf(
                'DeepL request failed: %s',
                $e->getMessage(),
            ));
        }

        if (! $response->successful()) {
            throw new DriverUnreachableException(\sprintf(
                'DeepL responded with HTTP %d',
                $response->status(),
            ));
        }

        /** @var list<array<string, mixed>> $translations */
        $translations = (array) $response->json('translations', []);

        $duration = (int) \round((\microtime(true) - $started) * 1000);

        $out = [];
        foreach ($sources as $index => $source) {
            $translated = (string) ($translations[$index]['text'] ?? $source);
            $out[] = new TranslationResultData(
                translatedText: $translated,
                driver: $this->name(),
                model: null,
                qualityScore: null,
                durationMs: $duration,
            );
        }

        return $out;
    }

    /**
     * {@inheritDoc}
     */
    public function supportsLocalePair(string $sourceLocale, string $targetLocale): bool
    {
        // Match on the language subtag — DeepL is region-agnostic.
        $source = \strtolower(\explode('-', $sourceLocale)[0]);
        $target = \strtolower(\explode('-', $targetLocale)[0]);

        return \in_array($source, self::SUPPORTED_LANGUAGES, true)
            && \in_array($target, self::SUPPORTED_LANGUAGES, true);
    }

    /**
     * {@inheritDoc}
     */
    public function healthcheck(): DriverHealthData
    {
        $started = \microtime(true);

        if ($this->apiKey === null || $this->apiKey === '') {
            return new DriverHealthData(
                driver: $this->name(),
                reachable: false,
                latencyMs: 0,
                errorMessage: 'DeepL API key is not configured.',
            );
        }

        try {
            $response = $this->http
                ->timeout(5)
                ->withHeaders(['Authorization' => 'DeepL-Auth-Key ' . $this->apiKey])
                ->get($this->endpoint . '/usage');

            return new DriverHealthData(
                driver: $this->name(),
                reachable: $response->successful(),
                latencyMs: (int) \round((\microtime(true) - $started) * 1000),
                errorMessage: $response->successful() ? null : \sprintf('HTTP %d', $response->status()),
            );
        } catch (\Throwable $e) {
            return new DriverHealthData(
                driver: $this->name(),
                reachable: false,
                latencyMs: (int) \round((\microtime(true) - $started) * 1000),
                errorMessage: $e->getMessage(),
            );
        }
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'deepl';
    }
}

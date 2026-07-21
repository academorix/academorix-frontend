<?php

declare(strict_types=1);

namespace Stackra\Localization\Drivers;

use Stackra\Localization\Attributes\AsTranslatorDriver;
use Stackra\Localization\Contracts\Services\TranslatorDriverInterface;
use Stackra\Localization\Data\DriverHealthData;
use Stackra\Localization\Data\TranslationResultData;
use Stackra\Localization\Exceptions\DriverUnreachableException;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Client\Factory as HttpFactory;

/**
 * Azure Translator REST API driver.
 *
 * Region-scoped auth headers per Azure's convention. Custom
 * terminology (Azure Custom Translator) is out of scope for the
 * generic driver — tenants that need it should override the binding
 * with a bespoke implementation.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsTranslatorDriver(name: 'azure-translator')]
#[Scoped]
final class AzureTranslatorDriver implements TranslatorDriverInterface
{
    /**
     * @param  HttpFactory   $http           HTTP client factory.
     * @param  string|null   $key            Azure Translator key.
     * @param  string        $region         Azure region.
     * @param  string        $endpoint       API endpoint.
     * @param  int           $timeoutSeconds Request timeout.
     */
    public function __construct(
        private readonly HttpFactory $http,
        #[Config('localization.drivers.azure-translator.key')] private readonly ?string $key,
        #[Config('localization.drivers.azure-translator.region', 'global')] private readonly string $region,
        #[Config(
            'localization.drivers.azure-translator.endpoint',
            'https://api.cognitive.microsofttranslator.com',
        )] private readonly string $endpoint,
        #[Config('localization.drivers.azure-translator.timeout_seconds', 30)] private readonly int $timeoutSeconds,
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

        if ($this->key === null || $sources === []) {
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
                ->withHeaders([
                    'Ocp-Apim-Subscription-Key'    => $this->key,
                    'Ocp-Apim-Subscription-Region' => $this->region,
                ])
                ->acceptJson()
                ->post($this->endpoint . '/translate?api-version=3.0&from=' . $sourceLocale . '&to=' . $targetLocale,
                    \array_map(
                        static fn (string $t): array => ['Text' => $t],
                        \array_values($sources),
                    ),
                );
        } catch (\Throwable $e) {
            throw new DriverUnreachableException(\sprintf(
                'Azure Translator request failed: %s',
                $e->getMessage(),
            ));
        }

        if (! $response->successful()) {
            throw new DriverUnreachableException(\sprintf(
                'Azure Translator responded with HTTP %d',
                $response->status(),
            ));
        }

        $duration = (int) \round((\microtime(true) - $started) * 1000);

        /** @var list<array<string, mixed>> $payload */
        $payload = (array) $response->json();

        $out = [];
        foreach ($sources as $index => $source) {
            $translations = (array) ($payload[$index]['translations'] ?? []);
            $translated   = (string) ($translations[0]['text'] ?? $source);

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
        return true;
    }

    /**
     * {@inheritDoc}
     */
    public function healthcheck(): DriverHealthData
    {
        $started = \microtime(true);

        if ($this->key === null || $this->key === '') {
            return new DriverHealthData(
                driver: $this->name(),
                reachable: false,
                latencyMs: 0,
                errorMessage: 'Azure Translator key is not configured.',
            );
        }

        try {
            $response = $this->http
                ->timeout(5)
                ->withHeaders([
                    'Ocp-Apim-Subscription-Key'    => $this->key,
                    'Ocp-Apim-Subscription-Region' => $this->region,
                ])
                ->get($this->endpoint . '/languages?api-version=3.0');

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
        return 'azure-translator';
    }
}

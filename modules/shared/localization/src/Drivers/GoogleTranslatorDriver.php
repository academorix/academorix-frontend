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
 * Google Cloud Translation v3 driver.
 *
 * Uses the REST API rather than the vendor SDK so the driver stays
 * functional in vendor-lite deployments. Consumer apps that install
 * `google/cloud-translate` benefit from the SDK's retry + auth
 * automatically when they override the binding.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsTranslatorDriver(name: 'google')]
#[Scoped]
final class GoogleTranslatorDriver implements TranslatorDriverInterface
{
    /**
     * @param  HttpFactory   $http             HTTP client factory.
     * @param  string|null   $projectId        GCP project id.
     * @param  string|null   $credentialsPath Path to the service-account JSON.
     * @param  string        $model            `nmt` or `base`.
     * @param  int           $timeoutSeconds   Request timeout.
     */
    public function __construct(
        private readonly HttpFactory $http,
        #[Config('localization.drivers.google.project_id')] private readonly ?string $projectId,
        #[Config('localization.drivers.google.credentials_path')] private readonly ?string $credentialsPath,
        #[Config('localization.drivers.google.model', 'nmt')] private readonly string $model,
        #[Config('localization.drivers.google.timeout_seconds', 30)] private readonly int $timeoutSeconds,
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
            model: $this->model,
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

        if ($this->projectId === null || $sources === []) {
            return \array_map(
                fn (string $text): TranslationResultData => new TranslationResultData(
                    translatedText: $text,
                    driver: $this->name(),
                    model: $this->model,
                ),
                $sources,
            );
        }

        $endpoint = \sprintf(
            'https://translation.googleapis.com/v3/projects/%s:translateText',
            $this->projectId,
        );

        try {
            $response = $this->http
                ->timeout($this->timeoutSeconds)
                ->acceptJson()
                ->post($endpoint, [
                    'contents'           => \array_values($sources),
                    'sourceLanguageCode' => $sourceLocale,
                    'targetLanguageCode' => $targetLocale,
                    'model'              => $this->model,
                ]);
        } catch (\Throwable $e) {
            throw new DriverUnreachableException(\sprintf(
                'Google Translate request failed: %s',
                $e->getMessage(),
            ));
        }

        if (! $response->successful()) {
            throw new DriverUnreachableException(\sprintf(
                'Google Translate responded with HTTP %d',
                $response->status(),
            ));
        }

        /** @var array<int, array<string, mixed>> $translations */
        $translations = (array) $response->json('translations', []);

        $duration = (int) \round((\microtime(true) - $started) * 1000);

        $out = [];
        foreach ($sources as $index => $source) {
            $translated = (string) ($translations[$index]['translatedText'] ?? $source);
            $out[] = new TranslationResultData(
                translatedText: $translated,
                driver: $this->name(),
                model: $this->model,
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
        // Google supports 100+ languages — the practical set of
        // supported pairs is unbounded in this context.
        return true;
    }

    /**
     * {@inheritDoc}
     */
    public function healthcheck(): DriverHealthData
    {
        $started = \microtime(true);

        if ($this->projectId === null || $this->projectId === '') {
            return new DriverHealthData(
                driver: $this->name(),
                reachable: false,
                latencyMs: 0,
                errorMessage: 'GCP project id is not configured.',
            );
        }

        return new DriverHealthData(
            driver: $this->name(),
            reachable: true,
            latencyMs: (int) \round((\microtime(true) - $started) * 1000),
        );
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'google';
    }
}

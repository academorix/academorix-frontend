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
 * OpenAI Chat Completions driver.
 *
 * Uses the raw HTTP client rather than `openai-php/laravel` so the
 * driver stays functional even when the vendor client isn't
 * installed — the composer `suggest` block advertises the vendor
 * package but doesn't require it.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsTranslatorDriver(name: 'openai')]
#[Scoped]
final class OpenAITranslatorDriver implements TranslatorDriverInterface
{
    /**
     * @param  HttpFactory   $http           HTTP client factory.
     * @param  string|null   $apiKey         OpenAI API key (Doppler-sourced).
     * @param  string        $model          Model identifier (default `gpt-4o-mini`).
     * @param  float         $temperature    Sampling temperature.
     * @param  string        $systemPrompt   System prompt template.
     * @param  int           $timeoutSeconds Request timeout.
     */
    public function __construct(
        private readonly HttpFactory $http,
        #[Config('localization.drivers.openai.api_key')] private readonly ?string $apiKey,
        #[Config('localization.drivers.openai.model', 'gpt-4o-mini')] private readonly string $model,
        #[Config('localization.drivers.openai.temperature', 0.2)] private readonly float $temperature,
        #[Config('localization.drivers.openai.system_prompt')] private readonly ?string $systemPrompt,
        #[Config('localization.drivers.openai.timeout_seconds', 30)] private readonly int $timeoutSeconds,
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
        $started = \microtime(true);

        $systemPrompt = \strtr(
            $this->systemPrompt ?? 'Translate from {source_locale} to {target_locale}.',
            [
                '{source_locale}' => $sourceLocale,
                '{target_locale}' => $targetLocale,
                ':source_locale'  => $sourceLocale,
                ':target_locale'  => $targetLocale,
            ],
        );

        try {
            $response = $this->http
                ->timeout($this->timeoutSeconds)
                ->withToken((string) $this->apiKey)
                ->acceptJson()
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'       => $this->model,
                    'temperature' => $this->temperature,
                    'messages'    => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user',   'content' => $sourceText],
                    ],
                ]);
        } catch (\Throwable $e) {
            throw (new DriverUnreachableException(\sprintf(
                'OpenAI request failed: %s',
                $e->getMessage(),
            )));
        }

        if (! $response->successful()) {
            throw (new DriverUnreachableException(\sprintf(
                'OpenAI responded with HTTP %d',
                $response->status(),
            )));
        }

        $translated = (string) ($response->json('choices.0.message.content') ?? $sourceText);

        return new TranslationResultData(
            translatedText: \trim($translated),
            driver: $this->name(),
            model: $this->model,
            qualityScore: null,
            durationMs: (int) \round((\microtime(true) - $started) * 1000),
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
        // OpenAI has no first-class batch endpoint — fan out one call
        // per source. Cost trades against latency; consumers who
        // need true batching should pick DeepL / Google.
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
        // LLM-based drivers accept every pair; quality varies but
        // the request never fails at the API level.
        return true;
    }

    /**
     * {@inheritDoc}
     */
    public function healthcheck(): DriverHealthData
    {
        // Non-billable probe — HEAD the models endpoint.
        $started = \microtime(true);

        if ($this->apiKey === null || $this->apiKey === '') {
            return new DriverHealthData(
                driver: $this->name(),
                reachable: false,
                latencyMs: 0,
                errorMessage: 'OpenAI API key is not configured.',
            );
        }

        try {
            $response = $this->http
                ->timeout(5)
                ->withToken($this->apiKey)
                ->get('https://api.openai.com/v1/models');

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
        return 'openai';
    }
}

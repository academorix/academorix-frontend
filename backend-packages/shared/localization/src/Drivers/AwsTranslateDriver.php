<?php

declare(strict_types=1);

namespace Academorix\Localization\Drivers;

use Academorix\Localization\Attributes\AsTranslatorDriver;
use Academorix\Localization\Contracts\Services\TranslatorDriverInterface;
use Academorix\Localization\Data\DriverHealthData;
use Academorix\Localization\Data\TranslationResultData;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;

/**
 * AWS Translate driver.
 *
 * The vendor SDK (`aws/aws-sdk-php`) is a `suggest` dependency — the
 * driver instantiates the client via string reference so consumer
 * apps that never use AWS Translate skip the ~40MB SDK download.
 * When the vendor client is missing the driver degrades to a null
 * translation with a diagnostic message.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsTranslatorDriver(name: 'aws-translate')]
#[Scoped]
final class AwsTranslateDriver implements TranslatorDriverInterface
{
    /**
     * @param  string       $region          AWS region.
     * @param  string|null  $accessKey       AWS access key id.
     * @param  string|null  $secretKey       AWS secret access key.
     * @param  int          $timeoutSeconds  Client timeout.
     */
    public function __construct(
        #[Config('localization.drivers.aws-translate.region', 'us-east-1')] private readonly string $region,
        #[Config('localization.drivers.aws-translate.access_key')] private readonly ?string $accessKey,
        #[Config('localization.drivers.aws-translate.secret_key')] private readonly ?string $secretKey,
        #[Config('localization.drivers.aws-translate.timeout_seconds', 30)] private readonly int $timeoutSeconds,
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

        $clientClass = '\\Aws\\Translate\\TranslateClient';
        if (! \class_exists($clientClass)) {
            // Vendor SDK not installed — pass through.
            return new TranslationResultData(
                translatedText: $sourceText,
                driver: $this->name(),
                model: null,
                qualityScore: null,
                durationMs: 0,
            );
        }

        try {
            /** @var object $client */
            $client = new $clientClass([
                'region'      => $this->region,
                'version'     => 'latest',
                'credentials' => $this->credentialsArray(),
                'http'        => ['timeout' => $this->timeoutSeconds],
            ]);

            /** @var object $result */
            $result = $client->translateText([
                'SourceLanguageCode' => $sourceLocale,
                'TargetLanguageCode' => $targetLocale,
                'Text'               => $sourceText,
            ]);

            $translated = (string) ($result['TranslatedText'] ?? $sourceText);

            return new TranslationResultData(
                translatedText: $translated,
                driver: $this->name(),
                model: null,
                qualityScore: null,
                durationMs: (int) \round((\microtime(true) - $started) * 1000),
            );
        } catch (\Throwable) {
            return new TranslationResultData(
                translatedText: $sourceText,
                driver: $this->name(),
                model: null,
                qualityScore: null,
                durationMs: (int) \round((\microtime(true) - $started) * 1000),
            );
        }
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
        return true;
    }

    /**
     * {@inheritDoc}
     */
    public function healthcheck(): DriverHealthData
    {
        $clientClass = '\\Aws\\Translate\\TranslateClient';

        return new DriverHealthData(
            driver: $this->name(),
            reachable: \class_exists($clientClass),
            latencyMs: 0,
            errorMessage: \class_exists($clientClass)
                ? null
                : 'AWS SDK (`aws/aws-sdk-php`) is not installed. See composer suggest.',
        );
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'aws-translate';
    }

    /**
     * Compose the credentials array for the SDK. Returns null when
     * neither key is set — the SDK falls back to the default
     * credential chain (IAM role, ~/.aws/credentials, env vars).
     *
     * @return array{key: string, secret: string}|null
     */
    private function credentialsArray(): ?array
    {
        if ($this->accessKey === null || $this->secretKey === null) {
            return null;
        }

        return [
            'key'    => $this->accessKey,
            'secret' => $this->secretKey,
        ];
    }
}

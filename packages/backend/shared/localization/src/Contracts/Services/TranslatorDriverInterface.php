<?php

declare(strict_types=1);

namespace Stackra\Localization\Contracts\Services;

use Stackra\Localization\Data\DriverHealthData;
use Stackra\Localization\Data\TranslationResultData;

/**
 * Common contract every machine-translation driver satisfies.
 *
 * Discovered via
 * {@see \Stackra\Localization\Attributes\AsTranslatorDriver} and
 * resolved through
 * {@see \Stackra\Localization\Services\TranslatorDriverManager}.
 *
 * Every driver receives ALREADY-REDACTED source strings — the shared
 * telemetry redactor runs upstream so PII never reaches a
 * third-party MT provider.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
interface TranslatorDriverInterface
{
    /**
     * Translate a single source string.
     *
     * @param  string                $sourceText     The redacted source string.
     * @param  string                $sourceLocale   BCP-47 tag.
     * @param  string                $targetLocale   BCP-47 tag.
     * @param  array<string, mixed>  $context        Free-form context for LLM-based drivers
     *                                               (glossary hints, domain terminology).
     * @return TranslationResultData  Translated text + metadata.
     */
    public function translate(
        string $sourceText,
        string $sourceLocale,
        string $targetLocale,
        array $context = [],
    ): TranslationResultData;

    /**
     * Translate a batch of source strings in one call — cost-optimising
     * for drivers billed per API call.
     *
     * @param  list<string>          $sources        Redacted source strings.
     * @param  string                $sourceLocale   BCP-47 tag.
     * @param  string                $targetLocale   BCP-47 tag.
     * @param  array<string, mixed>  $context        Free-form context.
     * @return list<TranslationResultData>  Same order as `$sources`.
     */
    public function translateBatch(
        array $sources,
        string $sourceLocale,
        string $targetLocale,
        array $context = [],
    ): array;

    /**
     * Whether the driver supports the passed `(source, target)` pair.
     * DeepL, for instance, does not support every locale pair — this
     * predicate lets the manager pick a fallback driver at resolve
     * time rather than after the round-trip has failed.
     *
     * @param  string  $sourceLocale  BCP-47 tag.
     * @param  string  $targetLocale  BCP-47 tag.
     */
    public function supportsLocalePair(string $sourceLocale, string $targetLocale): bool;

    /**
     * Non-billable reachability probe used by the driver-status
     * endpoint and the `localization:describe` command.
     */
    public function healthcheck(): DriverHealthData;

    /**
     * The driver's registered name — matches
     * {@see \Stackra\Localization\Attributes\AsTranslatorDriver::name}.
     */
    public function name(): string;
}

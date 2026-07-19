<?php

declare(strict_types=1);

namespace Academorix\Localization\Jobs;

use Academorix\Localization\Contracts\Data\PlatformLanguageInterface;
use Academorix\Localization\Contracts\Data\TranslationInterface;
use Academorix\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Academorix\Localization\Contracts\Repositories\TranslationJobRepositoryInterface;
use Academorix\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Academorix\Localization\Contracts\Services\SourceRedactorInterface;
use Academorix\Localization\Contracts\Services\TranslatorDriverManagerInterface;
use Academorix\Localization\Enums\TranslationSource;
use Academorix\Localization\Events\MachineTranslationCompleted;
use Academorix\Localization\Events\MachineTranslationFailed;
use Academorix\Localization\Events\MachineTranslationRequested;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Translate ONE `(namespace, group, key)` tuple into ONE target
 * locale via the configured driver.
 *
 * Composed by {@see BulkTranslateNamespaceJob} for large fan-outs;
 * also dispatched directly from the `translate.cache_miss` listener
 * when the tenant has `auto_translate_driver` configured.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Queue('translations')]
#[Timeout(60)]
#[Tries(3)]
#[Backoff(10, 30, 60)]
final class TranslateJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string|null  $tenantId       Tenant driving the request; null for platform-default rows.
     * @param  string       $sourceText     Source string to translate.
     * @param  string       $sourceLocale   BCP-47 source tag.
     * @param  string       $targetLocale   BCP-47 target tag.
     * @param  string       $namespace      Namespace bucket.
     * @param  string       $group          Group name.
     * @param  string       $key            Translation key.
     * @param  string|null  $driver         Optional driver override.
     * @param  string|null  $jobId          Optional parent bulk-job id.
     */
    public function __construct(
        public readonly ?string $tenantId,
        public readonly string $sourceText,
        public readonly string $sourceLocale,
        public readonly string $targetLocale,
        public readonly string $namespace,
        public readonly string $group,
        public readonly string $key,
        public readonly ?string $driver = null,
        public readonly ?string $jobId = null,
    ) {
    }

    /**
     * Redact → translate → upsert → emit event.
     */
    public function handle(
        SourceRedactorInterface $redactor,
        TranslatorDriverManagerInterface $drivers,
        PlatformLanguageRepositoryInterface $languages,
        TranslationRepositoryInterface $translations,
        TranslationJobRepositoryInterface $jobs,
        Dispatcher $events,
    ): void {
        $language = $languages->findByBcp47($this->targetLocale);
        if ($language === null) {
            $this->recordFailure(
                $jobs,
                $events,
                'PlatformLanguageMissing',
                \sprintf('Platform language "%s" not enabled.', $this->targetLocale),
            );

            return;
        }

        $events->dispatch(new MachineTranslationRequested(
            tenantId: (string) ($this->tenantId ?? ''),
            namespace: $this->namespace,
            key: $this->key,
            sourceLocale: $this->sourceLocale,
            targetLocale: $this->targetLocale,
            driver: $this->driver ?? $drivers->getDefaultDriver(),
        ));

        $redacted = $redactor->redact($this->sourceText);

        try {
            $result = $drivers->driver($this->driver)->translate(
                $redacted,
                $this->sourceLocale,
                $this->targetLocale,
            );
        } catch (\Throwable $e) {
            $this->recordFailure($jobs, $events, $e::class, $e->getMessage());

            throw $e;
        }

        $translation = $translations->query()->updateOrCreate(
            [
                TranslationInterface::ATTR_TENANT_ID   => $this->tenantId,
                TranslationInterface::ATTR_LANGUAGE_ID => (string) $language->getKey(),
                TranslationInterface::ATTR_NAMESPACE   => $this->namespace,
                TranslationInterface::ATTR_GROUP       => $this->group,
                TranslationInterface::ATTR_KEY         => $this->key,
            ],
            [
                TranslationInterface::ATTR_LOCALE_CODE        => (string) $language->{PlatformLanguageInterface::ATTR_BCP47_CODE},
                TranslationInterface::ATTR_VALUE              => $result->translatedText,
                TranslationInterface::ATTR_SOURCE             => TranslationSource::Machine,
                TranslationInterface::ATTR_PROVIDER           => $result->driver,
                TranslationInterface::ATTR_QUALITY_SCORE      => $result->qualityScore,
                TranslationInterface::ATTR_SOURCE_HASH        => \hash('sha256', $this->sourceText),
                TranslationInterface::ATTR_TRANSLATION_JOB_ID => $this->jobId,
                TranslationInterface::ATTR_IS_STALE           => false,
            ],
        );

        if ($this->jobId !== null) {
            $jobs->incrementTranslatedKeys($this->jobId);
        }

        $events->dispatch(new MachineTranslationCompleted(
            tenantId: (string) ($this->tenantId ?? ''),
            translationId: (string) $translation->getKey(),
            namespace: $this->namespace,
            key: $this->key,
            localeCode: (string) $language->{PlatformLanguageInterface::ATTR_BCP47_CODE},
            driver: $result->driver,
            qualityScore: $result->qualityScore,
            durationMs: $result->durationMs,
        ));
    }

    /**
     * Record a failure — fire the failed event + increment the
     * parent job's failed counter.
     */
    private function recordFailure(
        TranslationJobRepositoryInterface $jobs,
        Dispatcher $events,
        string $errorClass,
        string $errorMessage,
    ): void {
        if ($this->jobId !== null) {
            $jobs->incrementFailedKeys($this->jobId);
        }

        $events->dispatch(new MachineTranslationFailed(
            tenantId: (string) ($this->tenantId ?? ''),
            namespace: $this->namespace,
            key: $this->key,
            localeCode: $this->targetLocale,
            driver: $this->driver ?? 'unknown',
            errorClass: $errorClass,
            errorMessage: $errorMessage,
        ));
    }

    /**
     * Called by the queue framework after retries are exhausted.
     */
    public function failed(\Throwable $e): void
    {
        // Diagnostic breadcrumb — the queue framework already logs
        // the throwable.
    }
}

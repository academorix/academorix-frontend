<?php

declare(strict_types=1);

namespace Stackra\Localization\Jobs;

use Stackra\Localization\Contracts\Data\TranslationInterface;
use Stackra\Localization\Contracts\Data\TranslationJobInterface;
use Stackra\Localization\Contracts\Repositories\TranslationJobRepositoryInterface;
use Stackra\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Stackra\Localization\Enums\TranslationJobStatus;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Fan out {@see TranslateJob} dispatches for every source-language
 * key under a `(namespace, group)` for a target locale.
 *
 * Reads the source keys from the caller's tenant-scoped Translation
 * rows in the source locale, then queues one child job per key.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Queue('translations')]
#[Timeout(3600)]
#[Tries(2)]
final class BulkTranslateNamespaceJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string       $translationJobId  Parent TranslationJob row id.
     * @param  string       $tenantId          Owning tenant.
     * @param  string       $sourceLocale     BCP-47 source tag.
     * @param  string       $targetLocale     BCP-47 target tag.
     * @param  string       $namespace         Namespace bucket.
     * @param  string|null  $group             Optional group filter.
     * @param  string|null  $driver            Optional driver override.
     */
    public function __construct(
        public readonly string $translationJobId,
        public readonly string $tenantId,
        public readonly string $sourceLocale,
        public readonly string $targetLocale,
        public readonly string $namespace,
        public readonly ?string $group,
        public readonly ?string $driver,
    ) {
    }

    /**
     * Enumerate source rows + fan out per-key child jobs.
     */
    public function handle(
        TranslationRepositoryInterface $translations,
        TranslationJobRepositoryInterface $jobs,
    ): void {
        $job = $jobs->find($this->translationJobId);
        if ($job === null) {
            return;
        }

        $job->update([
            TranslationJobInterface::ATTR_STATUS     => TranslationJobStatus::Running,
            TranslationJobInterface::ATTR_STARTED_AT => CarbonImmutable::now(),
        ]);

        // Read the source rows — for the initial namespace-bulk case
        // we assume the source locale already has manual / imported
        // rows in the Translation table.
        $sourceRows = $translations->query()
            ->where(TranslationInterface::ATTR_TENANT_ID, $this->tenantId)
            ->where(TranslationInterface::ATTR_LOCALE_CODE, $this->sourceLocale)
            ->where(TranslationInterface::ATTR_NAMESPACE, $this->namespace)
            ->when(
                $this->group !== null,
                fn ($query) => $query->where(TranslationInterface::ATTR_GROUP, $this->group),
            )
            ->get();

        $job->update([
            TranslationJobInterface::ATTR_TOTAL_KEYS => $sourceRows->count(),
        ]);

        foreach ($sourceRows as $row) {
            TranslateJob::dispatch(
                tenantId: $this->tenantId,
                sourceText: (string) $row->{TranslationInterface::ATTR_VALUE},
                sourceLocale: $this->sourceLocale,
                targetLocale: $this->targetLocale,
                namespace: (string) $row->{TranslationInterface::ATTR_NAMESPACE},
                group: (string) $row->{TranslationInterface::ATTR_GROUP},
                key: (string) $row->{TranslationInterface::ATTR_KEY},
                driver: $this->driver,
                jobId: $this->translationJobId,
            );
        }

        $job->update([
            TranslationJobInterface::ATTR_STATUS      => TranslationJobStatus::Completed,
            TranslationJobInterface::ATTR_FINISHED_AT => CarbonImmutable::now(),
        ]);
    }

    /**
     * Called by the queue framework after retries are exhausted.
     */
    public function failed(\Throwable $e): void
    {
        // Best-effort — mark the parent job failed so the tenant
        // sees the terminal state.
        try {
            /** @var TranslationJobRepositoryInterface $jobs */
            $jobs = \app(TranslationJobRepositoryInterface::class);
            $job  = $jobs->find($this->translationJobId);

            if ($job !== null) {
                $job->update([
                    TranslationJobInterface::ATTR_STATUS        => TranslationJobStatus::Failed,
                    TranslationJobInterface::ATTR_FINISHED_AT   => CarbonImmutable::now(),
                    TranslationJobInterface::ATTR_ERROR_MESSAGE => $e->getMessage(),
                ]);
            }
        } catch (\Throwable) {
            // Silent — the queue framework already recorded the
            // underlying failure.
        }
    }
}

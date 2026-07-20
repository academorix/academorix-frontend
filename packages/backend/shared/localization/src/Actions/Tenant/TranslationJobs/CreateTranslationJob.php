<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\TranslationJobs;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Data\TranslationJobInterface;
use Academorix\Localization\Contracts\Repositories\TranslationJobRepositoryInterface;
use Academorix\Localization\Data\Requests\CreateTranslationJobRequestData;
use Academorix\Localization\Data\Resources\TranslationJobData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Enums\TranslationJobStatus;
use Academorix\Localization\Jobs\BulkTranslateNamespaceJob;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/translation-jobs` — dispatch a bulk translation
 * job.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translation_jobs.create')]
#[Post('/api/v1/translation-jobs')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationJobsCreate)]
final class CreateTranslationJob
{
    use AsController;

    public function __construct(
        private readonly TranslationJobRepositoryInterface $jobs,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CreateTranslationJobRequestData $data): TranslationJobData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $job = $this->jobs->create([
            TranslationJobInterface::ATTR_TENANT_ID        => (string) $tenant->getKey(),
            TranslationJobInterface::ATTR_KIND             => $data->kind,
            TranslationJobInterface::ATTR_DRIVER           => $data->driver ?? 'null',
            TranslationJobInterface::ATTR_SOURCE_LOCALE    => $data->sourceLocale,
            TranslationJobInterface::ATTR_TARGET_LOCALE    => $data->targetLocale,
            TranslationJobInterface::ATTR_STATUS           => TranslationJobStatus::Queued,
            TranslationJobInterface::ATTR_NAMESPACE_FILTER => $data->namespaceFilter,
            TranslationJobInterface::ATTR_GROUP_FILTER     => $data->groupFilter,
        ]);

        BulkTranslateNamespaceJob::dispatch(
            translationJobId: (string) $job->getKey(),
            tenantId: (string) $tenant->getKey(),
            sourceLocale: $data->sourceLocale,
            targetLocale: $data->targetLocale,
            namespace: $data->namespaceFilter ?? '*',
            group: $data->groupFilter,
            driver: $data->driver,
        );

        return TranslationJobData::fromModel($job);
    }
}

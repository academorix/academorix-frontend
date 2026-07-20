<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\TranslationJobs;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Data\TranslationJobInterface;
use Academorix\Localization\Contracts\Repositories\TranslationJobRepositoryInterface;
use Academorix\Localization\Data\Resources\TranslationJobData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\TranslationJob;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/translation-jobs` — list translation jobs scoped to
 * the caller's tenant.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translation_jobs.list')]
#[Get('/api/v1/translation-jobs')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationJobsViewAny)]
final class ListTranslationJobs
{
    use AsController;

    public function __construct(
        private readonly TranslationJobRepositoryInterface $jobs,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, TranslationJobData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->jobs->query()
            ->where(TranslationJobInterface::ATTR_TENANT_ID, (string) $tenant->getKey())
            ->orderByDesc(TranslationJobInterface::ATTR_CREATED_AT)
            ->limit(100)
            ->get()
            ->map(static fn (TranslationJob $job): TranslationJobData => TranslationJobData::fromModel($job));

        return new DataCollection(TranslationJobData::class, $rows);
    }
}

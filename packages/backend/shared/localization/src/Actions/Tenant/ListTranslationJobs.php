<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Data\TranslationJobInterface;
use Stackra\Localization\Contracts\Repositories\TranslationJobRepositoryInterface;
use Stackra\Localization\Data\Resources\TranslationJobData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\TranslationJob;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
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

<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\TranslationJobs;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Data\Resources\TranslationJobData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\TranslationJob;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/translation-jobs/{translationJob}` — read one job.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translation_jobs.show')]
#[Get('/api/v1/translation-jobs/{translationJob}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationJobsView)]
final class ShowTranslationJob
{
    use AsController;

    public function __invoke(TranslationJob $translationJob): TranslationJobData
    {
        return TranslationJobData::fromModel($translationJob);
    }
}

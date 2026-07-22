<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Data\Resources\TranslationJobData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\TranslationJob;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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

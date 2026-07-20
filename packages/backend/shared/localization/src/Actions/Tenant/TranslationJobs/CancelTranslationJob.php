<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\TranslationJobs;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Data\TranslationJobInterface;
use Academorix\Localization\Data\Resources\TranslationJobData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Enums\TranslationJobStatus;
use Academorix\Localization\Models\TranslationJob;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/translation-jobs/{translationJob}/cancel` — cancel
 * a running job. The bulk-translate worker checks the status field
 * on each iteration and exits cleanly when it observes
 * `cancelled`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translation_jobs.cancel')]
#[Post('/api/v1/translation-jobs/{translationJob}/cancel')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationJobsCancel)]
final class CancelTranslationJob
{
    use AsController;

    public function __invoke(TranslationJob $translationJob): TranslationJobData
    {
        $translationJob->fill([
            TranslationJobInterface::ATTR_STATUS      => TranslationJobStatus::Cancelled,
            TranslationJobInterface::ATTR_FINISHED_AT => now(),
        ])->save();

        return TranslationJobData::fromModel($translationJob);
    }
}

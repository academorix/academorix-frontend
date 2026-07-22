<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Data\TranslationJobInterface;
use Stackra\Localization\Data\Resources\TranslationJobData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Enums\TranslationJobStatus;
use Stackra\Localization\Models\TranslationJob;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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

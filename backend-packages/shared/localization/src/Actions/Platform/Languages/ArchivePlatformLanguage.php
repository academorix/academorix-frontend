<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Platform\Languages;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Data\PlatformLanguageInterface;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\PlatformLanguage;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/platform/languages/{language}` — platform-admin
 * archive. Soft-delete via the SoftDeletes trait on the model;
 * refused when tenants reference the row (observer guard).
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.platform.languages.archive')]
#[Delete('/api/v1/platform/languages/{language}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(LocalizationPermission::PlatformLanguagesArchive)]
final class ArchivePlatformLanguage
{
    use AsController;

    public function __invoke(PlatformLanguage $language): JsonResponse
    {
        // Prefer archive-by-flag over soft-delete — leaves the row
        // reachable to tenants that already reference it while
        // hiding it from the enable picker.
        $language->fill([
            PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE => false,
        ])->save();

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}

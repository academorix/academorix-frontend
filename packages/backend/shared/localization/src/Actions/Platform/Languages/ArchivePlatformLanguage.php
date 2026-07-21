<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Platform\Languages;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\PlatformLanguage;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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

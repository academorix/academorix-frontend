<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Platform\Languages;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Data\Resources\PlatformLanguageData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\PlatformLanguage;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/platform/languages/{language}` — platform-admin read
 * of one catalogue row.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.platform.languages.show')]
#[Get('/api/v1/platform/languages/{language}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(LocalizationPermission::PlatformLanguagesView)]
final class ShowPlatformLanguage
{
    use AsController;

    public function __invoke(PlatformLanguage $language): PlatformLanguageData
    {
        return PlatformLanguageData::fromModel($language);
    }
}
